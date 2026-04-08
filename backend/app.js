const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Ranking = require('./models/Ranking');
const DailyPuzzle = require('./models/DailyPuzzle');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const crypto = require('crypto');

require('dotenv').config();

const app = express();

const corsOptions = {
  origin: ['https://nonogram404.onrender.com', 'http://localhost:5173'], // Allow the specific origin
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions)); // Preflight requests

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

const port = 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
  
  // Schedule the cleanup task to run every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running cleanup task...');
    deleteInactiveGuests();
  });
  
const generateSecurePassword = (length = 16) => {
  return crypto
    .randomBytes(length)
    .toString('hex')
    .slice(0, length);
};

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

const deleteInactiveGuests = async () => {
  try {
    const inactivityThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const result = await User.deleteMany({
      guest: true,
      lastActive: { $lt: inactivityThreshold },
    });

    console.log(`Deleted ${result.deletedCount} inactive guest users.`);
  } catch (err) {
    console.error('Error deleting inactive guest users:', err);
  }
};

app.post('/login-guest', async (req, res) => {
  const { username } = req.body;

  try {
    // Check if the username already exists
    let user = await User.findOne({ username });

    if (!user) {
      // Generate a secure password for the guest user
      const securePassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(securePassword, 10);

      // Create a new guest user with the secure password
      user = new User({
        username,
        password: hashedPassword,
        guest: true,
        lastActive: Date.now(),
      });
      await user.save();
    } else if (!user.guest) {
      return res.status(400).json({ message: 'Username already taken by a regular user' });
    }

    const accessToken = jwt.sign(
      { username: user.username, guest: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { username: user.username, guest: true },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Guest login successful',
    });

  } catch (err) {
    console.error('Error in /login-guest:', err);
    res.status(500).json({ message: 'Error logging in as guest', error: err.message });
  }
});

app.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    const existingUser = await User.findOne({ username });
    res.status(200).json({ exists: !!existingUser });
  } catch (err) {
    res.status(500).json({ message: 'Error searching for username', error: err });
  }
});

app.get('/get-dailyConditions', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the alreadyPlayed status
    res.status(200).json({ alreadyPlayed: user.alreadyPlayed, guest: user.guest });

  } catch (err) {
    res.status(500).json({ message: 'Error searching for username', error: err });
  }
});

app.post('/start-daily', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });

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

    // Atomically mark as played and record server-side start time
    user.alreadyPlayed = true;
    user.dailyStartTime = new Date();
    await user.save();

    res.status(200).json({ puzzle: dailyPuzzle });
  } catch (err) {
    res.status(500).json({ message: 'Error starting daily challenge', error: err.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if the email is provided and if it already exists
    if (email && email.trim() !== "") {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user (email is optional)
    const newUser = new User({
      username,
      password: hashedPassword,
      email: email || null, // Set email to null if not provided
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});


app.post('/add-ranking', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.dailyStartTime) return res.status(400).json({ message: 'No active game session found' });

    // Validate that the session started today
    const today = new Date().toISOString().split('T')[0];
    const startDay = user.dailyStartTime.toISOString().split('T')[0];
    if (startDay !== today) return res.status(400).json({ message: 'Game session expired' });

    // Compute elapsed time server-side — never trust the client
    const elapsedSeconds = (Date.now() - user.dailyStartTime.getTime()) / 1000;

    const date = new Date();
    await User.findOneAndUpdate({ username }, { lastActive: date });

    const updatedRanking = await Ranking.findOneAndUpdate(
      { username },
      { time: elapsedSeconds, date },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Ranking updated successfully', ranking: updatedRanking });
  } catch (err) {
    console.error('Error in /add-ranking:', err);
    res.status(500).json({ message: 'Error updating ranking', error: err.message });
  }
});

app.get('/fetch-ranking', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date as a string (e.g., "2023-10-25")
    
    const rankings = await Ranking.find({
      date: { $gte: new Date(currentDate), $lt: new Date(currentDate + 'T23:59:59.999Z') }
    }).lean(); // Converte para objeto JS puro
    
    rankings.sort((a, b) => Number(a.time) - Number(b.time)); // Ordena numericamente

    res.status(200).json({ rankings });
  } catch (err) {
    console.error('Error in /fetch-ranking:', err);
    res.status(500).json({ message: 'Error fetching rankings', error: err.message });
  }
});

app.post('/update-highscore', authenticateToken, async (req, res) => {
  const { highscore } = req.body;
  const username = req.user.username;

  // Update the user's lastActive timestamp
  await User.findOneAndUpdate(
    { username },
    { lastActive: Date.now() }
  );

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (highscore < user.highscore || user.highscore == null) {
      user.highscore = highscore;
      await user.save();
      return res.status(200).json({ message: 'High score updated successfully', highscore: user.highscore });
    } else {
      return res.status(200).json({ message: 'Current high score is higher or equal', highscore: user.highscore });
    }
  } catch (err) {
    console.error('Error updating high score:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.get('/get-userinfo', authenticateToken, async (req, res) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(400).json({ message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        const highscore = user.highscore;
        return res.status(200).json({ username, highscore });
      } else {
        return res.status(404).json({ message: 'User not found in the database' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error('Error verifying token or fetching user:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
    });

  } catch (err) {
    res.status(500).json({ message: 'Error logging in', err });
  }
});

app.post('/login-guest', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
    });

  } catch (err) {
    res.status(500).json({ message: 'Error logging in', err });
  }
});

app.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh Token missing' });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });

    const newAccessToken = generateAccessToken(user);
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });
    res.status(200).json({ message: 'Access Token refreshed' });
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'None' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'None' });
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Access granted to protected route', user: req.user });
});

const createGrid = (size) => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() < 0.5 ? 0 : 1))
  );
};

const calculateHints = (grid) => {
  const calculateLineHints = (line) => {
    const hints = [];
    let count = 0;

    for (const cell of line) {
      if (cell === 1) {
        count += 1;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }

    if (count > 0) {
      hints.push(count);
    }

    return hints.length > 0 ? hints : [0];
  };

  const rowHints = grid.map((row) => calculateLineHints(row));
  const colHints = grid[0].map((_, colIndex) =>
    calculateLineHints(grid.map((row) => row[colIndex]))
  );

  return { rowHints, colHints };
};

app.post('/create-daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existingPuzzle = await DailyPuzzle.findOne({ date: today });
    // Reset all users' `alreadyPlayed` to false
    const updateResult = await User.updateMany({}, { alreadyPlayed: false });
    console.warn("tentei updatar usuarios")
    if (updateResult.nModified === 0) {
      console.warn('No users were updated, but proceeding to create the daily puzzle.');
    }
    if (existingPuzzle) {
      return res
        .status(400)
        .json({ message: 'Daily challenge for today already exists' });
    }

    const gridSize = 5;
    const grid = createGrid(gridSize);
    const { rowHints, colHints } = calculateHints(grid);

    const newPuzzle = new DailyPuzzle({
      grid,
      rowHints,
      colHints,
      date: today,
    });

    await newPuzzle.save();

    res.status(201).json({
      message: 'Daily chal lenge created successfully',
      puzzle: newPuzzle,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error creating daily challenge',
      error: err.message,
    });
  }
});

app.get('/get-daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyPuzzle = await DailyPuzzle.findOne({ date: today });

    if (!dailyPuzzle) {
      return res.status(404).json({
        message: 'No daily challenge found for today',
      });
    }

    res.status(200).json({ puzzle: dailyPuzzle });
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching daily challenge',
      error: err.message,
    });
  }
});

app.get('*', (req, res) => {
  // Exclude API routes from this catch-all handler
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});