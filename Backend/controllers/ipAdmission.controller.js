const Visit = require('../models/visit.model');
const Bed = require('../models/bed.model');
const CareUnit = require('../models/careUnit.model');
const Patient = require('../models/patient.model');

/* ==============================
   BED AVAILABILITY
================================ */
exports.getBedAvailability = async (req, res) => {
  try {
    const availableBeds = await Bed.find({
      status: 'AVAILABLE',
      isActive: true
    })
      .populate('careUnit', 'unitNumber name category capacity')
      .sort({ bedNumber: 1 });

    const groupedBeds = {};
    availableBeds.forEach(bed => {
      const unitId = bed.careUnit._id.toString();
      if (!groupedBeds[unitId]) {
        groupedBeds[unitId] = {
          unit: bed.careUnit,
          beds: []
        };
      }
      groupedBeds[unitId].beds.push(bed);
    });

    res.json({
      success: true,
      data: {
        groupedBeds,
        totalAvailable: availableBeds.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bed availability',
      error: error.message
    });
  }
};




/* ==============================
   EMERGENCY ADMISSION (RECEPTION)
================================ */
exports.emergencyAdmission = async (req, res) => {
  try {
    const { patientId, bedId, admissionReason, isObservationCase, shift } = req.body;

    // Validate reception role
    if (req.user.role !== 'Reception' && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only reception can perform emergency admission' 
      });
    }

    // ✅ FIRST: Check if patient is already admitted in ANY bed
    const existingAdmission = await Bed.findOne({
      currentPatient: patientId,
      status: 'OCCUPIED'
    });

    if (existingAdmission) {
      return res.status(400).json({ 
        success: false,
        message: 'Patient already admitted to another bed' 
      });
    }

    // ✅ Check if bed is available
    const bed = await Bed.findOne({ 
      _id: bedId, 
      status: 'AVAILABLE', 
      isActive: true 
    });
    
    if (!bed) {
      return res.status(400).json({ 
        success: false,
        message: 'Bed not available or does not exist' 
      });
    }

    // ✅ Create or find emergency visit
    let visit = await Visit.findOne({
      patient: patientId,
      visitType: 'Emergency',
      admissionStatus: 'NOT_ADMITTED'
    });

    if (!visit) {
      visit = new Visit({
        patient: patientId,
        visitType: 'Emergency',
        priority: 'Emergency',
        shift: shift || this.getCurrentShift(),
        chiefComplaint: admissionReason || 'Emergency Admission',
        createdBy: req.user.id,
        visitStatus: 'Waiting',
        admissionStatus: 'NOT_ADMITTED'
      });
      await visit.save();
    }

    // ✅ Update bed status (atomic operation to prevent race conditions)
    bed.status = 'OCCUPIED';
    bed.currentPatient = visit.patient._id || patientId;
    bed.currentVisit = visit._id;
    bed.admissionDate = new Date();
    await bed.save();

    // ✅ Update visit with emergency admission
    visit.admissionStatus = 'IP_ACTIVE';
    visit.admissionType = isObservationCase ? 'OBSERVATION' : 'EMERGENCY';
    visit.admissionDate = new Date();
    visit.bedAllocated = bed._id;
    visit.admissionReason = admissionReason;
    visit.admittedByRole = 'Reception';
    
    if (isObservationCase) {
      visit.isObservationCase = true;
    }
    
    await visit.save();

    // ✅ Update patient type
    await Patient.findByIdAndUpdate(patientId, { patientType: 'IP' });

    res.json({ 
      success: true, 
      message: 'Emergency IP admission successful',
      data: { visit, bed }
    });

  } catch (error) {
    console.error('❌ Emergency admission error:', error);
    res.status(500).json({
      success: false,
      message: 'Emergency admission failed',
      error: error.message
    });
  }
};

