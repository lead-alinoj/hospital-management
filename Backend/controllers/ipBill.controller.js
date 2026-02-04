// controllers/ipBill.controller.js
const IPBillItem = require('../models/ipBill.model');
const Medicine = require('../models/medicine.model');
const Visit = require('../models/visit.model');
const mongoose = require('mongoose');
const BillingRecord = require('../models/billingRecord.model');

// Add IP bill items
exports.addIPBillItems = async (req, res) => {
  try {
    const { visitId, items, administeredBy, notes } = req.body;
    
    const visit = await Visit.findById(visitId).populate('patient');
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    const billItems = [];
    for (const item of items) {
      // Handle medicine stock
      if (item.categoryType === 'Medicine' && item.itemId) {
        const medicine = await Medicine.findById(item.itemId);
        if (medicine) {
          // Check stock
          if (medicine.stockQty < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${medicine.name}`
            });
          }
          
          // Deduct stock
          medicine.stockQty -= item.quantity;
          await medicine.save();
        }
      }

      const totalPrice = item.quantity * item.unitPrice;
      
      const billItem = new IPBillItem({
        visit: visitId,
        patient: visit.patient._id,
        itemId: item.itemId,
        name: item.name,
        categoryType: item.categoryType || 'Medicine',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        frequency: item.frequency,
        days: item.days,
        instructions: item.instructions,
        administeredBy: administeredBy || 'Nurse',
        addedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        },
        notes: notes
      });

      billItems.push(billItem);
    }

    const savedItems = await IPBillItem.insertMany(billItems);

    res.json({
      success: true,
      data: savedItems,
      message: 'Bill items added successfully'
    });
  } catch (error) {
    console.error('Error adding IP bill items:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get IP bill items for a visit
exports.getIPBillItems = async (req, res) => {
  try {
    const { visitId } = req.params;

    const items = await IPBillItem.find({ visit: visitId })
      .populate('itemId', 'name strength unit category')
      .populate('addedBy.id', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error fetching IP bill items:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Doctor IP Medicines (Only Medicine category)
exports.getDoctorIPMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      'category.type': 'Medicine',
      isActive: true
    })
    .populate('category', 'name type')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Error fetching doctor medicines:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Simplify getBillableItems in medicine.controller.js
exports.getBillableItems = async (req, res) => {
  try {
    // Get all active items suitable for IP billing
    const items = await Medicine.find({
      isActive: true,
      $or: [
        { 'category.type': { $in: ['Medicine', 'Consumable'] } },
        { categoryType: { $in: ['Medicine', 'Consumable'] } }
      ]
    })
    .populate('category', 'name type')
    .sort({ name: 1 })
    .lean();
    
    // Transform to consistent format
    const transformedItems = items.map(item => ({
      _id: item._id,
      name: item.name || item.medicineName,
      genericName: item.genericName,
      strength: item.strength,
      unit: item.unit,
      price: item.price || item.unitPrice || 0,
      stockQty: item.stockQty || 0,
      minStock: item.minStock || 0,
      category: item.category || { type: 'Medicine' },
      categoryType: item.category?.type || item.categoryType || 'Medicine'
    }));

    res.json({
      success: true,
      data: transformedItems,
      total: transformedItems.length
    });
  } catch (error) {
    console.error('Error fetching billable items:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Calculate total bill
exports.calculateIPBill = async (req, res) => {
  try {
    const { visitId } = req.params;
    
    // Get all bill items
    const billItems = await IPBillItem.find({ visit: visitId });
    
    // Get visit details for room charges
    const visit = await Visit.findById(visitId)
      .populate('bedAllocated')
      .populate('patient');
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }
    
    // Calculate room charges
    const admissionDate = visit.admissionDate || new Date();
    const currentDate = new Date();
    const stayDays = Math.ceil((currentDate - admissionDate) / (1000 * 60 * 60 * 24));
    const roomChargesPerDay = visit.bedAllocated?.room?.chargesPerDay || 0;
    const roomCharges = stayDays * roomChargesPerDay;
    
    // Calculate item charges
    const itemCharges = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Total
    const subtotal = roomCharges + itemCharges;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    
    res.json({
      success: true,
      data: {
        patient: visit.patient,
        admissionDate,
        stayDays,
        roomCharges,
        itemCharges,
        subtotal,
        tax,
        total,
        items: billItems
      }
    });
  } catch (error) {
    console.error('Error calculating IP bill:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add manual bill item
exports.addManualBillItem = async (req, res) => {
  try {
    const manualItem = new IPBillItem({
      ...req.body,
      addedBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      isManual: true,
      createdAt: new Date()
    });

    const savedItem = await manualItem.save();

    res.json({
      success: true,
      data: savedItem,
      message: 'Manual charge added successfully'
    });
  } catch (error) {
    console.error('Error adding manual charge:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark Items as Billed
exports.markBillItemsAsBilled = async (req, res) => {
  try {
    const { visitId } = req.params;
    const paymentData = req.body;

    // Update all items
    await IPBillItem.updateMany(
      { visit: visitId, isBilled: false },
      {
        isBilled: true,
        billingId: new mongoose.Types.ObjectId(),
        billedAt: new Date()
      }
    );

    // Create billing record
    const billingRecord = new BillingRecord({
      visit: visitId,
      patient: req.body.patientId,
      totalAmount: paymentData.totalAmount,
      paidAmount: paymentData.paymentAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentAmount >= paymentData.totalAmount ? 'PAID' : 'PARTIAL',
      generatedBy: req.user.id
    });

    await billingRecord.save();

    res.json({
      success: true,
      data: billingRecord,
      message: 'Bill items marked as billed'
    });
  } catch (error) {
    console.error('Error marking items as billed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update bill item
exports.updateBillItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    const updatedItem = await IPBillItem.findByIdAndUpdate(
      itemId,
      {
        ...updates,
        totalPrice: updates.quantity * updates.unitPrice,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedItem,
      message: 'Bill item updated successfully'
    });
  } catch (error) {
    console.error('Error updating bill item:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete bill item
exports.deleteBillItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const billItem = await IPBillItem.findById(itemId);
    if (!billItem) {
      return res.status(404).json({
        success: false,
        message: 'Bill item not found'
      });
    }

    // Restore stock if medicine
    if (billItem.categoryType === 'Medicine' && billItem.itemId) {
      const medicine = await Medicine.findById(billItem.itemId);
      if (medicine) {
        medicine.stockQty += billItem.quantity;
        await medicine.save();
      }
    }

    await IPBillItem.findByIdAndDelete(itemId);

    res.json({
      success: true,
      message: 'Bill item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill item:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};