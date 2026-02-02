const express = require('express');
const router = express.Router();
const ipBillController = require('../controllers/ipBill.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Add IP bill items
router.post('/',
  authorize('Nurse', 'Doctor', 'Reception', 'Admin'),
  ipBillController.addIPBillItems
);

// Get IP bill items for a visit
router.get('/:visitId',
  authorize('Nurse', 'Doctor', 'Reception', 'Admin'),
  ipBillController.getIPBillItems
);

// Calculate IP bill
router.get('/calculate/:visitId',
  authorize('Reception', 'Admin'),
  ipBillController.calculateIPBill
);

// Delete IP bill item
router.delete('/:itemId',
  authorize('Admin', 'Reception'),
  ipBillController.deleteIPBillItem
);

module.exports = router;