const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctor');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doctor-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create doctor with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Received doctor data:', req.body);
    console.log('Received file:', req.file);

    const doctorData = {
      name: req.body.name,
      specialty: req.body.specialty,
      experience: parseInt(req.body.experience),
      qualification: req.body.qualification,
      image: req.file ? `/uploads/doctors/${req.file.filename}` : (req.body.image || 'assets/images/default-doctor.jpg')
    };
    
    console.log('Saving doctor:', doctorData);
    
    const doctor = await Doctor.create(doctorData);
    
    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update doctor with image upload
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('Updating doctor:', req.params.id);
    console.log('Update data:', req.body);
    console.log('Update file:', req.file);

    const doctorData = {
      name: req.body.name,
      specialty: req.body.specialty,
      experience: parseInt(req.body.experience),
      qualification: req.body.qualification
    };
    
    // Only update image if new file is uploaded
    if (req.file) {
      doctorData.image = `/uploads/doctors/${req.file.filename}`;
    } else if (req.body.image) {
      doctorData.image = req.body.image;
    }
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      doctorData,
      { new: true, runValidators: true }
    );
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }
    
    // Optional: Delete image file if it exists and is not default
    if (doctor.image && doctor.image.includes('/uploads/')) {
      const imagePath = path.join(__dirname, '..', doctor.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image file:', imagePath);
      }
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;