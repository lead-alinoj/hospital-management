const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Create new appointment
// Update your POST route to include the new fields
router.post('/', async (req, res) => {
  try {
    const { 
      patientName, 
      contactNumber, 
      email, 
      description, 
      appointmentDate,  // Add these
      appointmentTime   // Add these
    } = req.body;
    
    const appointment = new Appointment({ 
      patientName, 
      contactNumber, 
      email, 
      description,
      appointmentDate,  // Save these fields
      appointmentTime
    });
    
    await appointment.save();
    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
  }
});

// Get all appointments (admin view)
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

module.exports = router;
