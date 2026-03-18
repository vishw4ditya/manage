const User = require('../models/User');

async function generateEmployeeId(maxAttempts = 10) {
  const prefix = 'EMP';
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const num = Math.floor(10000 + Math.random() * 90000);
    const id = `${prefix}${num}`;
    const exists = await User.exists({ employeeId: id });
    if (!exists) return id;
  }
  throw new Error('Failed to generate a unique employee ID after maximum attempts');
}

module.exports = { generateEmployeeId };
