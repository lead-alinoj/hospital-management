const IPBillItem = require('../models/ipBill.model');
const Medicine = require('../models/medicine.model');
const Visit = require('../models/visit.model');

// Add IP bill items
exports.addIPBillItems = async (req, res) => {
  try {
    const { visitId, items } = req.body;
    
    // Get visit and patient
    const visit = await Visit.findById(visitId).populate('patient');
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }
    
    // Validate and prepare items
    const billItems = [];
    
    for (const item of items) {
      // For medicine items, check stock and deduct
      if (item.categoryType === 'Medicine' && item.itemId) {
        const medicine = await Medicine.findById(item.itemId);
        
        if (!medicine) {
          throw new Error(`Medicine ${item.name} not found`);
        }
        
        if (medicine.stockQty < item.quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQty}`);
        }
        
        // Deduct stock
        medicine.stockQty -= item.quantity;
        await medicine.save();
      }
      
      // Create bill item
      const billItem = new IPBillItem({
        visit: visitId,
        patient: visit.patient._id,
        itemId: item.itemId,
        name: item.name,
        categoryType: item.categoryType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        frequency: item.frequency,
        days: item.days,
        instructions: item.instructions,
        administeredBy: req.body.administeredBy,
        addedBy: req.user.id,
        notes: req.body.notes
      });
      
      billItems.push(billItem);
    }
    
    // Save all items
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
      .sort({ createdAt: -1 })
      .populate('addedBy', 'name role');
    
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
    
    // Restore stock if medicine item
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