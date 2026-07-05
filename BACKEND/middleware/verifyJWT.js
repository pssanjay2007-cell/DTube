const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyJWT = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ message: "Unautorized! Missing or malfunctioned token" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const currentUser = await User.findById(decoded.id);

		if (!currentUser) {
			return res
				.status(401)
				.json({ message: "This account no longer exists." });
		}

		if (currentUser.status === "banned") {
			return res.status(403).json({
				message:
					"Access Denied: This channel has been suspended for violating community guidelines.",
			});
		}

		req.user = {
			id: currentUser._id.toString(),
			role: currentUser.role,
		};

		next();
	} catch (err) {
		return res
			.status(403)
			.json({ message: "Session expired or invalid signature token." });
	}
};
module.exports = verifyJWT;
