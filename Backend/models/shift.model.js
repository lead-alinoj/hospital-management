const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Morning, Night
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "16:00"
  isOvernight: { type: Boolean, default: false },

  fullDayMinutes: { type: Number, required: true }, // 480
  halfDayMinutes: { type: Number, required: true }, // 240
  maxMinutes: { type: Number, required: true },     // 720

  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
