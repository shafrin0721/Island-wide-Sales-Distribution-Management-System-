// Authentication Routes with JWT
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Demo users database (in production, use real database)
const users = {
  'delivery@example.com': {
    id: 'del-001',
    email: 'delivery@example.com',
    password: 'password123', // In production, use hashed passwords
    name: 'John Delivery',
    role: 'DELIVERY',
    phone: '+1234567890',
    vehicle: 'Van',
    licensePlate: 'ABC-123'
  },
  'admin@example.com': {
    id: 'admin-001',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN'
  }
};

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = users[email];

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Signup endpoint
router.post('/signup', (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name required' });
    }

    if (users[email]) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Validate role
    if (role && !['ADMIN', 'STAFF', 'DELIVERY'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password, // In production, hash this
      name,
      phone: phone || '',
      role: role || 'DELIVERY'
    };

    users[email] = newUser;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Verify token endpoint
router.post('/verify', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

module.exports = router;
