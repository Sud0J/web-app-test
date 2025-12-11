const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Search users
 * GET /api/users/search?q=username
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.userId } // Exclude current user
    })
    .select('username displayName avatar isOnline lastSeen publicKey')
    .limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user by ID
 * GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username displayName avatar isOnline lastSeen publicKey');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user profile
 * PUT /api/users/me
 */
router.put('/me', async (req, res) => {
  try {
    const { displayName, avatar } = req.body;
    const user = await User.findById(req.userId);

    if (displayName) user.displayName = displayName;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

