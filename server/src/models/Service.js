const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  mobile: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'], default: 'OPEN' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  capturedAt: { type: Date, default: Date.now },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

serviceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Service', serviceSchema);
