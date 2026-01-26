const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  staffId: {
    type: String,
    ref: 'Staff',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
jobRole: {
  type: String,
  required: true
},
totalMinutes: {
  type: Number,
  default: 0
},
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Full Day', 'On Call'],
    required: true
  },
  inTime: {
    type: String,
    required: true
  },
  outTime: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day'],
    default: 'Present'
  },
  remarks: {
    type: String,
    default: ''
  },
  enteredBy: {
    type: String,
    required: true
  },
  
  createdTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ date: 1, staffId: 1 }, { unique: true });
attendanceSchema.index({ staffId: 1, date: -1 });
attendanceSchema.index({ jobRole: 1 });
attendanceSchema.index({ date: 1, jobRole: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);