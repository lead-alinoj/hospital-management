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
router.get('/visit/:visitId', authorize('Doctor', 'Admin'), getPrescriptionByVisit);
router.get('/patient/:patientId', authorize('Doctor', 'Admin', 'Nurse'), getPatientPrescriptions);
router.get('/patient/:patientId/history', authorize('Doctor', 'Admin', 'Nurse'), getPatientHistory);

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
