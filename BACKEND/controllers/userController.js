const User = require("../models/User");
const Video = require("../models/Video");

const getProfile = async (req, res) => {
	try {
		if (!req.user || !req.user.id) {
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized" });
		}

		const foundUser = await User.findById(req.user.id)
			.select("username email watchHistory")
			.populate({
				path: "watchHistory.video",
				populate: { path: "creator", select: "username" },
			})
			.lean();

		if (!foundUser) {
			return res.status(404).json({
				success: false,
				message: "User not found in database",
			});
		}

		const totalUploadedVideos = await Video.countDocuments({
			creator: req.user.id,
		});

		const totalFollowersCount = await User.countDocuments({
			subscriptions: req.user.id,
		});

		return res.status(200).json({
			success: true,
			user: foundUser,
			videoCount: totalUploadedVideos,
			subscriberCount: totalFollowersCount,
		});
	} catch (err) {
		console.log(err);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Problem" });
	}
};

module.exports = getProfile;
