const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		videoUrl: {
			type: String,
			required: true,
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		views: {
			type: Number,
			default: 0,
		},

		comments: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				username: {
					type: String,
					required: true,
				},
				text: {
					type: String,
					required: true,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],

		reports: [
			{
				reportedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				reason: {
					type: String,
					required: true,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model("Video", videoSchema);
