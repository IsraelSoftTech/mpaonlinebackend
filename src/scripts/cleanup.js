require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const cleanup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Delete all users
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanup(); 