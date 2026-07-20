const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const localSignUp = async (req, res) => {
	try {
		const { username, email, password } = req.body;
		const conflictingUsers = await User.find({
			$or: [{ email }, { username }],
		});
		let emailConflict = false;
		let usernameConflict = false;
		if (conflictingUsers.length > 0) {
			emailConflict = conflictingUsers.some(
				(user) => user.email === email,
			);
			usernameConflict = conflictingUsers.some(
				(user) => user.username === username,
			);
		}
		if (usernameConflict && emailConflict) {
			return res.status(400).json({
				success: false,
				message: "Both Username and Email Already exists",
			});
		} else if (usernameConflict) {
			return res
				.status(400)
				.json({ success: false, message: "Username Already exists" });
		} else if (emailConflict) {
			return res
				.status(400)
				.json({ success: false, message: "Email Already exists" });
		}

		// ENCRYPTING PASSWORD
		const hashpwd = await bcrypt.hash(password, 10);
		const newUser = new User({ username, email, password: hashpwd });
		// TOKEN CREATION
		const accessToken = jwt.sign(
			{ id: newUser._id, role: newUser.role },
			process.env.ACCESS_TOKEN_SECRET,
			{
				expiresIn: "15m",
			},
		);
		const refreshToken = jwt.sign(
			{ id: newUser._id },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "7d" },
		);
		newUser.refreshToken = refreshToken;
		await newUser.save();

		//STORE REFRESH TOKEN IN COOKIE
		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			secure: process.env.PRODUCTION === "true",
			sameSite: "Lax",
			maxAge: 60 * 60 * 24 * 7 * 1000,
		});

		res.status(201).json({
			success: true,
			accessToken,
			username: newUser.username,
			role: newUser.role,
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = localSignUp;
