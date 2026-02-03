const mongoose = require('mongoose');

const ipBillItemSchema = new mongoose.Schema({
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
  
  // Item Details
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine'
  },
  name: {
    type: String,
    required: true
  },
  categoryType: {
    type: String,
    enum: ['Medicine', 'Consumable', 'Lab', 'Procedure', 'Blood', 'Miscellaneous'],
    required: true
  },
  
  // Pricing
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // For Medicines
  frequency: String,
  days: Number,
  instructions: String,
  
  // Tracking
  administeredBy: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Lab'],
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  isFinalized: {
    type: Boolean,
    default: false
  },
  
  notes: String,
  
  // Audit
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IPBillItem', ipBillItemSchema);