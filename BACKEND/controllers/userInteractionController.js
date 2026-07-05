const User = require("../models/User");
const Video = require("../models/Video");

const toggleSubscription = async (req, res) => {
	try {
		const targetChannelId = req.params.id;
		const currentUserId = req.user.id;

		if (currentUserId === targetChannelId) {
			return res.status(400).json({
				success: false,
				message: "You cannot subscribe to your own channel",
			});
		}

		const targetChannel = await User.findById(targetChannelId);
		const currentUser = await User.findById(currentUserId);

		if (!targetChannel) {
			return res
				.status(404)
				.json({ success: false, message: "Channel not found" });
		}

		const isSubscribed =
			currentUser.subscriptions.includes(targetChannelId);

		if (isSubscribed) {
			currentUser.subscriptions.pull(targetChannelId);
			await currentUser.save();

			const updatedSubscriberCount = await User.countDocuments({
				subscriptions: targetChannelId,
			});

			return res.status(200).json({
				success: true,
				subscribed: false,
				subscriberCount: updatedSubscriberCount,
				message: "Unsubscribed successfully.",
			});
		} else {
			currentUser.subscriptions.push(targetChannelId);
			await currentUser.save();

			const updatedSubscriberCount = await User.countDocuments({
				subscriptions: targetChannelId,
			});

			return res.status(200).json({
				success: true,
				subscribed: true,
				subscriberCount: updatedSubscriberCount,
				message: "Subscribed successfully.",
			});
		}
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const logWatchHistory = async (req, res) => {
	try {
		const { videoId } = req.body;
		const currentUserId = req.user.id;

		const video = await Video.findById(videoId);
		if (!video) {
			return res.status(404).json({
				success: false,
				message: "Video not found",
			});
		}

		video.views += 1;
		await video.save();

		const user = await User.findById(currentUserId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const targetIdStr = videoId.toString();

		user.watchHistory = user.watchHistory.filter(
			(item) =>
				item && item.video && item.video.toString() !== targetIdStr,
		);

		user.watchHistory.unshift({ video: videoId });
		await user.save();

		return res.status(200).json({
			success: true,
			message: "View recorded and history updated.",
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const getSubscriptionFeed = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		const feedVideos = await Video.find({
			creator: { $in: user.subscriptions },
		})
			.populate("creator", "username")
			.sort({ createdAt: -1 })
			.exec();

		return res.status(200).json({
			success: true,
			count: feedVideos.length,
			videos: feedVideos,
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = {
	toggleSubscription,
	logWatchHistory,
	getSubscriptionFeed,
};
