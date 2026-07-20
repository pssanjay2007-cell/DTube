document.addEventListener("DOMContentLoaded", () => {
	const uploadForm = document.getElementById("upload-form");
	const uploadStatus = document.getElementById("upload-status");
	const publishbtn = document.getElementById("publish-btn");

	const profilebtn = document.getElementById("btn-profile");
	const logoutbtn = document.getElementById("btn-logout");

	const MENU_FEED = document.getElementById("menu-feed");
	const MENU_STUDIO = document.getElementById("menu-studio");

	if (MENU_STUDIO) {
		MENU_STUDIO.classList.add("active");
	}

	if (MENU_FEED) {
		MENU_FEED.addEventListener("click", () => {
			window.location.href = "/index.html";
		});
	}

	if (profilebtn) {
		profilebtn.addEventListener("click", () => {
			window.location.href = "/profile.html";
		});
	}

	if (logoutbtn) {
		logoutbtn.addEventListener("click", async () => {
			if (confirm("Are you sure want to logout?..")) {
				await logoutUser();
			}
		});
	}

	if (uploadForm) {
		uploadForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const fileInput = document.getElementById("video-file");
			const titleInput = document.getElementById("video-title");
			const descInput = document.getElementById("video-desc");

			if (
				!fileInput ||
				fileInput.files.length === 0 ||
				fileInput.files.length > 1
			) {
				showStatus("Please select a file to upload", "error");
				return;
			}

			const formData = new FormData();

			formData.append("video", fileInput.files[0]);
			formData.append("title", titleInput.value.trim());
			formData.append("description", descInput.value.trim());

			try {
				showStatus("Uploading to cloud", "loading");
				if (publishbtn) {
					publishbtn.disabled = true;
					publishbtn.textContent = "Uploading..";
				}

				const response = await secureFetch(
					"http://127.0.0.1:5000/api/videos/upload",
					{
						method: "POST",
						body: formData,
					},
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "Upload process rejected");
				}
				showStatus(
					"Success! Video published to DTube safely. Redirecting to feed...",
					"success",
				);

				setTimeout(() => {
					window.location.href = "/index.html";
				}, 2000);
			} catch (err) {
				showStatus(`Upload Failed: ${err.message}`, "error");
				if (publishbtn) {
					publishbtn.disabled = false;
					publishbtn.textContent = "Upload Video";
				}
			}
		});
	}

	function showStatus(msg, type) {
		if (!uploadStatus) return;
		uploadStatus.textContent = msg;
		uploadStatus.style.padding = "12px";
		uploadStatus.style.marginTop = "16px";
		uploadStatus.style.borderRadius = "4px";
		uploadStatus.style.fontSize = "14px";

		if (type === "error") {
			uploadStatus.style.color = "#ff4d4d";
			uploadStatus.style.backgroundColor = "rgba(255, 77, 77, 0.1)";
		} else if (type === "success") {
			uploadStatus.style.color = "#00ff66";
			uploadStatus.style.backgroundColor = "rgba(0, 255, 102, 0.1)";
		} else {
			uploadStatus.style.color = "#a0a0ab";
			uploadStatus.style.backgroundColor = "rgba(160, 160, 171, 0.1)";
		}
	}
});
