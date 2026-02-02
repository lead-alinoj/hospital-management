const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true, unique: true },

  careUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareUnit',
    required: true
  },

  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'],
    default: 'AVAILABLE'
  },

  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },

  currentVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    default: null
  },

  admissionDate: Date,
  dischargeDate: Date,

  cleaned: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  remarks: String,
  lastStayDays: Number
}, { timestamps: true });

bedSchema.index({ status: 1, careUnit: 1 });

module.exports = mongoose.model('Bed', bedSchema);
