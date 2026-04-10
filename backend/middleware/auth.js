const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateAccessToken = (user) => {
  return jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Access Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access Token expired' });
      }
      return res.status(403).json({ message: 'Invalid Access Token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  const user = await User.findOne({ username: req.user.username });
  if (!user?.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};

module.exports = { generateAccessToken, authenticateToken, requireAdmin };
