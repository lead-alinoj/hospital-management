const IPBill = require('../models/ipBill.model');
const Medicine = require('../models/medicine.model');

exports.addIPBillItems = async (req, res) => {
  try {
    const { visitId, items, administeredBy, notes } = req.body;

    // Create bill items
    const billItems = items.map(item => ({
      visit: visitId,
      patient: req.body.patientId,
      itemId: item.itemId,
      name: item.name,
      categoryType: item.categoryType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      frequency: item.frequency,
      days: item.days,
      instructions: item.instructions,
      administeredBy,
      notes,
      addedBy: req.user.id
    }));

    // Save bill items
    const savedItems = await IPBill.insertMany(billItems);

    // Update medicine stock if it's a medicine/consumable item
    for (const item of items) {
      if (item.itemId && (item.categoryType === 'Medicine' || item.categoryType === 'Consumable')) {
        const medicine = await Medicine.findById(item.itemId);
        if (medicine) {
          // Deduct stock for IP patient
          medicine.stockQty = Math.max(0, medicine.stockQty - item.quantity);
          await medicine.save();
        }
      }
    }

    res.json({
      success: true,
      data: savedItems,
      message: 'Bill items added successfully'
    });
  } catch (error) {
    console.error('Error adding IP bill items:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding bill items',
      error: error.message
    });
  }
};

exports.getIPBillItems = async (req, res) => {
  try {
    const { visitId } = req.params;

    const billItems = await IPBill.find({ visit: visitId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: billItems,
      count: billItems.length
    });
  } catch (error) {
    console.error('Error fetching IP bill items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill items',
      error: error.message
    });
  }
};

exports.calculateIPBill = async (req, res) => {
  try {
    const { visitId } = req.params;

    // Get visit details
    const Visit = require('../models/visit.model');
    const visit = await Visit.findById(visitId)
      .populate('bedAllocated')
      .populate('patient');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Get all bill items
    const billItems = await IPBill.find({ visit: visitId });

    // Calculate room charges
    const admissionDate = visit.admissionDate || new Date();
    const dischargeDate = visit.dischargeDate || new Date();
    const stayDays = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24));
    const roomChargesPerDay = visit.bedAllocated?.room?.chargesPerDay || 0;
    const roomCharges = stayDays * roomChargesPerDay;

    // Calculate item charges
    const itemCharges = billItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Doctor fees (can be configured)
    const doctorFees = 500; // Default doctor visit charge

    // Nursing charges
    const nursingCharges = stayDays * 200;

    // Total calculation
    const subtotal = roomCharges + itemCharges + doctorFees + nursingCharges;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const billSummary = {
      stayDays,
      admissionDate,
      dischargeDate,
      room: {
        number: visit.bedAllocated?.room?.roomNumber,
        type: visit.bedAllocated?.room?.type,
        chargesPerDay: roomChargesPerDay
      },
      charges: {
        roomCharges,
        itemCharges,
        doctorFees,
        nursingCharges,
        subtotal,
        tax,
        total
      },
      items: billItems,
      patient: visit.patient,
      paymentStatus: 'PENDING'
    };

    res.json({
      success: true,
      data: billSummary
    });
  } catch (error) {
    console.error('Error calculating IP bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating bill',
      error: error.message
    });
  }
};

exports.deleteIPBillItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const billItem = await IPBill.findById(itemId);
    if (!billItem) {
      return res.status(404).json({
        success: false,
        message: 'Bill item not found'
      });
    }

    // Restore stock if applicable
    if (billItem.itemId && (billItem.categoryType === 'Medicine' || billItem.categoryType === 'Consumable')) {
      const medicine = await Medicine.findById(billItem.itemId);
      if (medicine) {
        medicine.stockQty += billItem.quantity;
        await medicine.save();
      }
    }

    await IPBill.findByIdAndDelete(itemId);

    res.json({
      success: true,
      message: 'Bill item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bill item',
      error: error.message
    });
  }
};