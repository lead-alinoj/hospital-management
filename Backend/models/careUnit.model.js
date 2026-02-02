// models/careUnit.model.js
const mongoose = require('mongoose');

const careUnitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Ward', 'Room'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  chargesPerDay: Number,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CareUnit', careUnitSchema);
