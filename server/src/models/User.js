const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['OWNER','REGIONAL_MANAGER','MANAGER','SALESMAN','TECHNICIAN'], required: true },
  employeeId: { type: String, unique: true },
  status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING' },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  resetToken: String,
  resetTokenExpiry: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
