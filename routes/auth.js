const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
pool.connectDb();
// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback_secret_key', 
    { expiresIn: '24h' }
  );
};

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, about } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, about) VALUES ($1, $2, $3, $4) RETURNING id, name, email, about, solved_problems',
      [name, email, hashedPassword, about || '']
    );

    // Generate token
    const token = generateToken(newUser.rows[0].id);

    // Return response with token
    res.status(201).json({
      message: 'User created successfully',
      token: token,
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signin Route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.rows[0].id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user.rows[0];

    // Return response with token
    res.status(200).json({
      message: 'Sign in successful',
      token: token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify Token Middleware (for protected routes)
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Test protected route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, about, solved_problems FROM users WHERE id = $1',
      [req.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile retrieved successfully',
      user: user.rows[0] 
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;