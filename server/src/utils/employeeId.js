const User = require('../models/User');

async function generateEmployeeId() {
  const prefix = 'EMP';
  let id;
  let exists = true;
  while (exists) {
    const num = Math.floor(10000 + Math.random() * 90000);
    id = `${prefix}${num}`;
    exists = await User.exists({ employeeId: id });
  }
  return id;
}

module.exports = { generateEmployeeId };
