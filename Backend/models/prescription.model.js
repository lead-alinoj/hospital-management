const mongoose = require('mongoose');

const prescriptionMedicineSchema = new mongoose.Schema({
medicineId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Medicine',
  required: function () {
    return this.type === 'STOCK';
  }
},
  medicineName: String,
  strength: String,

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

take: {
  type: String,
  default: null

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
    min: 0
  },
  totalPrice: {
    type: Number,
    min: 0
  },


  type: {
  type: String,
  enum: ['STOCK', 'MANUAL'],
  required: true
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
   patientType: {
    type: String,
    enum: ['OP', 'IP'],
    default: 'OP',
    index: true
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
 default: 0,
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
  if (!this.medicines || this.medicines.length === 0) {
    this.totalAmount = 0;
    return;
  }

  // ✅ Only include medicines that are IN STOCK and have medicineId (not manual/outside)
  this.totalAmount = this.medicines.reduce((total, med) => {
    // Skip manual/outside medicines
    if (!med.medicineId) return total;
    // Skip out-of-stock medicines
    if (med.isOutOfStock) return total;
    // Skip medicines with zero price
    if (!med.unitPrice) return total;
    return total + (med.unitPrice * (med.quantity || 0));
  }, 0);
});


module.exports = mongoose.model('Prescription', prescriptionSchema);