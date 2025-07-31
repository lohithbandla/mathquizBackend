const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Verify Token Middleware (same as in auth.js)
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

// Save solved problem ID
router.post('/solve', verifyToken, async (req, res) => {
  const { problemId } = req.body;
  const userId = req.userId;

  try {
    // Validate problemId
    if (!problemId || typeof problemId !== 'number') {
      return res.status(400).json({ error: 'Problem ID is required and must be a number' });
    }

    // Get current user's solved problems
    const user = await pool.query(
      'SELECT solved_problems FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSolvedProblems = user.rows[0].solved_problems || [];

    // Check if problem is already solved
    if (currentSolvedProblems.includes(problemId)) {
      return res.status(200).json({ 
        message: 'Problem already solved',
        solved_problems: currentSolvedProblems
      });
    }

    // Add new problem ID to the array
    const updatedSolvedProblems = [...currentSolvedProblems, problemId];

    // Update user's solved_problems in database
    const updatedUser = await pool.query(
      'UPDATE users SET solved_problems = $1 WHERE id = $2 RETURNING id, name, email, about, solved_problems',
      [updatedSolvedProblems, userId]
    );

    res.status(200).json({
      message: 'Problem marked as solved',
      user: updatedUser.rows[0]
    });

  } catch (err) {
    console.error('Save problem error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's solved problems
router.get('/solved', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await pool.query(
      'SELECT solved_problems FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      solved_problems: user.rows[0].solved_problems || []
    });

  } catch (err) {
    console.error('Get solved problems error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats (total solved, etc.)
router.get('/stats', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await pool.query(
      'SELECT name, solved_problems FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const solvedProblems = user.rows[0].solved_problems || [];

    res.status(200).json({
      name: user.rows[0].name,
      total_solved: solvedProblems.length,
      solved_problems: solvedProblems
    });

  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a problem from solved list (if user wants to retry)
router.post('/remove', verifyToken, async (req, res) => {
  const { problemId } = req.body;
  const userId = req.userId;

  try {
    if (!problemId || typeof problemId !== 'number') {
      return res.status(400).json({ error: 'Problem ID is required and must be a number' });
    }

    const user = await pool.query(
      'SELECT solved_problems FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSolvedProblems = user.rows[0].solved_problems || [];

    if (!currentSolvedProblems.includes(problemId)) {
      return res.status(404).json({ error: 'Problem not found in solved list' });
    }

    // Remove problem ID from the array
    const updatedSolvedProblems = currentSolvedProblems.filter(id => id !== problemId);

    const updatedUser = await pool.query(
      'UPDATE users SET solved_problems = $1 WHERE id = $2 RETURNING id, name, email, about, solved_problems',
      [updatedSolvedProblems, userId]
    );

    res.status(200).json({
      message: 'Problem removed from solved list',
      user: updatedUser.rows[0]
    });

  } catch (err) {
    console.error('Remove problem error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;