const Patient = require('../models/patient.model');
const Visit = require('../models/visit.model');
const mongoose = require('mongoose');

exports.createPatient = async (req, res) => {
  try {
    // Only Reception and Admin can create patients
    if (!['Reception', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create patients'
      });
    }

    const patientData = {
      ...req.body,
      createdBy: req.user.id
    };
if (
  patientData.idProof &&
  !patientData.idProof.type &&
  !patientData.idProof.number
) {
  delete patientData.idProof;
}
    const patient = await Patient.create(patientData);

    res.status(201).json({
      success: true,
      data: patient,
      message: 'Patient registered successfully'
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message
    });
  }
};
exports.getRecentPatients = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const patients = await Patient.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id fullName opNumber mobile createdAt');

    res.json(patients);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent patients',
      error: error.message
    });
  }
};

// patient.controller.js
exports.quickSearchPatients = async (req, res) => {
  try {
    const { query = '' } = req.query;
    const regex = new RegExp(query, 'i');

    const patients = await Patient.find({
      isActive: true,
      $or: [
        { fullName: regex },
        { opNumber: regex },
        { mobile: regex }
      ]
    })
    .select('_id fullName opNumber') // minimal fields for dropdown
    .limit(20)
    .sort({ createdAt: -1 });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.searchPatients = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let searchQuery = { isActive: true };
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { opNumber: regex },
        { fullName: regex },
        { mobile: regex },
        { 'address.city': regex }
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.aggregate([
        { $match: searchQuery },
        {
          $lookup: {
            from: 'visits',
            localField: '_id',
            foreignField: 'patient',
            as: 'visits'
          }
        },
        {
          $addFields: {
            lastVisitDate: { $max: '$visits.visitDate' },
            lastToken: { $max: '$visits.tokenNumber' }
          }
        },
        { $project: { visits: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]),
      Patient.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      data: patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching patients',
      error: error.message
    });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};  
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get patient's recent visits
    const recentVisits = await Visit.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 })
      .limit(5);

    const patientData = patient.toObject();
    patientData.recentVisits = recentVisits;

    res.json({
      success: true,
      data: patientData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
};
// In patient.controller.js - update the deletePatient function
exports.deletePatient = async (req, res) => {
  try {
    // Both Reception and Admin can delete patients
    if (!['Reception', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Reception and Admin can delete patients'
      });
    }
    
    // Reception can delete ANY patient (remove the ownership check)
    // Admin can delete any patient
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient has any visits
    const hasVisits = await Visit.exists({ patient: patient._id });
    
    if (hasVisits) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete patient with existing visits. Deactivate instead.'
      });
    }

    await Patient.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
};
exports.deactivatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: patient,
      message: 'Patient deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating patient',
      error: error.message
    });
  }
};
exports.updatePatient = async (req, res) => {
  try {
    // Only Reception and Admin can update patients
    if (!['Reception', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update patients'
      });
    }

    const updates = {
      ...req.body,
      updatedBy: req.user.id
    };

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('updatedBy', 'name role');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient,
      message: 'Patient updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
};
