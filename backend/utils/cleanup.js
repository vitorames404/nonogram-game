const crypto = require('crypto');
const User = require('../models/User');

const generateSecurePassword = (length = 16) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const deleteInactiveGuests = async () => {
  try {
    const inactivityThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      guest: true,
      lastActive: { $lt: inactivityThreshold },
    });
    console.log(`Deleted ${result.deletedCount} inactive guest users.`);
  } catch (err) {
    console.error('Error deleting inactive guest users:', err);
  }
};

module.exports = { generateSecurePassword, deleteInactiveGuests };
