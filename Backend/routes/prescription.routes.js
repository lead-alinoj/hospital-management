const express = require('express');
const {
  createPrescription,
  getPrescriptionByVisit,
  getPrescriptionById,
  getPrescriptionWithDetails,
  getPrescriptionsForPharmacy,
  dispensePrescription,
  getPatientPrescriptions,
  getPatientHistory
} = require('../controllers/prescription.controller');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * All prescription routes are protected
 */
router.use(protect);

/**
 * DOCTOR
 */
router.post('/', authorize('Doctor'), createPrescription);
// In prescription.routes.js - Add logging middleware
router.get('/visit/:visitId', 
  protect, 
  (req, res, next) => {
    console.log('🟢 GET /prescriptions/visit/:visitId route hit');
    console.log('👉 Visit ID:', req.params.visitId);
    console.log('👉 User:', req.user?.id, req.user?.role);
    next();
  }, 
  authorize('Doctor', 'Admin', 'Reception'), 
  getPrescriptionByVisit
);router.get('/patient/:patientId', authorize('Doctor', 'Admin', 'Nurse'), getPatientPrescriptions);
router.get('/patient/:patientId/history', authorize('Doctor', 'Admin', 'Nurse', 'Reception'), getPatientHistory);

/**
 * PHARMACY
 */
router.get('/pharmacy', authorize('Pharmacy', 'Admin'), getPrescriptionsForPharmacy);
router.patch('/:id/dispense', authorize('Pharmacy', 'Admin'), dispensePrescription);
router.get(
  '/:id/details',
  authorize('Doctor', 'Pharmacy', 'Admin'),
  getPrescriptionWithDetails
);

/**
 * COMMON
 */
router.get('/:id', authorize('Doctor', 'Pharmacy', 'Admin'), getPrescriptionById);

module.exports = router;
