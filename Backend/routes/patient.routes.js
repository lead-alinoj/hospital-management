const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const { protect, authorize } = require('../middleware/auth');

// ✅ Apply authentication
router.use(protect);

router.get('/quick-search',
  authorize('Reception', 'Admin','Doctor'),
  patientController.quickSearchPatients
);

router.get('/recent',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'),
  patientController.getRecentPatients
);

router.get('/search',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'),
  patientController.searchPatients
);

// Admin only routes
router.get('/',
  authorize('Admin'),
  patientController.getAllPatients
);

// MUST be last
router.get('/:id',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'),
  patientController.getPatientById
);

// Reception routes
router.post('/',
  authorize('Reception', 'Admin'),
  patientController.createPatient
);

router.put('/:id',
  authorize('Reception', 'Admin'),
  patientController.updatePatient
);
// Add this after the update route
router.delete('/:id',
  authorize('Reception', 'Admin'),
  patientController.deletePatient
);
router.patch('/:id/deactivate',
  authorize('Reception', 'Admin'),
  patientController.deactivatePatient
);
module.exports = router;
