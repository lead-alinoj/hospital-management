const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String },
  contactNumber: { type: String },
  email: { type: String },
  description: { type: String },
  appointmentDate: { type: Date },
  appointmentTime: { type: String }, // Optional: store as string like "10:30 AM"
  createdAt: { type: Date, default: Date.now } // Booking timestamp
});

module.exports = mongoose.model('Appointment', appointmentSchema);
