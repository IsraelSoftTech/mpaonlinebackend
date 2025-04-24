const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
    
    // Log when database is ready
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    // Log any errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    // Log when disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB');
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 