const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { protect, authorize } = require('../middleware/auth');
const roleMiddleware = require('../middleware/role.middleware');

router.use(protect); // ✅ correct

router.post('/',
  authorize('Nurse', 'Admin'),  // instead of roleMiddleware
  labController.createLabResult
);

router.post('/batch',
  authorize('Nurse', 'Admin'),
  labController.createBatchLabResults
);

// Read-only for Doctor
router.get('/visit/:visitId',
  authorize('Nurse', 'Doctor', 'Admin', 'Pharmacy'),
  labController.getLabResultsByVisit
);

router.get('/patient/:patientId',
  authorize('Doctor', 'Admin'),
  labController.getPatientLabHistory
);

// Lab-specific routes
router.patch('/:id/status',
  authorize('Nurse', 'Admin'),
  labController.updateLabStatus
);

router.patch('/:id/verify',
  authorize('Nurse', 'Admin'),
  labController.verifyLabResult
);

module.exports = router;