// Helper function to get current shift
function getCurrentShift() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Morning' : 'Evening';
}
/* ==============================
   DOCTOR → RECOMMEND IP (NO BED)
================================ */
/* ==============================
   DOCTOR → RECOMMEND IP (NO BED)
================================ */
// In ipAdmission.controller.js - Update recommendIP
exports.recommendIP = async (req, res) => {
  try {
    console.log('🔵 recommendIP API called');
    console.log('👉 User:', req.user.id, req.user.role);
    console.log('👉 Body:', JSON.stringify(req.body, null, 2));

    const { visitId, admissionNotes, admissionType } = req.body;

    // Find visit with all necessary fields
    const visit = await Visit.findById(visitId)
      .populate('patient')
      .populate('doctor');

    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found',
        visitId 
      });
    }

    console.log('📊 Visit BEFORE update:');
    console.log('  - ID:', visit._id);
    console.log('  - Patient:', visit.patient?.fullName);
    console.log('  - Current visitStatus:', visit.visitStatus);
    console.log('  - Current admissionStatus:', visit.admissionStatus);

    // Ensure the visit can be recommended for IP
    if (visit.admissionStatus === 'IP_ACTIVE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient already admitted as IP' 
      });
    }

    // Update all necessary fields
    visit.visitStatus = 'IP_RECOMMENDED';
    visit.admissionStatus = 'NOT_ADMITTED';
    visit.admissionType = admissionType || 'DOCTOR_ADVISED';
    visit.ipRecommendationNotes = admissionNotes;
    visit.admittedByRole = 'Doctor';
    visit.updatedAt = new Date();

    // Mark as modified to ensure save
    visit.markModified('visitStatus');
    visit.markModified('admissionStatus');

    console.log('📊 Visit AFTER update (before save):');
    console.log('  - visitStatus:', visit.visitStatus);
    console.log('  - admissionStatus:', visit.admissionStatus);
    console.log('  - admissionType:', visit.admissionType);
    console.log('  - ipRecommendationNotes:', visit.ipRecommendationNotes);

    // Save the visit
    await visit.save();
    console.log('✅ Visit saved successfully');

    // Fetch again to verify
    const updatedVisit = await Visit.findById(visitId)
      .select('visitStatus admissionStatus admissionType ipRecommendationNotes updatedAt')
      .lean();

    console.log('✅ Verified from database:');
    console.log('  - visitStatus:', updatedVisit.visitStatus);
    console.log('  - admissionStatus:', updatedVisit.admissionStatus);
    console.log('  - admissionType:', updatedVisit.admissionType);
    console.log('  - updatedAt:', updatedVisit.updatedAt);

    res.json({
      success: true,
      message: 'IP recommended successfully',
      data: {
        visitId: visit._id,
        patientName: visit.patient?.fullName,
        visitStatus: updatedVisit.visitStatus,
        admissionStatus: updatedVisit.admissionStatus,
        admissionType: updatedVisit.admissionType,
        updatedAt: updatedVisit.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error in recommendIP:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to recommend IP',
      error: error.message,
      stack: error.stack
    });
  }
};
// In ipAdmission.controller.js - Temporary debug version
exports.getRecommendedIPPatients = async (req, res) => {
  try {
    console.log('🔵 getRecommendedIPPatients called - DEBUG MODE');
    
    // First, let's see what's in the database
    const allVisits = await Visit.find({})
      .populate('patient', 'fullName age gender opNumber')
      .populate('doctor', 'name')
      .populate('vitals')
      .populate({
        path: 'prescriptionId',
        select: 'diagnosis medicines',
        populate: {
          path: 'medicines.medicineId',
          select: 'name strength unit price'
        }
      })
      .sort({ updatedAt: -1 })
      .limit(10);

    console.log('📊 All recent visits (10):');
    allVisits.forEach(v => {
      console.log(`  Visit ${v._id}: ${v.patient?.fullName} - Status: ${v.visitStatus}, Admission: ${v.admissionStatus}`);
    });

    // Now filter for IP_RECOMMENDED
    const visits = await Visit.find({
      $or: [
        { visitStatus: 'IP_RECOMMENDED' },
        { visitStatus: 'Consultation_Completed' } // For testing
      ],
      admissionStatus: 'NOT_ADMITTED'
    })
      .populate('patient', 'fullName age gender opNumber')
      .populate('doctor', 'name')
      .populate('vitals')
      .populate({
        path: 'prescriptionId',
        select: 'diagnosis medicines',
        populate: {
          path: 'medicines.medicineId',
          select: 'name strength unit price'
        }
      })
      .sort({ updatedAt: -1 });

    console.log('✅ Filtered visits count:', visits.length);
    console.log('👉 Query used: visitStatus: IP_RECOMMENDED, admissionStatus: NOT_ADMITTED');

    const formattedVisits = visits.map(v => {
      const medicines = v.prescriptionId?.medicines || [];
      
      const formattedMedicines = medicines.map(m => ({
        medicineName: m.medicineId?.name || m.name || 'Unknown Medicine',
        strength: m.strength || m.medicineId?.strength,
        quantity: m.quantity || 1,
        days: m.days || 1,
        take: m.take || 'After Food',
        morning: m.morning,
        noon: m.noon,
        evening: m.evening,
        night: m.night,
        instructions: m.instructions
      }));

      return {
        visitId: v._id,
        patient: v.patient,
        doctor: v.doctor,
        recommendedByRole: v.admittedByRole || 'Doctor',
        diagnosis: v.prescriptionId?.diagnosis || v.diagnosis || 'No diagnosis',
        admissionNotes: v.ipRecommendationNotes || v.doctorAdmissionNotes,
        admissionType: v.admissionType || 'DOCTOR_ADVISED',
        vitals: v.vitals,
        medicines: formattedMedicines,
        recommendedAt: v.updatedAt,
        // Debug info
        visitStatus: v.visitStatus,
        admissionStatus: v.admissionStatus
      };
    });

    res.json({
      success: true,
      data: formattedVisits,
      debug: {
        totalFound: visits.length,
        query: {
          visitStatus: 'IP_RECOMMENDED',
          admissionStatus: 'NOT_ADMITTED'
        }
      }
    });

  } catch (err) {
    console.error('❌ getRecommendedIPPatients ERROR:', err);
    res.status(500).json({ 
      success: false,
      message: err.message,
      data: [],
      error: err.stack
    });
  }
};


