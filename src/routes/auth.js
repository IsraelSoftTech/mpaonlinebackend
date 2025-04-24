const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (full_name, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, username, email, phone, hashedPassword, 'user']
    );

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
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
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

    // Find user with case-insensitive comparison
    const [users] = await db.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND LOWER(email) = LOWER(?)',
      [username, email]
    );

    console.log('Database query result:', users);

    if (users.length === 0) {
      console.log('No user found with these credentials');
      return res.status(404).json({ message: 'User not found or email does not match' });
    }

    console.log('User verified successfully');
    res.json({ 
      message: 'User verified successfully',
      user: {
        username: users[0].username,
        email: users[0].email
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

    // Verify user exists and matches email
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND email = ?',
      [username, email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found or email does not match' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE username = ? AND email = ?',
      [hashedPassword, username, email]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;