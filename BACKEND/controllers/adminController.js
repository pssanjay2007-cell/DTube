const User = require("../models/User");
const Video = require("../models/Video");
const sendNotificationEmail = require("../utils/sendEmail");

const getFlaggedVideos = async (req, res) => {
	try {
		const flaggedVideos = await User.find({
			"reports.0": { $exists: true },
		})
			.populate("creator", "username email status strikes")
			.populate("reports.reportedBy", "username");

		return res.status(200).json({
			success: true,
			count: flaggedVideos.length,
			videos: flaggedVideos,
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const moderateContent = async (req, res) => {
	try {
		const { videoId, action } = req.body;

		const video = await Video.findById(videoId).populate(
			"creator",
			"username email status strikes",
		);

		if (!video) {
			return res
				.status(404)
				.json({ success: false, message: "Video not found" });
		}

		const targetUser = await User.findById(video.creator);

		if (action === "dismiss") {
			video.reports = [];
			await video.save();
			return res
				.status(200)
				.join({ success: true, message: "content flag cleared" });
		}

		if (action === "strike") {
			let emailSubject = "Content Violation Warning - DTube";
			let emailBody = `Hello @${targetUser.username},\n\nYour video "${video.title}" was removed for violating community guidelines. A community strike has been added to your profile.\n\n`;

			if (targetUser) {
				taargetUser.strikes = (targetUser.strikes || 0) + 1;

				if (targetUser.strikes >= 3) {
					targetUser.status = "banned";
					emailSubject = "Account Suspended - DTube";
					emailBody +=
						"Because you have accumulated 3 community strikes and your channel has been permanently banned";
				} else {
					emailBody += `Current Total Strikes :${targetUser.strikes}/3.\nNote: Accumulating 3 strikes results in automated channel deletion.`;
				}
				await targetUser.save();
			}

			await Video.findByIdAndDelete(videoId);

			if (targetUser && targetUser.email) {
				await sendNotificationEmail(
					targetUser.email,
					emailSubject,
					emailBody,
				);
			}

			return res.status(200).json({
				success: true,
				message: `Strike issued.Current channel strikes: ${targetUser ? targetUser.strikes : 1}. Video deleted,`,
			});
		}

		if (action === "ban") {
			if (targetUser) {
				targetUser.status = "banned";
				await targetUser.save();
			}

			await Video.deleteMany({ creator: video.creator });

			if (targetUser && targetUser.email) {
				const emailSubject = "URGENT: DTube Channel Suspension Alert";
				const emailBody = `Hello @${targetUser.username}.\n\nAn administrator have permanently deleted you account due to recent critics on your content.`;

				await sendNotificationEmail(
					targetUser.email,
					emailSubject,
					emailBody,
				);
			}
			return res.status(200).json({
				success: true,
				message: "Channel suspended permanently",
			});
		}
		return res
			.status(400)
			.json({ success: false, message: "Invalid moderator command" });
	} catch (err) {
		return res
			.status(500)
			.json({ success: false.valueOf, message: err.message });
	}
};

module.exports = {
	getFlaggedVideos,
	moderateContent,
};
