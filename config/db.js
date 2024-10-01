import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MongoDB connection string is not set");
    }
    const conn = await mongoose.connect(
      process.env.MONGO_URI
      //    {
      //   useUnifiedTopology: true,
      //   useNewUrlParser: true,
      // }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB connection error: ${error.message}`);
    } else {
      console.error(`MongoDB connection error: ${error}`);
    }
    process.exit(1);
  }
};

export default connectDB;
