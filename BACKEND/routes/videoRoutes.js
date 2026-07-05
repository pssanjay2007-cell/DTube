const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const videoController = require("../controllers/videoController");

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
router.post("/report", videoController.reportVideo);
router.post("/history", videoController.logWatchHistory);

module.exports = router;
