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
// Add to ipadmission.routes.js
router.get('/debug/check-recommendations',
  authorize('Admin', 'Doctor', 'Reception'),
  async (req, res) => {
    try {
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
// Add this to ipadmission.routes.js
router.get('/debug/recommendations', 
  authorize('Admin', 'Doctor', 'Reception'),
  async (req, res) => {
    try {
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
router.get(
  '/recommended',
  authorize('Reception', 'Admin', 'Doctor'),
  ipController.getRecommendedIPPatients
);
// Add this temporary debug route to your ipadmission.routes.js
router.get('/debug/recommendations',
  authorize('Admin'),
  async (req, res) => {
    try {
      // Check ALL visits to see what's happening
      const allVisits = await Visit.find({})
        .select('_id visitStatus admissionStatus admissionType ipRecommendationNotes patient doctor')
        .populate('patient', 'fullName opNumber')
        .populate('doctor', 'name')
        .sort({ updatedAt: -1 })
        .limit(10);

      // Check specifically for IP_RECOMMENDED
      const recommendedVisits = await Visit.find({
        visitStatus: 'IP_RECOMMENDED'
      }).countDocuments();

      console.log('=== DEBUG: All recent visits ===');
      allVisits.forEach(v => {
        console.log(`Visit ${v._id}: Status=${v.visitStatus}, Admission=${v.admissionStatus}, Type=${v.admissionType}`);
        console.log(`  Patient: ${v.patient?.fullName}, Doctor: ${v.doctor?.name}`);
      });
      console.log(`=== Total IP_RECOMMENDED: ${recommendedVisits} ===`);

      res.json({
        success: true,
        data: {
          allVisits,
          recommendedCount: recommendedVisits,
          ipRecommendedVisits: allVisits.filter(v => v.visitStatus === 'IP_RECOMMENDED')
        }
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
// Emergency admission (Reception)
router.post('/emergency',
  authorize('Reception', 'Admin', 'Nurse'),
  ipController.emergencyAdmission
);

// Doctor advised admission
router.post('/doctor-admit',
  authorize('Doctor', 'Admin','Reception'),
  ipController.doctorAdvisedAdmission
);

// Cancel admission
router.post('/cancel',
  authorize('Reception', 'Doctor', 'Admin'),
  ipController.cancelAdmission
);

// Discharge patient
router.post('/discharge',
  authorize('Doctor', 'Admin','Nurse', 'Reception'),
  ipController.dischargePatient
);

// Current IP patients
router.get('/current',
  authorize('Doctor', 'Nurse', 'Admin', 'Reception'),
  ipController.getCurrentIPPatients
);

module.exports = router;
