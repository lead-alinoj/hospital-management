const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  genericName: String,
  brandName: String,
  strength: String,
  unit: String,

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  stockQty: { type: Number, default: 0 },
  minStock: { type: Number },
  price: { type: Number },

  expiryDate: Date,
  batchNumber: String,
  supplier: String,

  isActive: { type: Boolean, default: true }
}, { timestamps: true });


medicineSchema.index({ name: 'text', genericName: 'text', brandName: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);