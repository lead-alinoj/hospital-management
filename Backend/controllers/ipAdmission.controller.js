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
    shift,
    chiefComplaint: 'Emergency Admission',
    createdBy: req.user.id,
    visitStatus: 'Waiting',
    admissionStatus: 'NOT_ADMITTED'
  });

  await visit.save();
}

    if (visit.admissionStatus === 'IP_ACTIVE') {
      return res.status(400).json({ 
        success: false,
        message: 'Patient already admitted' 
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

    // Update visit with emergency admission
    visit.admissionStatus = 'IP_ACTIVE';
    visit.admissionType = isObservationCase ? 'OBSERVATION' : 'EMERGENCY';
    visit.admissionDate = new Date();
    visit.bedAllocated = bed._id;
    visit.admissionReason = admissionReason;
    visit.admittedByRole = 'RECEPTION';
    
    if (isObservationCase) {
      visit.isObservationCase = true;
    }
    
    await visit.save();

    // Update patient type
    await Patient.findByIdAndUpdate(visit.patient._id, { patientType: 'IP' });

    res.json({ 
      success: true, 
      message: 'Emergency IP admission successful',
      data: { visit, bed }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Emergency admission failed',
      error: error.message
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
/* ==============================
   DISCHARGE PATIENT
================================ */
exports.dischargePatient = async (req, res) => {
  try {
    const { visitId, dischargeNotes } = req.body;

    const visit = await Visit.findById(visitId).populate('bedAllocated');
    if (!visit || visit.admissionStatus !== 'IP_ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Patient not currently admitted'
      });
    }

    if (visit.bedAllocated) {
      const bed = await Bed.findById(visit.bedAllocated._id);
      if (bed) {
        bed.status = 'AVAILABLE';
        bed.currentPatient = null;
        bed.currentVisit = null;
        bed.dischargeDate = new Date();
        bed.cleaned = false;
        await bed.save();
      }
    }

    visit.admissionStatus = 'DISCHARGED';
    visit.dischargeDate = new Date();
    visit.dischargeNotes = dischargeNotes;
    await visit.save();

    await Patient.findByIdAndUpdate(visit.patient, { patientType: 'OP' });

    res.json({
      success: true,
      message: 'Patient discharged successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Discharge failed',
      error: error.message
    });
  }
};

/* ==============================
   CURRENT IP PATIENTS
================================ */
exports.getCurrentIPPatients = async (req, res) => {
  const patients = await Visit.find({ admissionStatus: 'IP_ACTIVE' })
    .populate('patient', 'fullName age gender opNumber')
    .populate('doctor', 'name')
    .populate({
      path: 'bedAllocated',
      populate: { path: 'careUnit' }
    })
    .sort({ admissionDate: -1 });

  res.json({ success: true, data: patients });
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