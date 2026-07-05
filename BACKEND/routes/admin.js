const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const adminController = require("../controllers/adminController");

router.use(verifyJWT);
router.use(verifyAdmin);

router.get("/flagged-content", adminController.getFlaggedVideos);
router.post("/moderate", adminController.moderateContent);

module.exports = router;
