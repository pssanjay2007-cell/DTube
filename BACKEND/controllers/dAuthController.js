const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const redirectToDAuth = (req, res) => {
	const rootUrl = "https://auth.delta.nitt.edu/authorize";
	const option = {
		client_id: process.env.DAUTH_CLIENT_ID,
		redirect_uri: process.env.DAUTH_CALLBACK_URL,
		response_type: "code",
		scope: "openid profile email user",
		nonce: Math.random().toString(36).substring(2),
	};

	const qs = new URLSearchParams(option);
	return res.redirect(`${rootUrl}?${qs.toString()}`);
};

const handleDAuthCallback = async (req, res) => {
	const code = req.query.code;
	const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5500";

	if (!code) {
		return res.status(400).json({ message: "Authorization not provided" });
	}

	try {
		const tokenUrl = "https://auth.delta.nitt.edu/api/oauth/token";
		const tokenValues = {
			client_id: process.env.DAUTH_CLIENT_ID,
			client_secret: process.env.DAUTH_CLIENT_SECRET,
			redirect_uri: process.env.DAUTH_CALLBACK_URL,
			grant_type: "authorization_code",
			code,
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

		const profileUrl = "https://auth.delta.nitt.edu/api/resources/user";
		const profileResponse = await axios.post(
			profileUrl,
			{},
			{
				headers: { Authorization: `Bearer ${access_token}` },
			},
		);

		const dAuthUser = profileResponse.data;

		let foundUser = await User.findOne({ email: dAuthUser.email }).exec();

		if (!foundUser) {
			const randomPassword = Math.random().toString(36).slice(-16);

			let baseUsername = dAuthUser.name || dAuthUser.email.split("@")[0];
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
				email: dAuthUser.email,
				password: randomPassword,
				role: "creator",
			});
		}

		if (foundUser.status === "banned") {
			return res.redirect(`${frontendBaseUrl}/login.html?error=banned`);
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
			samesite: "None",
			maxAge: 7 * 24 * 60 * 1000,
		});

		const frontendRedirectUrl = `${frontendBaseUrl}/oauth-callback.html?accessToken=${accessToken}&role=${foundUser.role}&username=${encodeURIComponent(foundUser.username)}`;
		return res.redirect(frontendRedirectUrl);
	} catch (err) {
		console.error(
			"DAuth Error Details:",
			err.response?.data || err.message,
		);
		console.error("DAuth Error Details", err.response?.data || err.message);
		return res.redirect(`${frontendBaseUrl}/login.html?error=auth_failed`);
	}
};

module.exports = {
	redirectToDAuth,
	handleDAuthCallback,
};
