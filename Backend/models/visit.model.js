const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  // -------------------------
  // BASIC VISIT INFO
  // -------------------------
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
    required: true
  },

  tokenNumber: {
    type: Number,
    default: null
  },

  shift: {
    type: String,
    enum: ['Morning', 'Evening'],
    required: true
  },

  chiefComplaint: {
    type: String,
    trim: true
  },

  visitStatus: {
    type: String,
    enum: [
      'Waiting',
      'Vitals_In_Progress',
      'Vitals_Completed',
      'Consultation_In_Progress',
      'Consultation_Completed',
      'Pharmacy',
      'Completed'
    ],
    default: 'Waiting'
  },

  priority: {
    type: String,
    enum: ['Normal', 'High', 'Emergency'],
    default: 'Normal'
  },

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

  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],

  // -------------------------
  // IP / ADMISSION FIELDS
  // -------------------------

  admissionStatus: {
    type: String,
    enum: ['NOT_ADMITTED', 'IP_ACTIVE', 'DISCHARGED'],
    default: 'NOT_ADMITTED'
  },

  admissionType: {
    type: String,
    enum: ['EMERGENCY', 'DOCTOR_ADVISED', 'OBSERVATION'],
    default: null
  },

  admissionDate: {
    type: Date,
    default: null
  },

  dischargeDate: {
    type: Date,
    default: null
  },

  bedAllocated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    default: null
  },

  // Emergency admission (Reception)
  admittedByReception: {
    type: Boolean,
    default: false
  },

  admissionReason: {
    type: String,
    trim: true
  },

  // Doctor IP notes
  doctorAdmissionNotes: {
    type: String,
    trim: true
  },

  expectedStayDays: {
    type: Number,
    min: 0
  },

  // Observation case
  isObservationCase: {
    type: Boolean,
    default: false
  },

  observationEndTime: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// --------------------------------------
// TOKEN GENERATION (UNCHANGED & SAFE)
// --------------------------------------
visitSchema.pre('save', async function () {
  if (!this.isNew) return;

  if (!this.shift || !this.doctor) {
    throw new Error('Doctor and shift are required for token generation');
  }

  const todayStart = new Date(this.visitDate);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(this.visitDate);
  todayEnd.setHours(23, 59, 59, 999);

  const lastVisit = await mongoose.model('Visit').findOne({
    doctor: this.doctor,
    shift: this.shift,
    visitDate: { $gte: todayStart, $lte: todayEnd }
  }).sort({ tokenNumber: -1 });

  this.tokenNumber = lastVisit ? lastVisit.tokenNumber + 1 : 1;

  if (!this.tokenNumber) {
    throw new Error('Token generation failed');
  }
});

module.exports = mongoose.model('Visit', visitSchema);
