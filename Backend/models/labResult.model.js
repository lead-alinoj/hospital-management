const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
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
  testCode: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  testCategory: {
    type: String,
    enum: ['Blood', 'Urine', 'Stool', 'Imaging', 'Biopsy', 'Other'],
    required: true
  },
  subCategory: {
    type: String,
    enum: ['CBC', 'Biochemistry', 'Hormones', 'Serology', 'Culture', 'X-Ray', 'Ultrasound', 'CT', 'MRI', 'Other']
  },
  sampleType: String,
  resultValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: String,
  referenceRange: {
    low: mongoose.Schema.Types.Mixed,
    high: mongoose.Schema.Types.Mixed,
    text: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Sample_Collected', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  resultType: {
    type: String,
    enum: ['Numeric', 'Text', 'Positive/Negative', 'Range'],
    default: 'Numeric'
  },
  remarks: String,
  isCritical: {
    type: Boolean,
    default: false
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enteredAt: {
    type: Date,
    default: Date.now
  },
  reportedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
labResultSchema.index({ visit: 1, testCode: 1 }, { unique: true });
labResultSchema.index({ patient: 1, status: 1 });
labResultSchema.index({ testCategory: 1, status: 1 });

module.exports = mongoose.model('LabResult', labResultSchema);