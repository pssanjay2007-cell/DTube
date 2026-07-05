const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const Video = require("../models/Video");
const User = require("../models/User");

const s3 = new S3Client({
	endpoint: process.env.SUPABASE_ENDPOINT,
	region: process.env.SUPABASE_REGION,
	credentials: {
		accessKeyId: process.env.SUPABASE_APPLICATION_KEY_ID,
		secretAccessKey: process.env.SUPABASE_APPLICATION_KEY,
	},
	forcePathStyle: true,
});

const upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: process.env.SUPABASE_BUCKET_NAME,
		contentType: multerS3.AUTO_CONTENT_TYPE,
		key: function (req, file, cb) {
			const uniqueSuffix =
				Date.now() + "-" + Math.round(Math.random() * 1e9);
			const ext = file.originalname.split(".").pop();
			cb(null, `videos/${uniqueSuffix}.${ext}`);
		},
	}),
});

const uploadVideo = async (req, res) => {
	try {
		const { title, description } = req.body;

		if (!req.file) {
			return res
				.status(400)
				.json({ success: false, message: "No video file uploaded." });
		}

		if (!title) {
			return res
				.status(400)
				.json({ success: false, message: "Video title is required." });
		}

		const baseEndpoint = process.env.SUPABASE_ENDPOINT.split("/storage")[0];
		const bucketName = process.env.SUPABASE_BUCKET_NAME;

		const publicVideoUrl = `${baseEndpoint}/storage/v1/object/public/${bucketName}/${req.file.key}`;

		const newVideo = await Video.create({
			title,
			description,
			videoUrl: publicVideoUrl,
			creator: req.user.id,
		});

		return res.status(201).json({
			success: true,
			message: "Video published to DTube successfully",
			video: newVideo,
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const getVideos = async (req, res) => {
	try {
		const { sort } = req.query;
		let sortBy = { createdAt: -1 };

		if (sort === "trending") {
			sortBy = { views: -1, createdAt: -1 };
		}

		const videos = await Video.find()
			.populate("creator", "username")
			.sort(sortBy)
			.exec();

		return res
			.status(200)
			.json({ success: true, count: videos.length, videos });
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const addComment = async (req, res) => {
	try {
		const { videoId, text } = req.body;
		const currentUserId = req.user.id;

		const activeUser = await User.findById(currentUserId);
		if (!activeUser) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (!text) {
			return res
				.status(400)
				.json({ success: false, message: "Comment cannot be empty" });
		}

		const video = await Video.findById(videoId);
		if (!video) {
			return res
				.status(404)
				.json({ success: false, message: "Video not found" });
		}

		const newComment = {
			userId: currentUserId,
			username: activeUser.username || "Anonymous User",
			text,
		};

		video.comments.push(newComment);
		await video.save();

		return res.status(201).json({
			success: true,
			message: "Comment posted successfully.",
			comments: video.comments,
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const reportVideo = async (req, res) => {
	try {
		const { videoId, reason } = req.body;
		const currentUserId = req.user.id;

		if (!reason) {
			return res.status(400).json({
				success: false,
				message: "Reason for reporting must be specified",
			});
		}

		const video = await Video.findById(videoId);
		if (!video) {
			return res
				.status(404)
				.json({ success: false, message: "Video not found" });
		}

		video.reports.push({
			reportedBy: currentUserId,
			reason,
		});

		await video.save();

		return res.status(200).json({
			success: true,
			message: "Video flagged. Administration notified",
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const searchVideos = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q) {
			return res
				.status(400)
				.json({ success: false, message: "Search query is empty" });
		}

		const words = q.trim().split(/\s+/);

		const matchedVideos = await Video.find({
			$or: [
				...words.map((word) => ({
					title: { $regex: word, $options: "i" },
				})),
				...words.map((word) => ({
					description: { $regex: word, $options: "i" },
				})),
			],
		})
			.populate("creator", "username")
			.sort({ views: -1, createdAt: -1 })
			.exec();

		return res.status(200).json({
			success: true,
			count: matchedVideos.length,
			videos: matchedVideos,
		});
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const incrementViews = async (req, res) => {
	try {
		const { videoId } = req.params;

		const video = await Video.findByIdAndUpdate(
			videoId,
			{ $inc: { views: 1 } },
			{ new: true },
		);

		if (!video) {
			return res
				.status(404)
				.json({ success: false, message: "Video not found." });
		}
		return res.status(200).json({ success: true, views: video.views });
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message });
	}
};

const logWatchHistory = async (req, res) => {
	try {
		const { videoId } = req.body;
		const currentUserId = req.user.id;

		if (!videoId) {
			return res.status(400).json({
				success: false,
				message: "Missing videoId parameter.",
			});
		}

		const user = await User.findById(currentUserId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User profile not found." });
		}

		if (!user.watchHistory) {
			user.watchHistory = [];
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
			message: "Watch history updated sync logged.",
		});
	} catch (err) {
		console.error("Backend History Log Exception:", err);
		return res.status(500).json({ success: false, message: err.message });
	}
};
module.exports = {
	upload,
	uploadVideo,
	getVideos,
	addComment,
	reportVideo,
	searchVideos,
	incrementViews,
	logWatchHistory,
};
