// routes/ipadmission.routes.js
const express = require('express');
const router = express.Router();

const ipController = require('../controllers/ipAdmission.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all IP routes
router.use(protect);

// ==================== ROUTES ====================

// Bed availability
router.get('/beds/available',
  authorize('Reception', 'Doctor', 'Nurse', 'Admin', 'Pharmacy'),
  ipController.getBedAvailability
);

// Current IP patients
router.get('/current',
  authorize('Doctor', 'Nurse', 'Admin', 'Reception', 'Pharmacy'),
  ipController.getCurrentIPPatients
);

// Recommended IP patients (from doctor recommendations)
router.get('/recommended',
  authorize('Reception', 'Admin', 'Doctor', 'Nurse', 'Pharmacy'),
  ipController.getRecommendedIPPatients
);

// Available visits for reception
router.get('/available-visits',
  authorize('Reception', 'Admin', 'Pharmacy'),
  ipController.getAvailableVisits
);

// Allocate bed for recommended admission (Reception only)
router.post('/allocate-recommended',
  authorize('Reception', 'Admin', 'Nurse', 'Pharmacy','Doctor'),
  ipController.allocateRecommendedAdmission
);

// Emergency admission (Reception)
router.post('/emergency',
  authorize('Reception', 'Admin', 'Nurse', 'Pharmacy'),
  ipController.emergencyAdmission
);

// Doctor advised admission
router.post('/doctor-admit',
  authorize('Doctor', 'Admin', 'Reception'),
  ipController.doctorAdvisedAdmission
);

// Doctor recommend IP (no bed allocation)
router.post('/recommend',
  authorize('Doctor', 'Admin'),
  ipController.recommendIP
);

// Cancel admission
router.post('/cancel',
  authorize('Reception', 'Doctor', 'Admin'),
  ipController.cancelAdmission
);

// Discharge patient
router.post('/discharge',
  authorize('Doctor', 'Admin', 'Nurse', 'Reception'),
  ipController.dischargePatient
);
// Doctor recommend IP (no bed allocation)
router.post('/recommend',
  authorize('Doctor', 'Admin'),
  ipController.recommendIP
);

// ==================== DEBUG ROUTES ====================
// (These can be removed in production)

// Debug: Check all recommendations
router.get('/debug/check-recommendations',
  authorize('Admin', 'Doctor', 'Reception'),
  async (req, res) => {
    try {
      const Visit = require('../models/visit.model');
      
      // First check ALL visits
      const allVisits = await Visit.find({})
        .select('_id patient doctor visitStatus admissionStatus admissionType')
        .populate('patient', 'fullName opNumber')
        .populate('doctor', 'name')
        .sort({ updatedAt: -1 })
        .limit(20);

      // Filter for IP_RECOMMENDED
      const ipRecommended = allVisits.filter(v => v.visitStatus === 'IP_RECOMMENDED');

      res.json({
        success: true,
        data: {
          totalVisits: allVisits.length,
          ipRecommendedCount: ipRecommended.length,
          ipRecommendedVisits: ipRecommended.map(v => ({
            id: v._id,
            patient: v.patient?.fullName,
            doctor: v.doctor?.name,
            visitStatus: v.visitStatus,
            admissionStatus: v.admissionStatus,
            admissionType: v.admissionType,
            updatedAt: v.updatedAt
          })),
          allRecentVisits: allVisits.map(v => ({
            id: v._id,
            patient: v.patient?.fullName,
            visitStatus: v.visitStatus,
            admissionStatus: v.admissionStatus,
            updatedAt: v.updatedAt
          }))
        }
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Debug: Get all recommendations
router.get('/debug/recommendations', 
  authorize('Admin', 'Doctor', 'Reception'),
  async (req, res) => {
    try {
      const Visit = require('../models/visit.model');
      
      const allVisits = await Visit.find({
        visitStatus: 'IP_RECOMMENDED'
      })
        .populate('patient', 'fullName')
        .populate('doctor', 'name')
        .populate('prescriptionId')
        .lean();
      
      console.log('Debug - All IP Recommended Visits:', allVisits);
      
      res.json({
        success: true,
        count: allVisits.length,
        visits: allVisits
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;