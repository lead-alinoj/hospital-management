const Staff = require('../models/staff.model');

// Create new staff
exports.createStaff = async (req, res) => {
  try {
    const { phone } = req.body;

    const existingStaff = await Staff.findOne({ phone });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        error: 'Staff with this phone number already exists'
      });
    }

    const staff = new Staff({
      ...req.body,
      createdBy: req.user.name // logged-in Admin
    });

    await staff.save();

    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff member created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const { role, status } = req.query;
    let filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get active staff
exports.getActiveStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ status: 'Active' }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff,
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search staff
exports.searchStaff = async (req, res) => {
  try {
    const query = req.params.query;
    const staff = await Staff.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { staffId: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get staff by role
exports.getStaffByRole = async (req, res) => {
  try {
    const staff = await Staff.find({ 
      role: req.params.role,
      status: 'Active'
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};