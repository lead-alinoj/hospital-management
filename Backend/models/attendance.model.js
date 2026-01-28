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
  overtimeMinutes: { type: Number, default: 0 },

  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
   attendanceDate: Date,     // IN date
  inTime: Date,
  outTime: Date,
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
  },
  adminLogout: {
  type: Boolean,
  default: false
},

adminOutTime: {
  type: Date
},

logoutReason: {
  type: String,
  enum: ['Forgot to logout', 'Server issue', 'Emergency', 'System error']
},

adminClosedBy: {
  type: String
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