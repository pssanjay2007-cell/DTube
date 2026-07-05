const nodemailer = require("nodemailer");

const sendNotificationEmail = async (targetEmail, subject, textContent) => {
	try {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		});

		const mailOptions = {
			from: `"DTube Security DesK" <${process.env.EMAIL_USER}>`,
			to: targetEmail,
			subject: subject,
			text: textContent,
		};

		await transporter.sendMail(mailOptions);
		console.log(
			`System alert notification email successfully sent to ${targetEmail}`,
		);
	} catch (err) {
		console.error("Nodemailer failed : ", err.message);
	}
};

module.exports = sendNotificationEmail;
