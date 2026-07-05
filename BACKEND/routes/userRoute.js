const getProfile = require("../controllers/userController");
const userInteractionController = require("../controllers/userInteractionController");
const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();
router.use(verifyJWT);
router.get("/me", getProfile);
router.post("/subscribe/:id", userInteractionController.toggleSubscription);

module.exports = router;
