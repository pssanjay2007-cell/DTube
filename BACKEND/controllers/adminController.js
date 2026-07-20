const User = require("../models/User");
const Video = require("../models/Video");
const sendNotificationEmail = require("../utils/sendEmail");

const getFlaggedVideos = async (req, res) => {
	try {
		const flaggedVideos = await Video.find({
			"reports.0": { $exists: true },
		})
			.populate("creator", "username email status strikeCount")
			.populate("reports.reportedBy", "username");

		return res.status(200).json({
			success: true,
			count: flaggedVideos.length,
			reports: flaggedVideos,
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
			"username email status strikeCount",
		);

		if (!video) {
			return res
				.status(404)
				.json({ success: false, message: "Video not found." });
		}

		if (action === "dismiss") {
			video.reports = [];
			await video.save();

			return res.status(200).json({
				success: true,
				message: "Content flag cleared successfully.",
			});
		}

		if (action === "strike") {
			const creatorId = video.creator?._id || video.creator;

			if (!creatorId) {
				await Video.findByIdAndDelete(videoId);
				return res.status(200).json({
					success: true,
					message:
						"Video deleted, but no associated creator profile was found.",
				});
			}

			const updatedUser = await User.findByIdAndUpdate(
				creatorId,
				{ $inc: { strikeCount: 1 } },
				{ new: true },
			);

			if (updatedUser && updatedUser.strikeCount >= 3) {
				updatedUser.status = "banned";
				await updatedUser.save();
			}

			await Video.findByIdAndDelete(videoId);

			if (updatedUser && updatedUser.email) {
				const emailSubject =
					updatedUser.strikeCount >= 3
						? "Account Suspended - DTube"
						: "Content Violation Warning - DTube";

				let emailBody = `Hello @${updatedUser.username},\n\nYour video "${video.title}" was removed for violating community guidelines.\n\n`;

				if (updatedUser.strikeCount >= 3) {
					emailBody +=
						"Because you have accumulated 3 community strikes, your channel has been permanently banned.";
				} else {
					emailBody += `Current Total Strikes: ${updatedUser.strikeCount}/3.\nNote: Accumulating 3 strikes results in automated channel suspension.`;
				}

				try {
					await sendNotificationEmail(
						updatedUser.email,
						emailSubject,
						emailBody,
					);
				} catch (emailErr) {
					console.warn(
						"Notification email failed to send:",
						emailErr.message,
					);
				}
			}

			return res.status(200).json({
				success: true,
				message: `Strike issued successfully. Current channel strikes: ${updatedUser ? updatedUser.strikeCount : 1}/3. Video deleted.`,
			});
		}

		if (action === "ban") {
			const targetUser = await User.findById(video.creator);

			if (targetUser) {
				targetUser.status = "banned";
				await targetUser.save();
			}

			await Video.deleteMany({ creator: video.creator });

			if (targetUser && targetUser.email) {
				const emailSubject = "URGENT: DTube Channel Suspension Alert";
				const emailBody = `Hello @${targetUser.username},\n\nAn administrator has permanently suspended your account due to community guidelines violations on your content.`;

				try {
					await sendNotificationEmail(
						targetUser.email,
						emailSubject,
						emailBody,
					);
				} catch (emailErr) {
					console.warn(
						"Notification email failed to send:",
						emailErr.message,
					);
				}
			}

			return res.status(200).json({
				success: true,
				message: "Channel suspended permanently and videos purged.",
			});
		}

		return res.status(400).json({
			success: false,
			message: "Invalid moderator command specified.",
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = {
	getFlaggedVideos,
	moderateContent,
};
