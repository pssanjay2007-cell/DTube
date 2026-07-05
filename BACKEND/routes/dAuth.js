const express = require("express");
const router = express.Router();

const dAuthController = require("../controllers/dAuthController");

router.get("/login", dAuthController.redirectToDAuth);

router.get("/callback", dAuthController.handleDAuthCallback);

module.exports = router;
