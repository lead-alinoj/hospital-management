const Payment = require('../models/payment.model');

// GET /api/ip/payments/:visitId
exports.getPaymentsByVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    
    const payments = await Payment.find({ visitId })
      .populate('receivedBy.userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: payments,
      total: payments.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/ip/payments
exports.createPayment = async (req, res) => {
  try {
    const { visitId, patientId, amount, paymentMode, remarks } = req.body;
    
    const payment = new Payment({
      visitId,
      patientId,
      amount,
      paymentMode,
      remarks,
      receivedBy: {
        userId: req.user.id,
        role: req.user.role
      }
    });
    
    await payment.save();
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};