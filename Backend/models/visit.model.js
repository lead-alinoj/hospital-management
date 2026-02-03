const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  visitDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  visitType: {
    type: String,
    enum: ['OP', 'IP', 'Emergency', 'FollowUp'],
    default: 'OP'
  },
doctor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: function () {
    return this.visitType === 'OP' || this.visitType === 'FollowUp';
  }
},

  tokenNumber: {
    type: Number,
      default: null 
  },
  shift: { type: String, enum: ['Morning', 'Evening'], required: true },

  chiefComplaint: {
    type: String,
    trim: true
  },
  visitStatus: {
    type: String,
    enum: [ 'Waiting', 'Vitals_In_Progress', 'Vitals_Completed', 'Consultation_In_Progress', 'Consultation_Completed','IP_RECOMMENDED','IP_ACTIVE',  'Pharmacy', 'Completed'],
    default: 'Waiting'
  },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Emergency'],
    default: 'Normal'
  },
  admissionStatus: {
  type: String,
  enum: ['NOT_ADMITTED', 'IP_ACTIVE', 'DISCHARGED'],
  default: 'NOT_ADMITTED'
},
admissionType: {
  type: String,
  enum: ['DOCTOR_ADVISED', 'EMERGENCY', 'OBSERVATION']
},
bedAllocated: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Bed'
},
admittedByRole: {
  type: String,
  enum: ['Doctor', 'Reception', 'Admin']
},
ipRecommendationNotes: String,
admissionDate: Date,
dischargeDate: Date,
  
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially_Paid', 'Insurance'],
    default: 'Pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vitals: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals'
  },
  diagnosis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagnosis'
  },
    prescriptionId: { // Make sure this field exists
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

visitSchema.pre('save', async function () {
  if (!this.isNew) return;

  const requiresDoctorToken =
    this.visitType === 'OP' || this.visitType === 'FollowUp';

  // Shift is always required
  if (!this.shift) {
    throw new Error('Shift is required for token generation');
  }

  // Doctor required only for OP / FollowUp
  if (requiresDoctorToken && !this.doctor) {
    throw new Error('Doctor is required for OP token generation');
  }

  const todayStart = new Date(this.visitDate);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(this.visitDate);
  todayEnd.setHours(23, 59, 59, 999);

  const query = {
    shift: this.shift,
    visitDate: { $gte: todayStart, $lte: todayEnd }
  };

  // Only OP tokens are doctor-based
  if (requiresDoctorToken) {
    query.doctor = this.doctor;
  }

  const lastVisit = await mongoose.model('Visit')
    .findOne(query)
    .sort({ tokenNumber: -1 });

  this.tokenNumber = lastVisit ? lastVisit.tokenNumber + 1 : 1;
});


module.exports = mongoose.model('Visit', visitSchema);