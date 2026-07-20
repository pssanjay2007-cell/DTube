const VIDEO_PLAYER = document.getElementById("dtube-player");
const VIDEO_TITLE = document.getElementById("player-video-title");
const CREATOR_NAME = document.getElementById("player-creator-name");
const VIDEO_VIEWS = document.getElementById("player-video-views");
const VIDEO_DESC = document.getElementById("player-video-desc");

const COMMENT_FORM = document.getElementById("comment-form");
const COMMENT_INPUT = document.getElementById("comment-text");
const COMMENTS_COUNT = document.getElementById("comments-count");
const COMMENTS_LIST = document.getElementById("comments-list");

const REPORT_BTN = document.getElementById("btn-report");
const SUBSCRIBE_BTN = document.getElementById("btn-subscribe");
const ADMIN_DESK_BTN = document.getElementById("menu-admin");

const LIKE_BUTTON = document.getElementById("like-btn");
const DISLIKE_BUTTON = document.getElementById("dislike-btn");
const LIKE_COUNT = document.getElementById("like-count");
const DISLIKE_COUNT = document.getElementById("dislike-count");

const LOGOUT_BTN = document.getElementById("btn-logout");
const PROFILE_BTN = document.getElementById("btn-profile");
const MENU_FEED = document.getElementById("menu-feed");
const MENU_TRENDING = document.getElementById("menu-trending");
const MENU_STUDIO = document.getElementById("menu-studio");

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get("v");

let videoCreatorId = null;

document.addEventListener("DOMContentLoaded", () => {
	if (!videoId) {
		alert("No video identifier specified. Returning to feed dashboard.");
		window.location.href = "/index.html";
		return;
	}

	initializeWatchPage();
	setupNavigationListeners();

	if (COMMENT_FORM) {
		COMMENT_FORM.addEventListener("submit", handleCommentSubmit);
	}

	if (REPORT_BTN) {
		REPORT_BTN.addEventListener("click", handleVideoReport);
	}

	if (SUBSCRIBE_BTN) {
		SUBSCRIBE_BTN.addEventListener("click", handleSubscribeToggle);
	}
	if (LIKE_BUTTON) {
		LIKE_BUTTON.addEventListener("click", () => handleToggle("like"));
	}
	if (DISLIKE_BUTTON) {
		DISLIKE_BUTTON.addEventListener("click", () => handleToggle("dislike"));
	}
});

async function initializeWatchPage() {
	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/${videoId}`,
		);
		const data = await response.json();

		if (!response.ok)
			throw new Error(data.message || "Failed to load feed data.");

		const currentVideo = data.video;
		if (!currentVideo)
			throw new Error("The requested video could not be located.");

		videoCreatorId = currentVideo.creator?._id;

		renderVideoData(currentVideo);
		if (LIKE_BUTTON) LIKE_BUTTON.classList.remove("active");
		if (DISLIKE_BUTTON) DISLIKE_BUTTON.classList.remove("active");

		if (data.interaction?.hasLiked && LIKE_BUTTON)
			LIKE_BUTTON.classList.add("active");
		if (data.interaction?.hasDisliked && DISLIKE_BUTTON)
			DISLIKE_BUTTON.classList.add("active");

		await checkInitialSubscriptionStatus();

		incrementViewCount();
		logToWatchHistory();
		checkAdminStatus();
	} catch (err) {
		console.error("Watch workspace initialization error:", err.message);
		showWorkspaceError(err.message);
	}
}

function renderVideoData(video) {
	if (VIDEO_PLAYER) VIDEO_PLAYER.src = video.videoUrl;
	if (VIDEO_TITLE) VIDEO_TITLE.textContent = video.title;
	if (CREATOR_NAME)
		CREATOR_NAME.textContent = `@${video.creator?.username || "Anonymous Creator"}`;
	if (VIDEO_VIEWS) VIDEO_VIEWS.textContent = `👁️ ${video.views} views`;
	if (VIDEO_DESC)
		VIDEO_DESC.textContent =
			video.description || "No description provided.";

	if (LIKE_COUNT) {
		LIKE_COUNT.textContent = video.likesCount || 0;
	}
	if (DISLIKE_COUNT) {
		DISLIKE_COUNT.textContent = video.dislikesCount || 0;
	}

	renderCommentsList(video.comments || []);
}

async function handleToggle(type) {
	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/${videoId}/${type}`,
			{ method: "POST" },
		);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || "Interaction prohibited by backend",
			);
		}

		if (LIKE_COUNT) LIKE_COUNT.textContent = data.likesCount;
		if (DISLIKE_COUNT) DISLIKE_COUNT.textContent = data.dislikesCount;

		if (type === "like" && LIKE_BUTTON && DISLIKE_BUTTON) {
			LIKE_BUTTON.classList.toggle("active");
			DISLIKE_BUTTON.classList.remove("active");
		} else if (type === "dislike" && DISLIKE_BUTTON && LIKE_BUTTON) {
			DISLIKE_BUTTON.classList.toggle("active");
			LIKE_BUTTON.classList.remove("active");
		}
	} catch (err) {
		alert(`Voting process fault: ${err.message}`);
	}
}

