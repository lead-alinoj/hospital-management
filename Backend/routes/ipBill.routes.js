// routes/ipBill.routes.js
const express = require('express');
const router = express.Router();
const ipBillController = require('../controllers/ipBill.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Add bill items - Multiple roles allowed
router.post('/items',
  authorize('Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Admin'),
  ipBillController.addIPBillItems
);

// Get bill items for visit
router.get('/items/:visitId',
  authorize('Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Admin'),
  ipBillController.getIPBillItems
);

// Calculate bill
router.get('/calculate/:visitId',
  authorize('Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Admin'),
  ipBillController.calculateIPBill
);

// Add manual bill item
router.post('/manual-item',
  authorize('Doctor', 'Nurse', 'Pharmacy', 'Reception', 'Admin'),
  ipBillController.addManualBillItem
);

// Mark items as billed
router.post('/mark-billed/:visitId',
  authorize('Admin', 'Reception'),
  ipBillController.markBillItemsAsBilled
);

// Update bill item
router.put('/items/:itemId',
  authorize('Admin', 'Reception'),
  ipBillController.updateBillItem
);

// Delete bill item
router.delete('/items/:itemId',
  authorize('Admin', 'Reception'),
  ipBillController.deleteBillItem
);

module.exports = router;