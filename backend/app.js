require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dailyRoutes = require('./routes/daily');
const adminRoutes = require('./routes/admin');
const { deleteInactiveGuests } = require('./utils/cleanup');

const app = express();

const corsOptions = {
  origin: ['https://nonogram404.onrender.com', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

cron.schedule('0 0 * * *', () => {
  console.log('Running cleanup task...');
  deleteInactiveGuests();
});

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', dailyRoutes);
app.use('/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(3000, () => console.log('Server is running on port: 3000'));
