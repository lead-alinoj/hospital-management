// routes/vitals.routes.js
const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitals.controller');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// ✅ Nurse routes for vitals management
router.post('/',
  authorize('Nurse','Doctor', 'Admin'),
  vitalsController.createVitals
);

router.get('/pending',
  authorize('Nurse', 'Admin'),
  vitalsController.getPendingVitals
);

router.get('/visit/:visitId',
  authorize('Nurse', 'Doctor', 'Admin'),
  vitalsController.getVitalsByVisitId
);

router.get('/patient/:patientId',
  authorize('Nurse', 'Doctor', 'Admin'),
  vitalsController.getPatientVitals
);

router.put('/:id',
  authorize('Nurse', 'Admin'),
  vitalsController.updateVitals
);

router.get('/:id',
  authorize('Nurse', 'Doctor', 'Admin'),
  vitalsController.getVitalsById
);

module.exports = router;