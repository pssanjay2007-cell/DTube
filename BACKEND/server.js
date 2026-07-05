require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");
const connectDB = require("./config/dbConn.js");
const credentials = require("./middleware/credentials.js");
const corsOption = require("./config/corsOption.js");
const cookieParser = require("cookie-parser");
const videoRoutes = require("./routes/videoRoutes.js");
const adminRoutes = require("./routes/admin.js");
//SECURE .env files

//DATABASE CONNECTION
connectDB();

const app = express();

//FOR Preventing CORS ERROR
app.use(credentials);

//CORS-Validation
app.use(cors(corsOption));

//MIDDLEWARES
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

//ROUTES
app.use("/api/auth/local/signup", require("./routes/localSignup.js"));
app.use("/api/auth/local/login", require("./routes/localLogIn.js"));
app.use("/api/auth/google", require("./routes/googleAuth.js"));
app.use("/api/auth/dauth", require("./routes/dAuth.js"));
app.use("/api/refresh", require("./routes/refresh.js"));
app.use("/api/logout", require("./routes/logout.js"));
app.use("/api/videos", videoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", require("./routes/userRoute.js"));

const PORT = process.env.PORT || 5000;

//CONNECTION
mongoose.connection.once("open", () => {
	console.log("Database connected successfully");
	app.listen(PORT, () => {
		console.log("Server running on port ", PORT);
	});
});
