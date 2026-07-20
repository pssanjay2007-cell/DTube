const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const videoController = require("../controllers/videoController");
const videoInteractionController = require("../controllers/videoUserInteractionController");

router.get("/", videoController.getVideos);
router.get("/search", videoController.searchVideos);
router.patch("/:videoId/view", videoController.incrementViews);

router.use(verifyJWT);
router.post(
	"/upload",
	videoController.upload.single("video"),
	videoController.uploadVideo,
);
router.post("/comment", videoController.addComment);
router.post("/:id/like", videoInteractionController.toggleLikeVideo);
router.post("/:id/dislike", videoInteractionController.toggleDislikeVideo);
router.post("/report", videoController.reportVideo);
router.post("/history", videoController.logWatchHistory);
router.get("/:id", videoController.getVideosById);
router.delete("/:id", videoController.deleteVideo);

module.exports = router;
