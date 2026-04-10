const express = require('express');
const User = require('../models/User');
const Ranking = require('../models/Ranking');
const DailyPuzzle = require('../models/DailyPuzzle');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createGrid, calculateHints } = require('../utils/game');

const router = express.Router();

router.post('/start-daily', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.guest) return res.status(403).json({ message: "Guests can't play the daily challenge", guest: true });
    if (user.alreadyPlayed) return res.status(403).json({ message: 'Already played today', alreadyPlayed: true });

    const today = new Date().toISOString().split('T')[0];
    let dailyPuzzle = await DailyPuzzle.findOne({ date: today });

    if (!dailyPuzzle) {
      const grid = createGrid(5);
      const { rowHints, colHints } = calculateHints(grid);
      dailyPuzzle = new DailyPuzzle({ grid, rowHints, colHints, date: today });
      await dailyPuzzle.save();
    }

    user.alreadyPlayed = true;
    user.dailyStartTime = new Date();
    await user.save();

    res.status(200).json({ puzzle: dailyPuzzle });
  } catch (err) {
    res.status(500).json({ message: 'Error starting daily challenge', error: err.message });
  }
});

router.post('/add-ranking', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.dailyStartTime) return res.status(400).json({ message: 'No active game session found' });

    const today = new Date().toISOString().split('T')[0];
    const startDay = user.dailyStartTime.toISOString().split('T')[0];
    if (startDay !== today) return res.status(400).json({ message: 'Game session expired' });

    const elapsedSeconds = (Date.now() - user.dailyStartTime.getTime()) / 1000;
    const date = new Date();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (user.lastCompletedDate === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else if (user.lastCompletedDate !== today) {
      user.streak = 1;
    }
    user.lastCompletedDate = today;
    user.lastActive = date;
    await user.save();

    const updatedRanking = await Ranking.findOneAndUpdate(
      { username: req.user.username },
      { time: elapsedSeconds, date },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Ranking updated successfully', ranking: updatedRanking, time: elapsedSeconds, streak: user.streak });
  } catch (err) {
    console.error('Error in /add-ranking:', err);
    res.status(500).json({ message: 'Error updating ranking', error: err.message });
  }
});

router.get('/fetch-ranking', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const rankings = await Ranking.find({
      date: { $gte: new Date(currentDate), $lt: new Date(currentDate + 'T23:59:59.999Z') },
    }).lean();
    rankings.sort((a, b) => Number(a.time) - Number(b.time));
    res.status(200).json({ rankings });
  } catch (err) {
    console.error('Error in /fetch-ranking:', err);
    res.status(500).json({ message: 'Error fetching rankings', error: err.message });
  }
});

router.post('/create-daily', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existingPuzzle = await DailyPuzzle.findOne({ date: today });

    await User.updateMany({}, { alreadyPlayed: false });

    if (existingPuzzle) {
      return res.status(400).json({ message: 'Daily challenge for today already exists' });
    }

    const grid = createGrid(5);
    const { rowHints, colHints } = calculateHints(grid);
    const newPuzzle = new DailyPuzzle({ grid, rowHints, colHints, date: today });
    await newPuzzle.save();

    res.status(201).json({ message: 'Daily challenge created successfully', puzzle: newPuzzle });
  } catch (err) {
    res.status(500).json({ message: 'Error creating daily challenge', error: err.message });
  }
});

router.get('/get-daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyPuzzle = await DailyPuzzle.findOne({ date: today });
    if (!dailyPuzzle) return res.status(404).json({ message: 'No daily challenge found for today' });
    res.status(200).json({ puzzle: dailyPuzzle });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching daily challenge', error: err.message });
  }
});

module.exports = router;
