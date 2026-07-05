const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const redirectToGoogle = (req, res) => {
	const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

	const options = {
		redirect_uri: process.env.GOOGLE_CALLBACK_URL,
		client_id: process.env.GOOGLE_CLIENT_ID,
		access_type: "offline",
		response_type: "code",
		scope: [
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/userinfo.email",
		].join(" "),
	};

	const qs = new URLSearchParams(options);
	return res.redirect(`${rootUrl}?${qs.toString()}`);
};

const handleGoogleCallback = async (req, res) => {
	const code = req.query.code;

	if (!code) {
		return res.status(400).json({ message: "Authorization not provided" });
	}

	try {
		const tokenUrl = "https://oauth2.googleapis.com/token";
		const tokenValues = {
			code,
			client_id: process.env.GOOGLE_CLIENT_ID,
			client_secret: process.env.GOOGLE_CLIENT_SECRET,
			redirect_uri: process.env.GOOGLE_CALLBACK_URL,
			grant_type: "authorization_code",
		};

		const tokenResponse = await axios.post(
			tokenUrl,
			new URLSearchParams(tokenValues),
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		);

		const { id_token, access_token } = tokenResponse.data;

		const profileUrl = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`;
		const profileResponse = await axios.get(profileUrl, {
			headers: { Authorization: `Bearer ${access_token}` },
		});

		const googleUser = profileResponse.data;

		let foundUser = await User.findOne({ email: googleUser.email }).exec();

		if (!foundUser) {
			const randomPassword = Math.random().toString(36).slice(-16);

			let baseUsername =
				googleUser.name || googleUser.email.split("@")[0];
			let targetUsername = baseUsername;

			let usernameExists = await User.findOne({
				username: targetUsername,
			}).exec();

			while (usernameExists) {
				const randomSuffix = Math.random().toString(36).substring(2, 6);
				targetUsername = `${baseUsername}_${randomSuffix}`;
				usernameExists = await User.findOne({
					username: targetUsername,
				}).exec();
			}

			foundUser = await User.create({
				username: targetUsername,
				email: googleUser.email,
				password: randomPassword,
				role: "creator",
			});
		}

		if (foundUser.status === "banned") {
			return res.redirect(
				`http://localhost:5500/login.html?error=banned`,
			);
		}

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

		foundUser.refreshToken = refreshToken;
		await foundUser.save();

		res.cookie("jwt", refreshToken, {
			httpOnly: true,
			secure: process.env.PRODUCTION === "true",
			sameSite: "None",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		const frontendRedirectUrl = `http://localhost:5500/oauth-callback.html?accessToken=${accessToken}&role=${foundUser.role}&username=${encodeURIComponent(foundUser.username)}`;
		return res.redirect(frontendRedirectUrl);
	} catch (err) {
		console.error(
			"Google OAuth Error Details:",
			err.response?.data || err.message,
		);
		return res.redirect(
			`http://localhost:5500/login.html?error=auth_failed`,
		);
	}
};

module.exports = {
	redirectToGoogle,
	handleGoogleCallback,
};
