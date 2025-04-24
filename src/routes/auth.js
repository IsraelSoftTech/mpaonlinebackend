const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    console.log('Received signup request with data:', req.body);
    const { fullName, username, email, phone, password } = req.body;

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    console.log('Creating new user...');
    const user = new User({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'user'
    });

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully:', user);

    res.status(201).json({ message: 'Account Created Successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Signin Route
router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin' });
  }
});

// Verify User Route
router.post('/verify-user', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    console.log('Attempting to verify user:', { username, email });

    const user = await User.findOne({
      username: username.toLowerCase(),
      email: email.toLowerCase()
    });

    if (!user) {
      console.log('No user found with these credentials');
      return res.status(404).json({ message: 'User not found or email does not match' });
    }

    console.log('User verified successfully');
    res.json({ 
      message: 'User verified successfully',
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { username, email, newPassword } = req.body;

    const user = await User.findOne({
      username: username.toLowerCase(),
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found or email does not match' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;