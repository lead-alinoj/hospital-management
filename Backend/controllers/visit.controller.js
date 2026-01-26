const Visit = require('../models/visit.model');
const Patient = require('../models/patient.model');
const Vitals = require('../models/vitals.model');
const User = require('../models/User');

exports.createVisit = async (req, res) => {
  try {
    const { patientId, doctorId, chiefComplaint, priority, visitType, shift } = req.body;

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Validate doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
// Check for duplicate visit for same patient, doctor, shift, and visitDate
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

const existingVisit = await Visit.findOne({
  patient: patientId,
  doctor: doctorId,
  shift: shift || 'Morning', // default shift
  visitDate: { $gte: todayStart, $lte: todayEnd }
});

if (existingVisit) {
  return res.status(400).json({
    success: false,
    message: 'Duplicate visit not allowed: This patient already has a visit with the same doctor and shift today.'
  });
}

    // Prepare visit data with all required fields
    const visitData = {
      patient: patientId,
      doctor: doctorId,
       visitType: visitType,
      chiefComplaint: chiefComplaint || '',
      priority: priority || 'Normal',
      shift: shift || 'Morning',
      createdBy: req.user.id,
      visitStatus: 'Waiting', // Set initial status to 'Waiting'
    };
  console.log('Visit data to save:', visitData);

    // Create visit
    const visit = new Visit(visitData);
    await visit.save(); // Use save() instead of create() to ensure middleware runs

    await visit.populate([
      { path: 'patient', select: 'opNumber fullName gender age' },
      { path: 'doctor', select: 'name specialization' },
      { path: 'createdBy', select: 'name role' }
    ]);

    res.status(201).json({
      success: true,
      data: visit,
      message: `Visit created successfully. Token: ${visit.tokenNumber}`
    });

  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating visit',
      error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined

    });
  }
};

// Get doctor consulted patients
exports.getDoctorConsultedPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const visits = await Visit.find({
      doctor: doctorId,
      visitStatus: 'Consultation_Completed'
    })
      .populate('patient', 'fullName age gender opNumber mobile')
      .sort({ consultationTime: -1 });

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    console.error('Doctor patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor patients'
    });
  }
};

exports.getAllPatientsWithLastVisit = async (req, res) => {
  try {
    const patients = await Patient.aggregate([
      {
        $match: {} // or any filter you want
      },
      {
        $lookup: {
          from: 'visits',          // Visit collection
          localField: '_id',       // patient _id
          foreignField: 'patient', // Visit.patient
          as: 'visits'
        }
      },
      {
        $addFields: {
          lastVisitDate: { $max: '$visits.visitDate' },  // calculate latest visit date
          lastToken: { $max: '$visits.tokenNumber' }    // optional, latest token
        }
      },
      {
        $project: {
          visits: 0 // remove heavy visits array
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients with last visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

exports.getTodayVisits = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits = await Visit.find({
      visitDate: { $gte: today, $lt: tomorrow }
    })
      .populate('patient', 'opNumber fullName gender age mobile')
      .populate('doctor', 'name specialization')
      .populate('createdBy', 'name role')
      .sort({ tokenNumber: 1 });

    // Group by status
    const groupedVisits = {
  waiting: visits.filter(v => v.visitStatus === 'Waiting'),
  vitals_in_progress: visits.filter(v => v.visitStatus === 'Vitals_In_Progress'),
  vitals_completed: visits.filter(v => v.visitStatus === 'Vitals_Completed'),
  consultation_in_progress: visits.filter(v => v.visitStatus === 'Consultation_In_Progress'),
  consultation_completed: visits.filter(v => v.visitStatus === 'Consultation_Completed'),
  pharmacy: visits.filter(v => v.visitStatus === 'Pharmacy'),
  completed: visits.filter(v => v.visitStatus === 'Completed')
};


    res.status(200).json({
      success: true,
      data: groupedVisits,
      summary: {
        total: visits.length,
      byStatus: {
  waiting: groupedVisits.waiting.length,
  vitals_in_progress: groupedVisits.vitals_in_progress.length,
  vitals_completed: groupedVisits.vitals_completed.length,
  consultation_in_progress: groupedVisits.consultation_in_progress.length,
  consultation_completed: groupedVisits.consultation_completed.length,
  pharmacy: groupedVisits.pharmacy.length,
  completed: groupedVisits.completed.length
}

      }
    });
  } catch (error) {
    console.error('Error fetching today\'s visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s visits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getPendingVitals = async (req, res) => {
  try {
    const visits = await Visit.find({
visitStatus: 'Waiting'
    })
      .populate('patient', 'opNumber fullName gender age mobile')
      .populate('doctor', 'name specialization')
      .sort({ priority: -1, tokenNumber: 1 });

    res.json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending vitals',
      error: error.message
    });
  }
};

exports.getPendingConsultation = async (req, res) => {
  try {
    const visits = await Visit.find({
      visitStatus: 'Vitals_Completed',
      doctor: req.user.id // Only show doctor's own patients
    })
      .populate('patient', 'opNumber fullName gender age')
      .populate({
        path: 'vitals',
        select: 'bloodPressure pulse temperature weight height'
      })
      .sort({ priority: -1, tokenNumber: 1 });

    res.json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending consultations',
      error: error.message
    });
  }
};

exports.updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const visitId = req.params.id;

    // Validate status transition based on role
    const allowedTransitions = {
      Nurse: [ 'Waiting', 'Vitals_In_Progress', 'Vitals_Completed'],
      Doctor: ['Vitals_Completed', 'Consultation_In_Progress', 'Consultation_Completed'],
      Reception: [ 'Waiting'],
      Admin: [ 'Waiting', 'Vitals_In_Progress', 'Vitals_Completed', 'Consultation_In_Progress', 'Consultation_Completed', 'Pharmacy', 'Completed']
    };

    if (!allowedTransitions[req.user.role]?.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} cannot change status to ${status}`
      });
    }

    const visit = await Visit.findByIdAndUpdate(
      visitId,
      {
        visitStatus: status,
        updatedBy: req.user.id
      },
      { new: true }
    ).populate('patient doctor');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit,
      message: `Visit status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating visit status',
      error: error.message
    });
  }
};
exports.getVisitById = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('patient', 'opNumber fullName gender age mobile')
      .populate('doctor', 'name specialization')
      .populate('createdBy', 'name role')
      .populate('vitals');

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
    res.status(500).json({
      success: false,
      message: 'Error fetching visit',
      error: error.message
    });
  }
};
// In visit.controller.js - update the deleteVisit function
exports.deleteVisit = async (req, res) => {
  try {
    // Both Reception and Admin can delete visits
    if (!['Reception', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Reception and Admin can delete visits'
      });
    }
    
    // Reception can delete ANY visit (remove the ownership check)
    // Admin can delete any visit
    const visit = await Visit.findById(req.params.id);
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Check if visit has associated vitals or prescriptions
    if (visit.vitals || (visit.prescriptions && visit.prescriptions.length > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete visit with medical records'
      });
    }

    await Visit.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Visit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting visit',
      error: error.message
    });
  }
};
exports.getPatientVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .populate('vitals')
      .sort({ visitDate: -1 });

    res.json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient visits',
      error: error.message
    });
  }
};