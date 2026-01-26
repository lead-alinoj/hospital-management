const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visit.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Reception routes
router.post('/',
  authorize('Reception', 'Admin'),  // ✅ Remove array brackets - authorize takes spread args
  visitController.createVisit
);

router.get('/today',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin'),
  visitController.getTodayVisits
);
router.get('/:id/with-vitals', 
  protect, 
  authorize('Doctor', 'Nurse', 'Admin'),
  async (req, res) => {
    try {
      const visit = await Visit.findById(req.params.id)
        .populate('patient')
        .populate('doctor')
        .populate('vitals')
        .populate('labResults');
      
      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found'
        });
      }
      
      res.json({
        success: true,
        data: visit
      });
    } catch (error) {
      console.error('Error fetching visit with vitals:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching visit details',
        error: error.message
      });
    }
  }
);
router.get(
  '/doctor/consulted',
  authorize('Doctor', 'Admin'),
  visitController.getDoctorConsultedPatients
);


// Role-specific routes
router.get('/pending-vitals',
  authorize('Nurse', 'Admin'),
  visitController.getPendingVitals
);

router.get('/pending-consultation',
  authorize('Doctor', 'Admin'),
  visitController.getPendingConsultation
);

// Visit management
router.get('/:id',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin', 'Pharmacy'),
  visitController.getVisitById
);

router.patch('/:id/status',
  authorize('Nurse', 'Doctor', 'Admin'),
  visitController.updateVisitStatus
);

router.get('/patient/:patientId',
  authorize('Reception', 'Nurse', 'Doctor', 'Admin'),
  visitController.getPatientVisits
);
router.delete('/:id',
  authorize('Reception', 'Admin'),
  visitController.deleteVisit
);

module.exports = router;