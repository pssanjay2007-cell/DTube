const Video = require("../models/Video");
const User = require("../models/User");

const toggleLikeVideo = async (req, res) => {
	try {
		const videoId = req.params.id;
		const userId = req.user.id;

		const video = await Video.findById(videoId).exec();
		if (!video)
			return res
				.status(404)
				.json({ success: false, message: "Video not found" });

		const user = await User.findById(userId).exec();
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		const isLiked = user.likedVideos.includes(videoId);
		const isDisliked = user.dislikedVideos.includes(videoId);

		if (isLiked) {
			await User.findByIdAndUpdate(userId, {
				$pull: { likedVideos: videoId },
			});
			await Video.findByIdAndUpdate(videoId, {
				$inc: { likesCount: -1 },
			});
			return res.status(200).json({
				success: true,
				message: "Like removed successfully",
				likesCount: video.likesCount - 1,
				dislikesCount: video.dislikesCount,
			});
		} else {
			if (isDisliked) {
				await User.findByIdAndUpdate(userId, {
					$pull: { dislikedVideos: videoId },
				});
				await Video.findByIdAndUpdate(videoId, {
					$inc: { dislikesCount: -1 },
				});
				video.dislikesCount -= 1;
			}

			await User.findByIdAndUpdate(userId, {
				$addToSet: { likedVideos: videoId },
			});
			await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: 1 } });

			return res.status(200).json({
				success: true,
				message: "Video liked successfully",
				likesCount: video.likesCount + 1,
				dislikesCount: video.dislikesCount,
			});
		}
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const toggleDislikeVideo = async (req, res) => {
	try {
		const videoId = req.params.id;
		const userId = req.user.id;

		const video = await Video.findById(videoId).exec();
		if (!video)
			return res
				.status(404)
				.json({ success: false, message: "Video not found" });

		const user = await User.findById(userId).exec();
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		const isLiked = user.likedVideos.includes(videoId);
		const isDisliked = user.dislikedVideos.includes(videoId);

		if (isDisliked) {
			await User.findByIdAndUpdate(userId, {
				$pull: { dislikedVideos: videoId },
			});
			await Video.findByIdAndUpdate(videoId, {
				$inc: { dislikesCount: -1 },
			});
			return res.status(200).json({
				success: true,
				message: "Dislike removed successfully",
				likesCount: video.likesCount,
				dislikesCount: video.dislikesCount - 1,
			});
		} else {
			if (isLiked) {
				await User.findByIdAndUpdate(userId, {
					$pull: { likedVideos: videoId },
				});
				await Video.findByIdAndUpdate(videoId, {
					$inc: { likesCount: -1 },
				});
				video.likesCount -= 1;
			}

			await User.findByIdAndUpdate(userId, {
				$addToSet: { dislikedVideos: videoId },
			});
			await Video.findByIdAndUpdate(videoId, {
				$inc: { dislikesCount: 1 },
			});

			return res.status(200).json({
				success: true,
				message: "Video disliked successfully",
				likesCount: video.likesCount,
				dislikesCount: video.dislikesCount + 1,
			});
		}
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = {
	toggleDislikeVideo,
	toggleLikeVideo,
};
