const express = require("express");
const router = express.Router();

const localSignUp = require("../controllers/localAuthSignup");

router.post("/", localSignUp);

module.exports = router;