function renderCommentsList(comments) {
	if (!COMMENTS_LIST) return;
	COMMENTS_LIST.innerHTML = "";

	if (COMMENTS_COUNT)
		COMMENTS_COUNT.textContent = `Comments (${comments.length})`;

	if (comments.length === 0) {
		COMMENTS_LIST.innerHTML = `<p style="color: #a0a0ab; font-size: 14px; padding: 10px 0;">No comments posted yet. Be the first to start the discussion!</p>`;
		return;
	}

	[...comments].reverse().forEach((comment) => {
		const commentRow = document.createElement("div");
		commentRow.className = "user-comment-item";
		commentRow.style.padding = "12px 0";
		commentRow.style.borderBottom = "1px solid #27272a";

		commentRow.innerHTML = `
            <div style="font-size: 13px; color: #f4f4f5; font-weight: 600; margin-bottom: 4px;">@${comment.username || "Anonymous User"}</div>
            <div style="font-size: 14px; color: #d4d4d8; line-height: 1.4;">${comment.text}</div>
        `;
		COMMENTS_LIST.appendChild(commentRow);
	});
}

async function handleCommentSubmit(e) {
	e.preventDefault();
	const text = COMMENT_INPUT.value.trim();

	if (!text) return;

	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/comment`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ videoId, text }),
			},
		);

		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Comment request rejected.");

		renderCommentsList(data.comments);
		COMMENT_INPUT.value = "";
	} catch (err) {
		alert(`Could not post comment: ${err.message}`);
	}
}

async function handleSubscribeToggle() {
	if (!videoCreatorId) {
		alert("Creator identity metadata context still processing.");
		return;
	}

	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/users/subscribe/${videoCreatorId}`,
			{
				method: "POST",
			},
		);

		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Subscription update failed.");

		updateSubscribeButtonUI(data.subscribed);
	} catch (err) {
		alert(`Subscription fault: ${err.message}`);
	}
}

async function checkInitialSubscriptionStatus() {
	if (!videoCreatorId) return;
	try {
		const response = await secureFetch(
			"http://127.0.0.1:5000/api/users/me",
		);
		if (response.ok) {
			const data = await response.json();
			const alreadySubscribed =
				data.user?.subscriptions?.includes(videoCreatorId);
			updateSubscribeButtonUI(alreadySubscribed);
		}
	} catch (err) {
		console.warn("Subscription lookahead query deferred:", err.message);
	}
}

function updateSubscribeButtonUI(isSubscribed) {
	if (!SUBSCRIBE_BTN) return;
	if (isSubscribed) {
		SUBSCRIBE_BTN.textContent = "Subscribed";
		SUBSCRIBE_BTN.style.backgroundColor = "#27272a";
	} else {
		SUBSCRIBE_BTN.textContent = "Subscribe";
		SUBSCRIBE_BTN.style.backgroundColor = "#cc0000";
	}
}

async function handleVideoReport() {
	const reason = prompt(
		"Please enter the reason for flagging/reporting this content:",
	);
	if (!reason || !reason.trim()) return;

	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/report`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ videoId, reason: reason.trim() }),
			},
		);

		const responseText = await response.text();
		let data = {};
		if (responseText) {
			try {
				data = JSON.parse(responseText);
			} catch (e) {
				console.error("Non-JSON server response:", responseText);
			}
		}

		if (!response.ok)
			throw new Error(data.message || "Report could not be processed.");

		alert(
			"Thank you. This video has been flagged for administrative overview.",
		);
		if (REPORT_BTN) {
			REPORT_BTN.textContent = "⚠️ Flagged";
			REPORT_BTN.disabled = true;
			REPORT_BTN.style.opacity = "0.5";
		}
	} catch (err) {
		alert(`Reporting failed: ${err.message}`);
	}
}

async function incrementViewCount() {
	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/${videoId}/view`,
			{
				method: "PATCH",
			},
		);
		const data = await response.json();
		if (response.ok && VIDEO_VIEWS) {
			VIDEO_VIEWS.textContent = `👁️ ${data.views} views`;
		}
	} catch (err) {
		console.warn("View logging trace deferred:", err.message);
	}
}

async function logToWatchHistory() {
	try {
		await secureFetch(`http://127.0.0.1:5000/api/videos/history`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ videoId }),
		});
	} catch (err) {
		console.warn("Watch history sync deferred:", err.message);
	}
}

function checkAdminStatus() {
	if (
		typeof getLocalUserRole === "function" &&
		getLocalUserRole() === "admin"
	) {
		if (ADMIN_DESK_BTN) ADMIN_DESK_BTN.style.display = "block";
	}
}

function setupNavigationListeners() {
	if (PROFILE_BTN)
		PROFILE_BTN.addEventListener(
			"click",
			() => (window.location.href = "/profile.html"),
		);
	if (MENU_FEED)
		MENU_FEED.addEventListener(
			"click",
			() => (window.location.href = "/index.html"),
		);
	if (MENU_TRENDING)
		MENU_TRENDING.addEventListener(
			"click",
			() => (window.location.href = "/index.html?feed=trending"),
		);
	if (MENU_STUDIO)
		MENU_STUDIO.addEventListener(
			"click",
			() => (window.location.href = "/upload.html"),
		);
	if (ADMIN_DESK_BTN)
		ADMIN_DESK_BTN.addEventListener(
			"click",
			() => (window.location.href = "/admin.html"),
		);

	if (LOGOUT_BTN) {
		LOGOUT_BTN.addEventListener("click", async () => {
			if (confirm("Are you sure want to exit?...")) {
				if (typeof logoutUser === "function") await logoutUser();
				else window.location.href = "/login.html";
			}
		});
	}
}

function showWorkspaceError(msg) {
	if (VIDEO_TITLE) VIDEO_TITLE.textContent = "Error Loading Stream Content";
	if (VIDEO_DESC) VIDEO_DESC.textContent = `Reason: ${msg}`;
}
