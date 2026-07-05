const express = require("express");
const router = express.Router();

const localLogIn = require("../controllers/localAuthLogin");

router.post("/", localLogIn);

module.exports = router;
