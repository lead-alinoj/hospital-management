const LabResult = require('../models/labResult.model');
const Visit = require('../models/visit.model');

exports.createLabResult = async (req, res) => {
  try {
    // Only Nurse can create lab results
    if (req.user.role !== 'Nurse' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only nurses can enter lab results'
      });
    }

    const { visitId, ...labData } = req.body;

    // Check if visit exists
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Create lab result
    const labResult = await LabResult.create({
      visit: visitId,
      patient: visit.patient,
      ...labData,
      enteredBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: labResult,
      message: 'Lab result recorded successfully'
    });
  } catch (error) {
    console.error('Error creating lab result:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lab result',
      error: error.message
    });
  }
};

exports.getLabResultsByVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const labResults = await LabResult.find({ visit: visitId })
      .populate('enteredBy', 'name role')
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 });

    // Check if user has permission to view lab results
    if (req.user.role === 'Reception' && !['Admin', 'Reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Reception cannot view lab results'
      });
    }

    // Doctor cannot edit lab results
    const responseData = labResults.map(result => {
      const resultObj = result.toObject();
      if (req.user.role === 'Doctor') {
        resultObj.canEdit = false;
        resultObj.canVerify = false;
      }
      return resultObj;
    });

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab results',
      error: error.message
    });
  }
};

exports.updateLabStatus = async (req, res) => {
  try {
    // Only Nurse can update lab status
    if (req.user.role !== 'Nurse' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only nurses can update lab status'
      });
    }

    const { status } = req.body;

    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: 'Lab result not found'
      });
    }

    res.json({
      success: true,
      data: labResult,
      message: 'Lab status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating lab status',
      error: error.message
    });
  }
};