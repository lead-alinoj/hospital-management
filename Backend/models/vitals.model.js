// models/vitals.model.js
const mongoose = require('mongoose');

// models/vitals.model.js - Update the schema
const vitalsSchema = new mongoose.Schema({
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
  // Make only height and weight required
  height: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  // Make all other fields optional
  bloodPressure: {
    systolic: {
      type: Number,
      min: 0
    },
    diastolic: {
      type: Number,
      min: 0
    }
  },
  pulse: {
    type: Number,
    min: 0
  },
  temperature: {
    type: Number,
    min: 0
  },
  spo2: {
    type: Number,
    min: 0,
    max: 100
  },
  respiratoryRate: {
    type: Number,
    min: 0
  },
  bloodSugar: {
    value: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['Fasting', 'Postprandial', 'Random']
    }
  },
  bmi: {
    type: Number
  },
  remarks: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
vitalsSchema.pre('save', function () {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat(
      (this.weight / (heightInMeters * heightInMeters)).toFixed(1)
    );
  }
});

module.exports = mongoose.model('Vitals', vitalsSchema);