const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Get payments for a visit
router.get('/:visitId',
  authorize('Reception', 'Admin', 'Pharmacy'),
  paymentController.getPaymentsByVisit
);

// Create new payment
router.post('/',
  authorize('Reception', 'Admin'),
  paymentController.createPayment
);

module.exports = router;