exports.cancelAdmission = async (req, res) => {
  try {
    const { visitId, cancellationReason } = req.body;

    const visit = await Visit.findById(visitId).populate('bedAllocated');
    if (!visit || visit.admissionStatus !== 'IP_ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Patient not currently admitted'
      });
    }

    // Free up the bed
    if (visit.bedAllocated) {
      const bed = await Bed.findById(visit.bedAllocated._id);
      if (bed) {
        bed.status = 'AVAILABLE';
        bed.currentPatient = null;
        bed.currentVisit = null;
        bed.admissionDate = null;
        await bed.save();
      }
    }

    // Reset visit admission status
    visit.admissionStatus = 'NOT_ADMITTED';
    visit.admissionType = null;
    visit.admissionDate = null;
    visit.bedAllocated = null;
    visit.admissionReason = null;
    visit.cancellationReason = cancellationReason;
    await visit.save();

    // Reset patient type
    await Patient.findByIdAndUpdate(visit.patient, { patientType: 'OP' });

    res.json({
      success: true,
      message: 'Admission cancelled successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cancellation failed',
      error: error.message
    });
  }
};
exports.dischargePatient = async (req, res) => {
  const bed = await Bed.findById(req.params.id);

  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  if (bed.status !== 'OCCUPIED') {
    return res.status(400).json({
      success: false,
      message: 'Bed is not occupied'
    });
  }

  const visitId = bed.currentVisit;

  // 🔒 FORCE RESET (NO PARTIAL STATES)
  bed.status = 'AVAILABLE';
  bed.currentPatient = null;
  bed.currentVisit = null;
  bed.dischargeDate = new Date();
  bed.cleaned = false;

  await bed.save();

  if (visitId) {
    await require('../models/visit.model').findByIdAndUpdate(
      visitId,
      {
        admissionStatus: 'DISCHARGED',
        dischargeDate: bed.dischargeDate
      }
    );
  }

  res.json({
    success: true,
    message: 'Patient discharged successfully'
  });
};

