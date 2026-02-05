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
// In ipBill.controller.js - Update calculateIPBill method
exports.calculateIPBill = async (req, res) => {
  try {
    const { visitId } = req.params;
    
    // Get all bill items
    const billItems = await IPBillItem.find({ visit: visitId });
    
    // Get visit details
    const visit = await Visit.findById(visitId)
      .populate('bedAllocated')
      .populate('patient');
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }
    
    // Calculate stay days (for information only)
    const admissionDate = visit.admissionDate || new Date();
    const currentDate = new Date();
    const stayDays = Math.ceil((currentDate - admissionDate) / (1000 * 60 * 60 * 24));
    const roomChargesPerDay = visit.bedAllocated?.room?.chargesPerDay || 0;
    const roomCharges = stayDays * roomChargesPerDay;
    
    // Calculate item charges (only from actual bill items)
    const itemCharges = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Total (NO GST)
    const total = itemCharges + roomCharges;
    
    res.json({
      success: true,
      data: {
        patient: visit.patient,
        admissionDate,
        stayDays,
        roomCharges,
        itemCharges,
        total, // No subtotal or tax
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

// Add manual bill item - UPDATED
exports.addManualBillItem = async (req, res) => {
  try {
    console.log('📝 Adding manual bill item:', req.body);
    console.log('👤 User:', req.user);
    
    // Extract data from request
    const { visit, patient, name, categoryType, quantity, unitPrice, totalPrice, 
            instructions, notes, billGroup = 'SERVICE' } = req.body;
    
    // Validate required fields
    if (!visit || !patient || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: visit, patient, name are required'
      });
    }
    
    // Calculate total price if not provided
    const qty = quantity || 1;
    const uPrice = unitPrice || 0;
    const calculatedTotalPrice = totalPrice || (qty * uPrice);
    
    // Map category to valid enum if needed
    const validCategory = mapToValidCategory(categoryType || 'OTHER');
    
    console.log('🔧 Creating manual item with:', {
      visit, patient, name, 
      categoryType: validCategory,
      quantity: qty,
      unitPrice: uPrice,
      totalPrice: calculatedTotalPrice,
      billGroup
    });
    
    const manualItem = new IPBillItem({
      visit,
      patient,
      name,
      categoryType: validCategory,
      quantity: qty,
      unitPrice: uPrice,
      totalPrice: calculatedTotalPrice,
      instructions: instructions || '',
      administeredBy: 'System', // Default for service items
      addedBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      isManual: true,
      billGroup: billGroup,
      notes: notes || '',
      createdAt: new Date()
    });

    console.log('💾 Saving manual item...');
    const savedItem = await manualItem.save();
    console.log('✅ Manual item saved:', savedItem._id);

    // Populate addedBy information
    const populatedItem = await IPBillItem.findById(savedItem._id)
      .populate('addedBy.id', 'name role')
      .lean();

    res.json({
      success: true,
      data: populatedItem,
      message: 'Manual charge added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding manual charge:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error.errors ? Object.keys(error.errors) : [],
      errorDetails: error.errors
    });
  }
};

// Helper function to map category to valid enum
function mapToValidCategory(category) {
  if (!category) return 'OTHER';
  
  const categoryMap = {
    'ROOM': 'ROOM',
    'NURSING': 'NURSING',
    'DOCTOR': 'DOCTOR',
    'CONSULTATION': 'DOCTOR',
    'PROCEDURE': 'PROCEDURE',
    'LAB': 'LAB',
    'OTHER': 'OTHER',
    'Medicine': 'Medicine',
    'Consumable': 'Consumable'
  };
  
  return categoryMap[category] || 'OTHER';
}

// In ipBill.controller.js - Update markBillItemsAsBilled method
exports.markBillItemsAsBilled = async (req, res) => {
  try {
    const { visitId } = req.params;
    const paymentData = req.body;

    console.log('🔵 Marking items as billed for visit:', visitId);
    console.log('📊 Payment data:', paymentData);

    // Get all unbilled items
    const unbilledItems = await IPBillItem.find({ 
      visit: visitId, 
      isBilled: false 
    });

    if (unbilledItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No unbilled items found'
      });
    }

    // Update all items
    const result = await IPBillItem.updateMany(
      { visit: visitId, isBilled: false },
      {
        isBilled: true,
        billedAt: new Date(),
        paymentMethod: paymentData.paymentMethod
      }
    );

    console.log('✅ Updated items:', result.modifiedCount);

    // Create billing record
    const billingRecord = new BillingRecord({
      visit: visitId,
      patient: paymentData.patientId,
      totalAmount: paymentData.totalAmount,
      paidAmount: paymentData.paymentAmount || paymentData.totalAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentAmount >= paymentData.totalAmount ? 'PAID' : 'PARTIAL',
      insuranceId: paymentData.insuranceId || '',
      notes: paymentData.notes || '',
      generatedBy: req.user.id,
      items: unbilledItems.map(item => item._id)
    });

    await billingRecord.save();

    console.log('✅ Billing record created:', billingRecord._id);

    res.json({
      success: true,
      data: {
        billingRecord,
        itemsUpdated: result.modifiedCount
      },
      message: 'Bill items marked as billed'
    });
  } catch (error) {
    console.error('❌ Error marking items as billed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
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
// Get service bill items only
// Get service bill items only
exports.getServiceBillItems = async (req, res) => {
  try {
    const { visitId } = req.params;
    console.log('📋 Getting service bill items for visit:', visitId);
    
    const items = await IPBillItem.find({ 
      visit: visitId,
      // Filter by service categories OR billGroup = 'SERVICE'
      $or: [
        { categoryType: { $in: ['ROOM', 'NURSING', 'DOCTOR', 'PROCEDURE', 'LAB', 'OTHER'] } },
        { billGroup: 'SERVICE' }
      ]
    })
    .populate('addedBy.id', 'name role')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${items.length} service items`);
    
    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('❌ Error fetching service bill items:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark service items as billed
exports.markServiceItemsAsBilled = async (req, res) => {
  try {
    const { visitId, itemIds, paymentData } = req.body;
    
    // Update service items
    const result = await IPBillItem.updateMany(
      { 
        _id: { $in: itemIds },
        visit: visitId,
        categoryType: { $in: ['ROOM', 'NURSING', 'DOCTOR', 'PROCEDURE', 'LAB', 'CONSULTATION', 'OTHER'] }
      },
      {
        isBilled: true,
        billedAt: new Date(),
        paymentMethod: paymentData.paymentMethod
      }
    );
    
    // Create service billing record
    const serviceBilling = new ServiceBillingRecord({
      visit: visitId,
      patient: paymentData.patientId,
      billType: 'SERVICE',
      totalAmount: paymentData.totalAmount,
      paidAmount: paymentData.paymentAmount || paymentData.totalAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentAmount >= paymentData.totalAmount ? 'PAID' : 'PARTIAL',
      insuranceId: paymentData.insuranceId || '',
      notes: paymentData.notes || '',
      generatedBy: req.user.id,
      items: itemIds
    });
    
    await serviceBilling.save();
    
    res.json({
      success: true,
      data: {
        billingRecord: serviceBilling,
        itemsUpdated: result.modifiedCount
      },
      message: 'Service bill generated successfully'
    });
  } catch (error) {
    console.error('Error marking service items as billed:', error);
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