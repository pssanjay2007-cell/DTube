const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (err) {
    console.log("Database Connection Failed", err);
    process.exit(1);
  }
};

module.exports = connectDB;
