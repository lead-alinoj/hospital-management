const Shift = require('../models/shift.model');

exports.createShift = async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ active: true });
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Update shift
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Deactivate shift (soft delete)
exports.deactivateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    res.json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

