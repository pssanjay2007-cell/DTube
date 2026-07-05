const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");

// REDIRECTS TO GOOGLE LOGIN
router.get("/login", googleAuthController.redirectToGoogle);

// GOOGLE REDIRECTS BACK HERE
router.get("/callback", googleAuthController.handleGoogleCallback);

module.exports = router;
