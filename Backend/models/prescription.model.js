const mongoose = require('mongoose');

const prescriptionMedicineSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: String,
  strength: String,

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  take: {
    type: String, // 1 tablet, 5 ml
    required: true
  },

  morning: { type: Boolean, default: false },
  noon: { type: Boolean, default: false },
  evening: { type: Boolean, default: false },
  night: { type: Boolean, default: false },

  days: {
    type: Number,
    required: true,
    min: 1
  },

  instructions: String,
unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});
  

const prescriptionSchema = new mongoose.Schema({
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  icd10Code: {
    type: String
  },
  clinicalNotes: {
    type: String
  },
  medicines: [prescriptionMedicineSchema],
  advice: {
    type: String
  },
  followupDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
    totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially_Paid', 'Insurance'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Other']
  },
  paymentAmount: Number,
  // In prescription.model.js - add to schema
billingDetails: {
  medicineAmount: Number,
  labCharges: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalAmount: Number
},
  // Dispensing fields
  dispensedAt: Date,
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  
}, {
  timestamps: true
});
// FIXED: Remove the arrow function issue
prescriptionSchema.pre('save', function () {
  if (this.medicines && this.medicines.length > 0) {
    this.totalAmount = this.medicines.reduce((total, med) => {
      return total + (med.totalPrice || 0);
    }, 0);
  } else {
    this.totalAmount = 0;
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);