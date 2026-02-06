const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bed.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Get all beds
router.get('/', authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'), bedController.getAllBeds);

// Get available beds
router.get('/available', authorize('Reception', 'Doctor', 'Admin', 'Nurse', 'Pharmacy'), bedController.getAvailableBeds);

// Get bed by ID
router.get('/:id', authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'), bedController.getBedById);

// Allocate bed to patient
router.post('/:id/allocate', authorize('Reception', 'Doctor', 'Admin', 'Pharmacy'), bedController.allocateBed);

// Discharge patient from bed
router.post('/:id/discharge', authorize('Reception', 'Doctor', 'Admin', 'Pharmacy'), bedController.dischargePatient);

// Update bed
router.put('/:id', authorize('Admin','Doctor','Nurse','Reception','Pharmacy'), bedController.updateBed);

// Create new bed
router.post('/', authorize('Admin','Doctor','Nurse','Reception','Pharmacy'), bedController.createBed);

module.exports = router;