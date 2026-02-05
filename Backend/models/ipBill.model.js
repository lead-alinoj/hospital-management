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
  // FIXED: Added all service categories to enum
  categoryType: {
    type: String,
    enum: [
      // Pharmacy categories
      'Medicine', 'Consumable', 
      // Service categories (NEW)
      'ROOM', 'NURSING', 'DOCTOR', 'PROCEDURE', 'LAB', 'OTHER',
      // Other existing categories
      'Lab', 'Procedure', 'Blood', 'Miscellaneous'
    ],
    required: true,
    default: 'OTHER'
  },
  
  // Pricing
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // For Medicines
  frequency: String,
  days: Number,
  instructions: String,
  
  // Tracking - Make required but with default
  administeredBy: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Lab', 'System'],
    required: true,
    default: 'System'
  },
  
  addedBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  },
  
  isManual: {
    type: Boolean,
    default: false
  },
  
  isBilled: {
    type: Boolean,
    default: false
  },
  
  billGroup: {
    type: String,
    enum: ['PHARMACY', 'SERVICE'],
    default: 'SERVICE'
  },

  billingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingRecord'
  },
  
  billedAt: Date,
  
  isFinalized: {
    type: Boolean,
    default: false
  },
  
  notes: String,
  
  // Audit
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ipBillItemSchema.index({ visit: 1, billGroup: 1 });
ipBillItemSchema.index({ categoryType: 1, isBilled: 1 });
ipBillItemSchema.index({ visit: 1, isBilled: 1 });

// Update the updatedAt timestamp on save
ipBillItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-calculate totalPrice if not set
  if (!this.totalPrice && this.quantity && this.unitPrice) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  
});

module.exports = mongoose.model('IPBillItem', ipBillItemSchema);