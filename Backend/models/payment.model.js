const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD'],
    required: true,
    default: 'CASH'
  },
  receivedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Reception', 'Admin', 'Pharmacy'],
      required: true
    }
  },
  remarks: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ visitId: 1, createdAt: -1 });
paymentSchema.index({ patientId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);