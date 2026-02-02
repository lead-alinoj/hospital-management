const Medicine = require('../models/medicine.model');

// Create medicine
exports.createMedicine = async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all medicines
exports.getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const medicines = await Medicine.find()
      .populate('category', 'name type')

      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Medicine.countDocuments();

    res.json({
      success: true,
      data: medicines,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get medicine by ID
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('category', 'name type');
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all items for IP billing (all categories except Equipment for doctors)
exports.getAllItemsForIP = async (req, res) => {
  try {
    const medicines = await Medicine.find({ isActive: true })
      .populate('category', 'name type')
      .sort({ 'category.type': 1, name: 1 });

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Update medicine
exports.updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { quantity, type } = req.body;
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    if (type === 'add') {
      medicine.stockQty += quantity;
    } else if (type === 'subtract') {
      if (medicine.stockQty < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient stock' 
        });
      }
      medicine.stockQty -= quantity;
    }

    await medicine.save();
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateMedicineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    let newStock = medicine.stockQty;
    
    if (type === 'add') {
      newStock += quantity;
    } else if (type === 'subtract') {
      newStock = Math.max(0, newStock - quantity);
    }

    medicine.stockQty = newStock;
    await medicine.save();

    res.json({
      success: true,
      data: medicine,
      message: `Stock ${type === 'add' ? 'added' : 'subtracted'} successfully`
    });
  } catch (error) {
    console.error('Error updating medicine stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating medicine stock',
      error: error.message
    });
  }
}
// Get low stock medicines
// ✅ Get low stock medicines (FIXED)
exports.getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: {
        $lte: ['$stockQty', { $multiply: ['$minStock', 1.5] }]
      }
    }).populate('category', 'name type');

    const alerts = medicines.map(medicine => ({
      medicine,
      currentStock: medicine.stockQty,
      minStock: medicine.minStock,
      isCritical: medicine.stockQty <= medicine.minStock
    }));

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ FIXED: getDoctorMedicines
exports.getDoctorMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ isActive: true })
      .populate({
        path: 'category',
        match: { type: 'Medicine' }
      })
      .where('category').ne(null)
      .sort({ name: 1 });

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search medicines
exports.searchMedicines = async (req, res) => {
  try {
    const query = req.query.query;
    
    let medicines;
    if (query) {
      medicines = await Medicine.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { genericName: { $regex: query, $options: 'i' } },
          { brandName: { $regex: query, $options: 'i' } }
        ]
      }).populate('category', 'name type').limit(20);
    } else {
      medicines = await Medicine.find().limit(20);
    }

    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get available medicines
exports.getAvailableMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      stockQty: { $gt: 0 }
    }).sort({ name: 1 });

    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};