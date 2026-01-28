const express = require('express');
const router = express.Router();

const shiftController = require('../controllers/shift.controller');
const { protect, authorize } = require('../middleware/auth');

// Create shift (Admin only)
router.post(
  '/create',
  protect,
  authorize('Admin'),
  shiftController.createShift
);

// Get active shifts
router.get(
  '/list',
  protect,
  shiftController.getShifts
);
// Update shift
router.put(
  '/update/:id',
  protect,
  authorize('Admin'),
  shiftController.updateShift
);

// Deactivate shift
router.delete(
  '/deactivate/:id',
  protect,
  authorize('Admin'),
  shiftController.deactivateShift
);
module.exports = router;
