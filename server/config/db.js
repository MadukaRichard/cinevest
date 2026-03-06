/**
 * ===========================================
 * MongoDB Database Connection Configuration
 * ===========================================
 * 
 * This file handles the MongoDB connection using Mongoose.
 * It exports a function to establish the database connection.
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Uses the MONGO_URI from environment variables
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
