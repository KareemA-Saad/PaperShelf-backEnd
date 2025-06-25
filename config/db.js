const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
// console.log("🔍 URI from .env:", process.env.MONGO_URI);

module.exports = connectDB;

// This function connects to the MongoDB database using Mongoose.
