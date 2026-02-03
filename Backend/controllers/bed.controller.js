// E:\hospital-management\Backend\controllers\bed.controller.js
const Bed = require('../models/bed.model');
const CareUnit = require('../models/careUnit.model');

// Get bed by ID
exports.getBedById = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('CareUnit')
      .populate('currentPatient', 'fullName opNumber');

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    res.json({ success: true, data: bed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update bed
exports.updateBed = async (req, res) => {
  try {
    // 🚫 Prevent illegal occupancy update
    if (req.body.status === 'OCCUPIED' || req.body.currentPatient) {
      return res.status(400).json({
        success: false,
        message: 'Use allocate bed API for admission'
      });
    }

    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    res.json({ success: true, data: bed });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.createBed = async (req, res) => {
  try {
    const { bedNumber, careUnit, remarks } = req.body;

    const bed = await Bed.create({
      bedNumber,
      careUnit,
      remarks,
      status: 'AVAILABLE',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: bed,
      message: 'Bed created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.getAvailableBeds = async (req, res) => {
  try {
    const beds = await Bed.find({
      status: 'AVAILABLE',
      isActive: true
    })
      .populate('careUnit', 'unitNumber name category chargesPerDay')
      .sort({ bedNumber: 1 });

    res.json({
      success: true,
      data: beds,
      count: beds.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available beds',
      error: error.message
    });
  }
};


exports.getAllBeds = async (req, res) => {
  try {
    const beds = await Bed.find()
      .populate('careUnit', 'unitNumber name category chargesPerDay')
      .populate('currentPatient', 'fullName opNumber')
      .sort({ bedNumber: 1 });

    res.json({
      success: true,
      data: beds
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching beds',
      error: error.message
    });
  }
};


exports.allocateBed = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { patientId, visitId } = req.body;
// 🔒 ABSOLUTE GUARD
const alreadyAdmitted = await Bed.findOne({
  currentPatient: patientId,
  status: 'OCCUPIED'
});

if (alreadyAdmitted) {
  return res.status(400).json({
    success: false,
    message: 'Patient already admitted in another bed'
  });
}

    // 🔒 atomic update
    const bed = await Bed.findOneAndUpdate(
      {
        _id: bedId,
        status: 'AVAILABLE',
        isActive: true
      },
      {
        $set: {
          status: 'OCCUPIED',
          currentPatient: patientId,
          currentVisit: visitId,
          admissionDate: new Date(),
          allocatedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!bed) {
      return res.status(400).json({
        success: false,
        message: 'Bed not available or already occupied'
      });
    }

    const Visit = require('../models/visit.model');
    await Visit.findByIdAndUpdate(visitId, {
      bedAllocated: bedId,
      admissionStatus: 'IP_ACTIVE',
      admissionDate: new Date()
    });

    res.json({
      success: true,
      message: 'Bed allocated successfully',
      data: bed
    });

  } catch (error) {
    // 🔥 Catch UNIQUE constraint violation
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Patient already admitted to another bed'
      });
    }

    console.error('Error allocating bed:', error);
    res.status(500).json({
      success: false,
      message: 'Error allocating bed'
    });
  }
};


exports.dischargePatient = async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed || bed.status !== 'OCCUPIED') {
    return res.status(400).json({ success: false, message: 'Invalid bed' });
  }

  const visitId = bed.currentVisit; // 🔥 STORE BEFORE CLEAR

  bed.status = 'AVAILABLE';
  bed.currentPatient = null;
  bed.currentVisit = null;
  bed.dischargeDate = new Date();
  bed.cleaned = false;

  await bed.save();

  await require('../models/visit.model')
    .findByIdAndUpdate(visitId, {
      admissionStatus: 'DISCHARGED',
      dischargeDate: bed.dischargeDate
    });

  res.json({ success: true, message: 'Patient discharged' });
};
