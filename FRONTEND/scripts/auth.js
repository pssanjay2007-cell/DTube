const BACKEND_URL = "https://dtube-api-5zzv.onrender.com";
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const errorMessageDiv = document.querySelector(".error-message");

let accessToken = sessionStorage.getItem("accessToken") || null;

async function secureFetch(url, options = {}) {
	options.headers = options.headers || {};
	options.credentials = "include";

	if (accessToken) {
		options.headers["Authorization"] = `Bearer ${accessToken}`;
	}

	let response = await fetch(url, options);

	if (response.status === 401) {
		console.warn("Access Token expired. Launching silent refresh loop..");
		const success = await refreshSessionToken();

		if (success) {
			options.headers["Authorization"] = `Bearer ${accessToken}`;
			response = await fetch(url, options);
		} else {
			console.error("Refresh token dead. Login again");
			accessToken = null;
			sessionStorage.removeItem("accessToken");
			if (!window.location.pathname.includes("login.html")) {
				window.location.href = "/login.html";
			}
		}
	}
	return response;
}

async function refreshSessionToken() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/refresh`, {
			method: "GET",
			credentials: "include",
		});

		if (response.ok) {
			const data = await response.json();
			accessToken = data.accessToken;
			sessionStorage.setItem("accessToken", accessToken);

			if (data.username) {
				sessionStorage.setItem("username", data.username);
			}

			if (data.role) {
				sessionStorage.setItem("role", data.role);
			}

			return true;
		}

		return false;
	} catch (err) {
		console.error("Network fault inside refresh loop", err);
		return false;
	}
}

// ======================================================================
// LOCAL SIGN-UP
// ======================================================================

if (signupForm) {
	signupForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const username = document
			.getElementById("signup-username")
			.value.trim();
		const email = document.getElementById("signup-email").value.trim();
		const password = document.getElementById("signup-password").value;

		try {
			const response = await fetch(
				`${BACKEND_URL}/api/auth/local/signup`,
				{
					method: "POST",
					headers: { "Content-type": "application/json" },
					body: JSON.stringify({ username, email, password }),
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Registration Failed");
			}

			accessToken = data.accessToken;
			if (accessToken) sessionStorage.setItem("accessToken", accessToken);

			sessionStorage.setItem("username", data.username);
			sessionStorage.setItem("role", data.role);

			window.location.href = "/index.html";
		} catch (err) {
			if (errorMessageDiv) errorMessageDiv.textContent = err.message;
		}
	});
}

// ======================================================================
// LOCAL LOG-IN
// ======================================================================

if (loginForm) {
	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const email = document.getElementById("login-email").value.trim();
		const password = document.getElementById("login-password").value;

		try {
			const response = await fetch(
				`${BACKEND_URL}/api/auth/local/login`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "LogIn Failed");
			}

			accessToken = data.accessToken;
			if (accessToken) sessionStorage.setItem("accessToken", accessToken);

			sessionStorage.setItem("username", data.username);
			sessionStorage.setItem("role", data.role);

			window.location.href = "/index.html";
		} catch (err) {
			if (errorMessageDiv) {
				errorMessageDiv.textContent = err.message;
			}
		}
	});
}

// ======================================================================
// OAUTH & INITIALIZATION HANDLERS
// ======================================================================

document.addEventListener("DOMContentLoaded", async () => {
	const googleBtn = document.getElementById("google-btn");
	const dauthBtn = document.getElementById("dauth-btn");

	if (googleBtn) {
		googleBtn.addEventListener("click", () => {
			window.location.href = `${BACKEND_URL}/api/auth/google/login`;
		});
	}
	if (dauthBtn) {
		dauthBtn.addEventListener("click", () => {
			window.location.href = `${BACKEND_URL}/api/auth/dauth/login`;
		});
	}

	const onAuthPage =
		window.location.pathname.includes("login.html") ||
		window.location.pathname.includes("signup.html");

	if (onAuthPage && !accessToken && !sessionStorage.getItem("username")) {
		console.log(
			"No active user session memory detected. Halting auto-login loop.",
		);
		return;
	}

	const initialized = await refreshSessionToken();

	if (!initialized && !onAuthPage) {
		window.location.href = "/login.html";
	} else if (initialized && onAuthPage) {
		window.location.href = "/index.html";
	}
});

// ======================================================================
// LOG OUT
// ======================================================================

async function logoutUser() {
	try {
		await fetch(`${BACKEND_URL}/api/logout`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});

		sessionStorage.clear();
		accessToken = null;

		window.location.href = "/login.html";
	} catch (err) {
		console.error("Platform clean sign-out failed: ", err);
		sessionStorage.clear();
		accessToken = null;
		window.location.href = "/login.html";
	}
}

function getLocalUserRole() {
	return sessionStorage.getItem("role");
}
