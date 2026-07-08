const allowedOrigins = require("./allowedOrigins");
const corsOption = {
	origin: (origin, callback) => {
		if (allowedOrigins.indexOf(origin) != -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error("NOT ALLOWED BY CORS"));
		}
	},
	optionsSuccessStatus: 200,
	credentials: true,
};

module.exports = corsOption;
