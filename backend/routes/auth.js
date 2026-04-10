const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, authenticateToken } = require('../middleware/auth');
const { generateSecurePassword } = require('../utils/cleanup');

const router = express.Router();

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge,
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ username: user.username }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

router.post('/login-guest', async (req, res) => {
  const { username } = req.body;
  try {
    let user = await User.findOne({ username });

    if (!user) {
      const securePassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(securePassword, 10);
      user = new User({ username, password: hashedPassword, guest: true, lastActive: Date.now() });
      await user.save();
    } else if (!user.guest) {
      return res.status(400).json({ message: 'Username already taken by a regular user' });
    }

    const accessToken = jwt.sign({ username: user.username, guest: true }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ username: user.username, guest: true }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' });

    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(200).json({ message: 'Guest login successful' });
  } catch (err) {
    console.error('Error in /login-guest:', err);
    res.status(500).json({ message: 'Error logging in as guest', error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    if (email && email.trim() !== '') {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email: email || null });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

router.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh Token missing' });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });

    const newAccessToken = generateAccessToken(user);
    res.cookie('accessToken', newAccessToken, cookieOptions(15 * 60 * 1000));
    res.status(200).json({ message: 'Access Token refreshed' });
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'None' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' });
  res.status(200).json({ message: 'Logout successful' });
});

router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

module.exports = router;
