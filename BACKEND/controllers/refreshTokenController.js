const User = require("../models/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
	try {
		const cookies = req.cookies;

		if (!cookies?.jwt) {
			return res
				.status(401)
				.json({ message: "Missing cookie, unauthorised session" });
		}

		const refreshToken = cookies.jwt;

		const foundUser = await User.findOne({ refreshToken }).exec();
		if (!foundUser) {
			return res
				.status(403)
				.json({ message: "Forbidden! Invalid token" });
		}

		if (foundUser.status === "banned") {
			return res.status(403).json({
				message:
					"Access Denied: This channel has been suspended for violating community guidelines.",
			});
		}

		jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET,
			(err, decoded) => {
				console.log("JWT Error:", err);
				console.log("DB User ID:", foundUser._id.toString());
				console.log("Decoded Token Payload:", decoded);
				if (err || foundUser._id.toString() !== decoded.id) {
					return res
						.status(403)
						.json({ message: "Forbidden Access" });
				}
				const accessToken = jwt.sign(
					{ id: foundUser._id, role: foundUser.role },
					process.env.ACCESS_TOKEN_SECRET,
					{ expiresIn: "15m" },
				);
				res.json({
					accessToken,
					role: foundUser.role,
					username: foundUser.username,
				});
			},
		);
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = handleRefreshToken;
