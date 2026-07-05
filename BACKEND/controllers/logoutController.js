const User = require("../models/User");

const handleLogout = async (req, res) => {
	try {
		const cookies = req.cookies;

		if (!cookies?.jwt) {
			return res
				.status(200)
				.json({ success: true, message: "NO Active Session" });
		}
		const refreshToken = cookies.jwt;

		const foundUser = await User.findOne({ refreshToken }).exec();
		if (!foundUser) {
			res.clearCookie("jwt", {
				httpOnly: true,
				sameSite: "None",
				secure: process.env.PRODUCTION === "true",
			});
			return res
				.status(200)
				.json({ success: true, message: "Session cookie cleared" });
		}
		foundUser.refreshToken = "";
		await foundUser.save();

		res.clearCookie("jwt", {
			httpOnly: true,
			sameSite: "None",
			secure: process.env.PRODUCTION === "true",
		});
		return res
			.status(200)
			.json({ success: true, message: "Logged out successfully." });
	} catch (err) {
		res.status(500).json({ message: err.message, success: false });
	}
};

module.exports = handleLogout;
