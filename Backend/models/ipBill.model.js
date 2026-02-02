const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
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
  
  admissionDate: {
    type: Date,
    required: true
  },
  
  dischargeDate: {
    type: Date,
    required: true
  },
  
  stayDays: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Room Charges
  roomCharges: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Medical Charges
  doctorCharges: {
    type: Number,
    default: 0
  },
  
  nursingCharges: {
    type: Number,
    default: 0
  },
  
  medicineCharges: {
    type: Number,
    default: 0
  },
  
  procedureCharges: {
    type: Number,
    default: 0
  },
  
  investigationCharges: {
    type: Number,
    default: 0
  },
  
  otherCharges: {
    type: Number,
    default: 0
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  tax: {
    type: Number,
    default: 0
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  paidAmount: {
    type: Number,
    default: 0
  },
  
  balanceAmount: {
    type: Number,
    default: 0
  },
  
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  
  paymentMode: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI', 'INSURANCE', 'CHEQUE'],
    default: 'CASH'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  remarks: {
    type: String,
    default: ''
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate balance amount before save
billingSchema.pre('save', function(next) {
  this.balanceAmount = this.totalAmount - this.paidAmount - this.discount;
  next();
});

module.exports = mongoose.model('Billing', billingSchema);