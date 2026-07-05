document.addEventListener("DOMContentLoaded", async () => {
	const usernameElement = document.getElementById("profile-username");
	const emailElement = document.getElementById("profile-email");
	const videoCountElement = document.getElementById("stat-video-count");
	const subscriberCountElement = document.getElementById("stat-subscribers");
	const videoGrid = document.getElementById("my-video-grid");

	const MENU_FEED = document.getElementById("menu-feed");
	const MENU_STUDIO = document.getElementById("menu-studio");
	const tabMyContent = document.getElementById("my-content");
	const tabHistory = document.getElementById("watch-history");
	const logoutBtn = document.getElementById("btn-logout");

	if (MENU_FEED) {
		MENU_FEED.addEventListener("click", () => {
			window.location.href = "/index.html";
		});
	}

	if (MENU_STUDIO) {
		MENU_STUDIO.addEventListener("click", () => {
			window.location.href = "/upload.html";
		});
	}

	if (logoutBtn) {
		logoutBtn.addEventListener("click", async () => {
			if (confirm("Are you sure want to exit...")) {
				await logoutUser();
			}
		});
	}

	let allVideos = [];
	let watchHistoryList = [];
	let activeUsername = sessionStorage.getItem("username");

	async function fetchProfileData() {
		try {
			const videoRes = await secureFetch(
				"http://localhost:5000/api/videos",
			);
			const videoData = await videoRes.json();
			allVideos = videoData.videos || [];

			const userRes = await secureFetch(
				"http://localhost:5000/api/users/me",
			);
			if (userRes.ok) {
				const userData = await userRes.json();
				const realUser = userData.user;

				watchHistoryList = realUser?.watchHistory || [];
				activeUsername = realUser?.username || activeUsername;

				if (usernameElement && activeUsername)
					usernameElement.textContent = activeUsername;
				if (emailElement && realUser?.email)
					emailElement.textContent = realUser.email;

				if (videoCountElement)
					videoCountElement.textContent = userData.videoCount || 0;
				if (subscriberCountElement)
					subscriberCountElement.textContent =
						userData.subscriberCount || 0;
			}

			switchActiveTab("my-content");
		} catch (err) {
			console.error("Dashboard synchronization error:", err);
			if (videoGrid) {
				videoGrid.innerHTML = `<div style="color:#ff4d4d; padding:20px;">Failed to sync channel metadata: ${err.message}</div>`;
			}
		}
	}

	function renderVideos(videoList, emptyMessage) {
		if (!videoGrid) return;
		videoGrid.innerHTML = "";

		if (videoList.length === 0) {
			videoGrid.innerHTML = `<div style="color:#a0a0ab; padding:20px; grid-column:1/-1;">${emptyMessage}</div>`;
			return;
		}

		videoList.forEach((video) => {
			const card = document.createElement("div");
			card.className = "video-card";
			card.style.cssText =
				"background:#181820; border-radius:6px; overflow:hidden; cursor:pointer;";

			card.innerHTML = `
                <div class="thumbnail-wrapper" style="position:relative; width:100%; height:140px; background:#2a2a35; overflow:hidden;">
                    <video src="${video.videoUrl}" 
                           preload="auto"
                           style="width:100%; height:100%; object-fit:cover; pointer-events:none;">
                    </video>
                </div>
                <div style="padding:12px;">
                    <h4 style="margin:0 0 6px 0; font-size:14px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${video.title}">${video.title}</h4>
                    <p style="margin:0; font-size:12px; color:#a0a0ab;">${video.views || 0} views • ${new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
            `;

			card.addEventListener("click", () => {
				window.location.href = `/watch.html?v=${video._id}`;
			});

			const videoElement = card.querySelector("video");
			const container = card.querySelector(".thumbnail-wrapper");

			if (videoElement && container) {
				container.addEventListener("mouseenter", () => {
					videoElement.play().catch(() => {});
				});
				container.addEventListener("mouseleave", () => {
					videoElement.pause();
				});
			}

			videoGrid.appendChild(card);
		});
	}

	function switchActiveTab(targetTab) {
		if (targetTab === "my-content") {
			tabMyContent?.classList.add("active");
			tabHistory?.classList.remove("active");

			const myUploadedVideos = allVideos.filter(
				(v) => v.creator?.username === activeUsername,
			);
			renderVideos(
				myUploadedVideos,
				"You haven't published any streams yet.",
			);
		} else {
			tabHistory?.classList.add("active");
			tabMyContent?.classList.remove("active");

			const historyVideos = watchHistoryList
				.map((entry) => entry?.video)
				.filter(Boolean);

			renderVideos(
				historyVideos,
				"Your watch history library track is empty.",
			);
		}
	}

	tabMyContent?.addEventListener("click", () =>
		switchActiveTab("my-content"),
	);
	tabHistory?.addEventListener("click", () =>
		switchActiveTab("watch-history"),
	);

	await fetchProfileData();
});
