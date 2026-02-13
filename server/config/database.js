import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error("MONGODB_URI is not defined in .env file");

    const conn = await mongoose.connect(mongoURI, {
      dbName: process.env.MONGODB_DB || undefined, // ✅ optional, but recommended
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB DB Name: ${conn.connection.name}`); // ✅ this tells you EXACT DB
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
