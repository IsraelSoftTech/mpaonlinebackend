const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Routes will be added here
// app.use('/api/students', require('./routes/students'));
// app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Function to find an available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (port < startPort + 100) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          server.close();
          resolve(port);
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            port++;
            resolve(null);
          } else {
            reject(err);
          }
        });
      });
      return port;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') {
        throw err;
      }
      port++;
    }
  }
  throw new Error('No available ports found');
};

// Start server
findAvailablePort(PORT)
  .then(port => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  }); 