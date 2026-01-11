import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      autoIndex: false, 
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); 
  }
};

export default connectDB;
