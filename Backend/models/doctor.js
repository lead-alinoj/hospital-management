const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true,
    default: 'assets/images/default-doctor.jpg'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);