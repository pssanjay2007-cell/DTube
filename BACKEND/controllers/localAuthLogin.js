const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const localLogIn = async (req, res) => {
	try {
		const { email, password } = req.body;

		const foundUser = await User.findOne({ email }).exec();
		if (!foundUser) {
			return res.status(401).json({ message: "User not found" });
		}

		const isMatch = await bcrypt.compare(password, foundUser.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// TOKEN CREATION

		const accessToken = jwt.sign(
			{ id: foundUser._id, role: foundUser.role },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" },
		);

		const refreshToken = jwt.sign(
			{ id: foundUser._id },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "7d" },
		);

		// Save current state token tracker string to MongoDB
		foundUser.refreshToken = refreshToken;
		await foundUser.save();

		// STORE REFRESH TOKEN IN COOKIE

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			secure: process.env.PRODUCTION === "true",
			sameSite: "Lax",
			maxAge: 60 * 60 * 24 * 7 * 1000,
		});

		res.status(200).json({
			success: true,
			accessToken,
			role: foundUser.role,
			username: foundUser.username,
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = localLogIn;
