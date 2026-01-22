const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  opNumber: {
    type: String,
    unique: true,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: false 
  },
  age: {
    type: Number,
    default: 0
  },
  mobile: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  idProof: {
  type: {
    type: String,
    enum: ['Aadhaar', 'Voter ID', 'Driving License', 'Passport']
  },
  number: String
},
  emergencyContact: {
    name: String,
    relation: String,
    mobile: String
  },
  medicalHistory: {
    allergies: [String],
    chronicDiseases: [String],
    previousSurgeries: [String],
    currentMedications: [String]
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  patientType: {
    type: String,
    enum: ['OP', 'IP'],
    default: 'OP'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

patientSchema.pre('validate', async function () {
  // Generate OP Number
  if (this.isNew && !this.opNumber) {
    const year = new Date().getFullYear();

    const lastPatient = await mongoose.model('Patient')
      .findOne({ opNumber: new RegExp(`^OP-${year}`) })
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastPatient?.opNumber) {
      const last = parseInt(lastPatient.opNumber.split('-')[2]);
      nextNumber = last + 1;
    }

    this.opNumber = `OP-${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  // DOB → auto age
  if (this.dateOfBirth) {
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    this.age = age;
  }

  // ❌ Both missing → block save
  if (!this.dateOfBirth && !this.age) {
    throw new Error('Either Date of Birth or Age is required');
  }
});


// Virtual for full address
patientSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr?.street || ''}, ${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}`;
});

module.exports = mongoose.model('Patient', patientSchema);