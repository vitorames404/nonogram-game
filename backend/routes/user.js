const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    const existingUser = await User.findOne({ username });
    res.status(200).json({ exists: !!existingUser });
  } catch (err) {
    res.status(500).json({ message: 'Error searching for username', error: err });
  }
});

router.get('/get-userinfo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found in the database' });
    res.status(200).json({
      username: user.username,
      highscore: user.highscore,
      highscore10: user.highscore10,
      isAdmin: user.isAdmin ?? false,
      streak: user.streak ?? 0,
    });
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

router.post('/update-highscore', authenticateToken, async (req, res) => {
  const { highscore, size } = req.body;
  const { username } = req.user;
  const field = size === 10 ? 'highscore10' : 'highscore';

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { lastActive: Date.now() },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (highscore < user[field] || user[field] == null) {
      user[field] = highscore;
      await user.save();
      return res.status(200).json({ message: 'High score updated successfully', highscore: user[field] });
    }
    return res.status(200).json({ message: 'Current high score is higher or equal', highscore: user[field] });
  } catch (err) {
    console.error('Error updating high score:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

router.get('/get-dailyConditions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ alreadyPlayed: user.alreadyPlayed, guest: user.guest });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching daily conditions', error: err });
  }
});

module.exports = router;
