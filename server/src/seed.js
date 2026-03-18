require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { generateEmployeeId } = require('./utils/employeeId');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manage';
const OWNER_MOBILE = process.env.OWNER_MOBILE;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;
const OWNER_NAME = process.env.OWNER_NAME || 'Owner';

async function seed() {
  if (!OWNER_MOBILE || !OWNER_PASSWORD) {
    console.error('OWNER_MOBILE and OWNER_PASSWORD must be set in environment or .env file');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existingOwner = await User.findOne({ role: 'OWNER' });
  if (existingOwner) {
    console.log(`Owner already exists. EmployeeId: ${existingOwner.employeeId}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);
  const employeeId = await generateEmployeeId();

  const owner = new User({
    name: OWNER_NAME,
    mobile: OWNER_MOBILE,
    passwordHash,
    role: 'OWNER',
    employeeId,
    status: 'APPROVED',
    approvedAt: new Date(),
  });

  await owner.save();

  console.log('Owner created successfully!');
  console.log(`  Name:       ${OWNER_NAME}`);
  console.log(`  Mobile:     ${OWNER_MOBILE}`);
  console.log(`  EmployeeId: ${employeeId}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
