const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['Medicine', 'Equipment', 'Consumable', 'Cleaning'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
