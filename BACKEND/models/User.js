const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
		},
		role: {
			type: String,
			required: true,
			enum: ["creator", "admin"],
			default: "creator",
		},
		status: {
			type: String,
			enum: ["active", "banned"],
			default: "active",
		},
		strikeCount: {
			type: Number,
			default: 0,
			max: 3,
		},
		subscriptions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		watchHistory: [
			{
				video: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Video",
					required: true,
				},
				watchedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],

		refreshToken: { type: String },
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model("User", userSchema);
