const CareUnit = require('../models/careUnit.model');
const Bed = require('../models/bed.model');

// CREATE care unit + beds
exports.createCareUnit = async (req, res) => {
  try {
    let { unitNumber, name, category, capacity, chargesPerDay } = req.body;

    // 🔥 NORMALIZE
    unitNumber = unitNumber
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '-');

    // ❌ Check existing
    const exists = await CareUnit.findOne({ unitNumber });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Care unit already exists'
      });
    }

    const careUnit = await CareUnit.create({
      unitNumber,
      name,
      category,
      capacity,
      chargesPerDay,
      isActive: true
    });

    // ✅ AUTO CREATE BEDS
    const beds = Array.from({ length: capacity }).map((_, i) => ({
      bedNumber: `${unitNumber}-B${i + 1}`,
      careUnit: careUnit._id,
      status: 'AVAILABLE',
      isActive: true
    }));

    await Bed.insertMany(beds);

    res.status(201).json({
      success: true,
      message: 'Care unit and beds created',
      data: careUnit
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET all care units
exports.getAllCareUnits = async (req, res) => {
  const units = await CareUnit.find();

  const data = await Promise.all(
    units.map(async unit => {
      const beds = await Bed.find({ careUnit: unit._id });
      return {
        ...unit.toObject(),
        totalBeds: beds.length,
        occupiedBeds: beds.filter(b => b.status === 'OCCUPIED').length
      };
    })
  );

  res.json({ success: true, data });
};

// UPDATE (needed for edit & toggle)
exports.updateCareUnit = async (req, res) => {
  const unit = await CareUnit.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ success: true, data: unit });
};
