const verifyAdmin = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({
			success: false,
			message:
				"Access Denied: This operational area requires administrative security privileges.",
		});
	}
};

module.exports = verifyAdmin;
