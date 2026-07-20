document.addEventListener("DOMContentLoaded", async () => {
	if (
		typeof getLocalUserRole !== "function" ||
		getLocalUserRole() !== "admin"
	) {
		alert("User access restricted! Unauthorized.");
		window.location.href = "/index.html";
		return;
	}

	setupAdminSidebarNavigation();
	await loadReportedContentQueue();
});

function setupAdminSidebarNavigation() {
	const MENU_FEED = document.getElementById("menu-feed");
	const MENU_TRENDING = document.getElementById("menu-trending");
	const MENU_STUDIO = document.getElementById("menu-studio");
	const logoutBtn = document.getElementById("btn-logout");

	if (MENU_FEED) {
		MENU_FEED.addEventListener("click", () => {
			window.location.href = "/index.html";
		});
	}

	if (MENU_TRENDING) {
		MENU_TRENDING.addEventListener("click", () => {
			window.location.href = "/index.html?feed=trending";
		});
	}

	if (MENU_STUDIO) {
		MENU_STUDIO.addEventListener("click", () => {
			window.location.href = "/upload.html";
		});
	}

	if (logoutBtn) {
		logoutBtn.addEventListener("click", async () => {
			if (confirm("Are you sure you want to sign out?")) {
				if (typeof logoutUser === "function") {
					await logoutUser();
				} else {
					sessionStorage.clear();
					localStorage.clear();
					window.location.href = "/login.html";
				}
			}
		});
	}
}

async function loadReportedContentQueue() {
	const flaggedContainer = document.getElementById("flagged-queue-list");
	if (!flaggedContainer) return;

	flaggedContainer.innerHTML = `<div style="color: #a0a0ab; padding: 16px;">Fetching reported assets from moderation database...</div>`;

	try {
		const response = await secureFetch(
			"http://127.0.0.1:5000/api/admin/flagged-content",
		);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to synchronize moderation data.",
			);
		}

		const videos = data.videos || data.reports || [];
		if (videos.length === 0) {
			flaggedContainer.innerHTML = `<div style="color: #a0a0ab; padding: 16px;">No flagged videos currently pending administrative review.</div>`;
			return;
		}

		flaggedContainer.innerHTML = "";

		videos.forEach((video) => {
			const reportCard = document.createElement("div");
			reportCard.className = "user-comment-item";
			reportCard.style.cssText = `
                background-color: #24242b;
                border: 1px solid #3a3a44;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

			const firstReportReason =
				video.reports && video.reports.length > 0
					? video.reports[0].reason
					: "No detail specified.";
			const creatorUsername = video.creator?.username || "Unknown";

			reportCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="font-size: 16px; color: #ffffff; margin: 0 0 4px 0; font-weight: 600;">${video.title || "Untitled Asset"}</h4>
                        <p style="font-size: 13px; color: #a0a0ab; margin: 0 0 6px 0;">Creator: @${creatorUsername}</p>
                        <p style="font-size: 13px; color: #d4d4d8; margin: 0; line-height: 1.4;">
                            <strong>Flag Reason:</strong> ${firstReportReason}
                        </p>
                    </div>
                    <button class="sub-btn subscribed btn-dismiss" style="border-radius: 4px; padding: 6px 12px; font-size: 12px;">
                        Dismiss Flag
                    </button>
                </div>

                <div style="display: flex; gap: 10px; border-top: 1px solid #3a3a44; padding-top: 12px; margin-top: 4px;">
                    <button class="card-delete-btn btn-delete-only" style="margin: 0; flex: 1; background-color: #1a1a24; color: #ff4d4d; border: 1px solid #ff4d4d;">
                        Delete Video Only
                    </button>
                    <button class="card-delete-btn btn-approve-strike" style="margin: 0; flex: 1; background-color: #cc0000; color: #ffffff; border: 1px solid #cc0000;">
                        Approve Strike & Remove
                    </button>
                    <button class="card-delete-btn btn-ban-channel" style="margin: 0; flex: 1; background-color: #800000; color: #ffffff; border: 1px solid #660000;">
                        Ban Channel
                    </button>
                </div>
            `;

			reportCard
				.querySelector(".btn-dismiss")
				.addEventListener("click", () =>
					performModerationAction(video._id, "dismiss"),
				);
			reportCard
				.querySelector(".btn-delete-only")
				.addEventListener("click", () =>
					deleteVideoBeforeStrike(video._id),
				);
			reportCard
				.querySelector(".btn-approve-strike")
				.addEventListener("click", () =>
					performModerationAction(video._id, "strike"),
				);
			reportCard
				.querySelector(".btn-ban-channel")
				.addEventListener("click", () =>
					performModerationAction(video._id, "ban", creatorUsername),
				);

			flaggedContainer.appendChild(reportCard);
		});
	} catch (err) {
		console.error("Queue loader crash:", err);
		flaggedContainer.innerHTML = `<div style="color: #ff3333; padding: 16px;">Moderation sync exception trace: ${err.message}</div>`;
	}
}

async function performModerationAction(videoId, action, creatorUsername = "") {
	if (action === "strike") {
		const confirmStrike = confirm(
			"Warning: Approve flag and apply an official strike to creator's account?",
		);
		if (!confirmStrike) return;
	}

	if (action === "ban") {
		const confirmBan = confirm(
			`CRITICAL WARNING: Permanently ban user @${creatorUsername}? This will purge all channel content.`,
		);
		if (!confirmBan) return;
	}

	try {
		const response = await secureFetch(
			"http://127.0.0.1:5000/api/admin/moderate",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ videoId, action }),
			},
		);

		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Moderation action failed.");

		alert(data.message || "Action processed successfully.");
		await loadReportedContentQueue();
	} catch (err) {
		alert(`Moderation Error: ${err.message}`);
	}
}

async function deleteVideoBeforeStrike(videoId) {
	const confirmation = confirm(
		"Confirm: Delete this media asset without incrementing creator strike count?",
	);
	if (!confirmation) return;

	try {
		const response = await secureFetch(
			`http://127.0.0.1:5000/api/videos/${videoId}`,
			{
				method: "DELETE",
			},
		);

		const data = await response.json();
		if (!response.ok)
			throw new Error(data.message || "Video deletion failed.");

		alert("Media asset removed cleanly.");
		await loadReportedContentQueue();
	} catch (err) {
		alert(`Deletion error: ${err.message}`);
	}
}
