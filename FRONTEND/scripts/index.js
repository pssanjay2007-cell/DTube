const VIDEO_GRID = document.getElementById("video-grid");
const SEARCH_FORM = document.getElementById("search-form");
const SEARCH_INPUT = document.getElementById("search-input");
const FEED_TITLE = document.getElementById("feed-title");
const LOGOUT_BTN = document.getElementById("btn-logout");
const PROFILE_BTN = document.getElementById("btn-profile");

const MENU_FEED = document.getElementById("menu-feed");
const MENU_TRENDING = document.getElementById("menu-trending");
const MENU_STUDIO = document.getElementById("menu-studio");

let currentFeedType = "latest";

document.addEventListener("DOMContentLoaded", () => {
	loadFeed("latest");

	if (MENU_FEED) {
		MENU_FEED.addEventListener("click", () => {
			switchActiveTab(MENU_FEED);
			if (FEED_TITLE) FEED_TITLE.textContent = "Recommended Videos";
			loadFeed("latest");
		});
	}

	if (MENU_TRENDING) {
		MENU_TRENDING.addEventListener("click", () => {
			switchActiveTab(MENU_TRENDING);
			if (FEED_TITLE) FEED_TITLE.textContent = "Trending Videos";
			loadFeed("trending");
		});
	}

	if (MENU_STUDIO) {
		MENU_STUDIO.addEventListener("click", () => {
			window.location.href = "/upload.html";
		});
	}

	if (PROFILE_BTN) {
		PROFILE_BTN.addEventListener("click", () => {
			window.location.href = "/profile.html";
		});
	}

	if (LOGOUT_BTN) {
		LOGOUT_BTN.addEventListener("click", async () => {
			if (confirm("Are you sure want to exit?...")) {
				await logoutUser();
			}
		});
	}

	if (SEARCH_FORM) {
		SEARCH_FORM.addEventListener("submit", (e) => {
			e.preventDefault();
			const query = SEARCH_INPUT.value.trim();
			if (query) {
				if (FEED_TITLE)
					FEED_TITLE.textContent = `Search Results for ${query}`;
				switchActiveTab(null);
				loadSearch(query);
			}
		});
	}

	checkAdminStatus();
});

async function loadFeed(type) {
	currentFeedType = type;
	showLoading();
	try {
		let endpoint = "http://127.0.0.1:5000/api/videos";
		if (type === "trending") {
			endpoint += "?sort=trending";
		}
		const response = await secureFetch(endpoint);
		const data = await response.json();
		if (!response.ok) throw new Error(data.message || "Failed to load");
		renderVideos(data.videos);
	} catch (err) {
		showError(err.message);
	}
}

async function loadSearch(query) {
	currentFeedType = "search";
	showLoading();
	try {
		const endpoint = `http://127.0.0.1:5000/api/videos/search?q=${encodeURIComponent(query)}`;
		const response = await secureFetch(endpoint);
		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Search query rejected.");
		renderVideos(data.videos);
	} catch (err) {
		showError(err.message);
	}
}

function renderVideos(videos) {
	if (!VIDEO_GRID) return;
	VIDEO_GRID.innerHTML = "";

	if (!videos || videos.length === 0) {
		VIDEO_GRID.innerHTML = `<div class="empty-feed-alert" style="padding: 20px; color: #a0a0ab;">No videos found matching this context.</div>`;
		return;
	}

	videos.forEach((video) => {
		const card = document.createElement("div");
		card.className = "video-card";

		card.addEventListener("click", () => {
			window.location.href = `/watch.html?v=${video._id}`;
		});

		card.innerHTML = `
		<div class="thumbnail-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9; background-color: #000; overflow: hidden;">
			<video src="${video.videoUrl}" class="card-video-preview" muted preload="auto" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;"></video>
		</div>
		<div class="video-info">
			<h3 title="${video.title}" style="font-size: 15px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${video.title}</h3>
			<p style="font-size: 13px; color: #a0a0ab;">@${video.creator?.username || "Anonymous Creator"}</p>
			<div class="video-metadata-subrow" style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; color: #a0a0ab;">
				<span>${video.views} views</span>
				<span>${formatTimeAgo(video.createdAt)}</span>
			</div>
		</div>
		`;

		const videoElement = card.querySelector(".card-video-preview");
		const container = card.querySelector(".thumbnail-wrapper");

		if (videoElement && container) {
			container.addEventListener("mouseenter", () => {
				videoElement.play().catch((err) => {
					console.log(
						"Supabase stream handshake deferred:",
						err.message,
					);
				});
			});

			container.addEventListener("mouseleave", () => {
				videoElement.pause();
				videoElement.currentTime = 1;
			});
		}

		VIDEO_GRID.appendChild(card);
	});
}

function showLoading() {
	if (VIDEO_GRID)
		VIDEO_GRID.innerHTML = `<div class="loading-placeholder" style="color: #a0a0ab; padding: 20px;">Syncing feed data...</div>`;
}

function showError(msg) {
	if (VIDEO_GRID)
		VIDEO_GRID.innerHTML = `<div class="error-message-box" style="color: #ff0000; padding: 20px;">Error: ${msg}</div>`;
}

function switchActiveTab(activeButton) {
	const items = [MENU_FEED, MENU_TRENDING];
	items.forEach((btn) => {
		if (btn) btn.classList.remove("active");
	});
	if (activeButton) activeButton.classList.add("active");
}

function checkAdminStatus() {
	const adminMenuBtn = document.getElementById("menu-admin");
	if (!adminMenuBtn) return;

	const userRole =
		typeof getLocalUserRole === "function"
			? getLocalUserRole()
			: sessionStorage.getItem("userRole");

	if (userRole === "admin") {
		adminMenuBtn.style.display = "block"; // Unhide only for administrators

		adminMenuBtn.addEventListener("click", () => {
			window.location.href = "/admin.html";
		});
	} else {
		adminMenuBtn.style.display = "none"; // Hide by default for standard users
	}
}

function formatTimeAgo(dateString) {
	const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
	if (diff < 60) return "Just now";
	const mins = Math.floor(diff / 60);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}w ago`;
	const months = Math.floor(weeks / 4);
	if (months < 12) return `${months}m ago`;
	return `${Math.floor(months / 12)}y ago`;
}
