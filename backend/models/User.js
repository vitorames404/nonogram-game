const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
  highscore: { type: String, default: null },   // 5×5 best
  highscore10: { type: String, default: null }, // 10×10 best
  alreadyPlayed: { type: Boolean, default: false },
  dailyStartTime: { type: Date, default: null },
  guest: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  streak: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: null },
});

// Add the partial index for the email field
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } });

const User = mongoose.model('User', userSchema);

module.exports = User;