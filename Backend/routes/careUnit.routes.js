const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const careUnitController = require('../controllers/careUnit.controller');

router.use(protect);

router.post(
  '/',
  authorize('Admin', 'Reception'),
  careUnitController.createCareUnit
);

router.get(
  '/',
  authorize('Admin', 'Reception', 'Nurse'),
  careUnitController.getAllCareUnits
);

router.put(
  '/:id',
  authorize('Admin'),
  careUnitController.updateCareUnit
);

module.exports = router;
