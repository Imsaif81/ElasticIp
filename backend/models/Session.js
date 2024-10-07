const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdIPs: { type: [String], default: [] },
  allocatedIPs: { type: [{ ip: String, allocationId: String }], default: [] },
  releasedIPs: { type: [String], default: [] },
  batchSize: { type: Number, default: 5 },
  processRunning: { type: Boolean, default: true }
}, { timestamps: true });  // Adding timestamps to track session creation and updates

module.exports = mongoose.model('Session', sessionSchema);
