// models/billingRecord.model.js
const mongoose = require('mongoose');

const billingRecordSchema = new mongoose.Schema({
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'PARTIAL'],
    default: 'PENDING'
  },
  insuranceId: String,
  notes: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IPBillItem'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('BillingRecord', billingRecordSchema);