/* ==============================
   CURRENT IP PATIENTS
================================ */
exports.getCurrentIPPatients = async (req, res) => {
  try {
    const visits = await Visit.find({
      admissionStatus: 'IP_ACTIVE'
    })
      .populate('patient')
      .populate('doctor')
      .populate('bedAllocated');

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load IP patients',
      error: error.message
    });
  }
};


/* ==============================
   DOCTOR ADVISED ADMISSION
================================ */
exports.doctorAdvisedAdmission = async (req, res) => {
  try {
    const { 
      visitId, 
      bedId, 
      admissionReason, 
      clinicalNotes,
      admissionType = 'DOCTOR_ADVISED',
      observationEndTime,
      expectedStayDays,
      nursingInstructions
    } = req.body;

    // Validate doctor role
    if (req.user.role !== 'Doctor' && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only doctors can recommend IP admission' 
      });
    }

    const visit = await Visit.findById(visitId)
      .populate('patient')
      .populate('doctor');
    
    if (!visit) {
      return res.status(404).json({ 
        success: false,
        message: 'Visit not found' 
      });
    }

    if (visit.admissionStatus === 'IP_ACTIVE') {
      return res.status(400).json({ 
        success: false,
        message: 'Patient already admitted' 
      });
    }

    // Check if visit belongs to current doctor
    if (req.user.role === 'Doctor' && visit.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only admit your own patients' 
      });
    }

    const bed = await Bed.findOne({ 
      _id: bedId, 
      status: 'AVAILABLE', 
      isActive: true 
    });
    
    if (!bed) {
      return res.status(400).json({ 
        success: false,
        message: 'Bed not available' 
      });
    }

    // Update bed status
    bed.status = 'OCCUPIED';
    bed.currentPatient = visit.patient._id;
    bed.currentVisit = visit._id;
    bed.admissionDate = new Date();
    await bed.save();

    // Update visit with doctor's admission
    visit.admissionStatus = 'IP_ACTIVE';
    visit.admissionType = admissionType;
    visit.admissionDate = new Date();
    visit.bedAllocated = bed._id;
    visit.admissionReason = admissionReason;
    visit.doctorAdmissionNotes = clinicalNotes;
    visit.expectedStayDays = expectedStayDays;
    visit.admittedByRole = 'DOCTOR';
    
    if (admissionType === 'OBSERVATION') {
      visit.isObservationCase = true;
      visit.observationEndTime = observationEndTime;
    }
    
    await visit.save();

    // Update patient type
    await Patient.findByIdAndUpdate(visit.patient._id, { patientType: 'IP' });

    res.json({ 
      success: true, 
      message: 'Doctor advised IP admission successful',
      data: { visit, bed }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admission failed',
      error: error.message
    });
  }
};


/* ==============================
   GET AVAILABLE VISITS FOR RECEPTION
================================ */
exports.getAvailableVisits = async (req, res) => {
  try {
    if (req.user.role !== 'Reception' && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        message: 'Only reception can access this' 
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const visits = await Visit.find({
      visitDate: { $gte: todayStart, $lte: todayEnd },
      admissionStatus: 'NOT_ADMITTED',
      visitStatus: { $in: ['Vitals_Completed', 'Consultation_Completed', 'Waiting'] }
    })
      .populate('patient', 'fullName opNumber age gender')
      .populate('doctor', 'name')
      .sort({ tokenNumber: 1 });

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visits',
      error: error.message
    });
  }
};