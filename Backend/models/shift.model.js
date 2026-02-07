const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Morning, Night
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "16:00"
  isOvernight: { type: Boolean, default: false },

  fullDayMinutes: { type: Number },
  halfDayMinutes: { type: Number },
  maxMinutes: { type: Number },
  

  active: { type: Boolean, default: true }
}, { timestamps: true });
shiftSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    
    let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    // Handle overnight shifts
    if (durationMinutes < 0) {
      durationMinutes += 1440; // 24 hours
    }
    
    this.fullDayMinutes = durationMinutes;
    this.halfDayMinutes = Math.floor(durationMinutes / 2);
    this.maxMinutes = Math.min(durationMinutes * 1.5, 1440); // Max 1.5x shift or 24h
  }
});
module.exports = mongoose.model('Shift', shiftSchema);
