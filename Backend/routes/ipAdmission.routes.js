// routes/ipadmission.routes.js
const express = require('express');
const router = express.Router();

const ipController = require('../controllers/ipAdmission.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all IP routes
router.use(protect);

// Add this route after existing routes:
router.get('/available-visits',
  authorize('Reception', 'Admin'),
  ipController.getAvailableVisits
);

// Bed availability
router.get('/beds/available',
  authorize('Reception', 'Doctor', 'Nurse', 'Admin'),
  ipController.getBedAvailability
);

// Emergency admission (Reception)
router.post('/emergency',
  authorize('Reception', 'Admin'),
  ipController.emergencyAdmission
);

// Doctor advised admission
router.post('/doctor-admit',
  authorize('Doctor', 'Admin'),
  ipController.doctorAdvisedAdmission
);

// Cancel admission
router.post('/cancel',
  authorize('Reception', 'Doctor', 'Admin'),
  ipController.cancelAdmission
);

// Discharge patient
router.post('/discharge',
  authorize('Doctor', 'Admin'),
  ipController.dischargePatient
);

// Current IP patients
router.get('/current',
  authorize('Doctor', 'Nurse', 'Admin'),
  ipController.getCurrentIPPatients
);

module.exports = router;
