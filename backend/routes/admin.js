const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/set-admin', authenticateToken, requireAdmin, async (req, res) => {
  const { username } = req.body;
  const user = await User.findOneAndUpdate({ username }, { isAdmin: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json({ message: `${username} is now an admin` });
});

module.exports = router;
