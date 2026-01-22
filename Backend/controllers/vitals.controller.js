// controllers/vitals.controller.js
const Vitals = require('../models/vitals.model');
const Visit = require('../models/visit.model');

// controllers/vitals.controller.js - Update createVitals function
exports.createVitals = async (req, res) => {
  try {
    const { visitId, height, weight, bloodPressure, pulse, temperature, spo2, respiratoryRate, bloodSugar, remarks } = req.body;
    
    // Validate required fields
    if (!height || !weight) {
      return res.status(400).json({ 
        success: false, 
        message: 'Height and weight are required fields' 
      });
    }
    
    // Find the visit
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    
    // Create vitals instance
    const vitals = new Vitals({
      visit: visitId,
      patient: visit.patient,
      recordedBy: req.user.id,
      height,
      weight,
      bmi, // Calculate BMI here instead of in middleware
      bloodPressure: bloodPressure ? {
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic
      } : undefined,
      pulse,
      temperature,
      spo2,
      respiratoryRate,
      bloodSugar: bloodSugar ? {
        value: bloodSugar.value,
        type: bloodSugar.type || 'Random'
      } : undefined,
      remarks
    });
    
    // Save the vitals document (this will trigger middleware)
    await vitals.save();
    
    // Update visit status to Vitals_Completed
    visit.visitStatus = 'Vitals_Completed';
    visit.vitals = vitals._id;
    await visit.save();
    
    res.status(201).json({
      success: true,
      data: vitals,
      message: 'Vitals recorded successfully'
    });
  } catch (error) {
    console.error('Error creating vitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording vitals',
      error: error.message
    });
  }
};

exports.getPendingVitals = async (req, res) => {
  try {
    // Get visits that need vitals (Registered, Waiting status)
    const visits = await Visit.find({
      visitStatus: { $in: ['Registered', 'Waiting'] }
    })
    .populate('patient', 'opNumber fullName gender age')
    .populate('doctor', 'name specialization')
    .sort({ priority: -1, tokenNumber: 1 });
    
    res.json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error) {
    console.error('Error fetching pending vitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending vitals',
      error: error.message
    });
  }
};

exports.getVitalsByVisitId = async (req, res) => {
  try {
    const vitals = await Vitals.findOne({ visit: req.params.visitId })
      .populate('recordedBy', 'name role')
      .populate('patient', 'opNumber fullName gender age');
    
    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals not found for this visit'
      });
    }
    
    res.json({
      success: true,
      data: vitals
    });
  } catch (error) {
    console.error('Error fetching vitals by visit ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vitals',
      error: error.message
    });
  }
};

exports.getPatientVitals = async (req, res) => {
  try {
    const vitals = await Vitals.find({ patient: req.params.patientId })
      .populate('recordedBy', 'name role')
      .populate('visit', 'visitDate doctor')
      .sort({ recordedAt: -1 });
    
    res.json({
      success: true,
      data: vitals,
      count: vitals.length
    });
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient vitals',
      error: error.message
    });
  }
};

exports.updateVitals = async (req, res) => {
  try {
    const vitals = await Vitals.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('recordedBy updatedBy', 'name role');
    
    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }
    
    res.json({
      success: true,
      data: vitals,
      message: 'Vitals updated successfully'
    });
  } catch (error) {
    console.error('Error updating vitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vitals',
      error: error.message
    });
  }
};

exports.getVitalsById = async (req, res) => {
  try {
    const vitals = await Vitals.findById(req.params.id)
      .populate('recordedBy updatedBy', 'name role')
      .populate('patient', 'opNumber fullName gender age')
      .populate('visit', 'visitDate doctor');
    
    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }
    
    res.json({
      success: true,
      data: vitals
    });
  } catch (error) {
    console.error('Error fetching vitals by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vitals',
      error: error.message
    });
  }
};