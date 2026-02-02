const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route files
const authRoutes = require('./routes/authRoutes');
const visitRoutes = require('./routes/visit.routes');
const patientRoutes = require('./routes/patient.routes');
const vitalsRoutes = require('./routes/vitals.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const medicineRoutes = require('./routes/medicine.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const categoryRoutes = require('./routes/category.routes');
const appointmentRoutes = require('./routes/appointments');
const staffRoutes = require('./routes/staff.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const shiftRoutes = require('./routes/shift.routes');
const ipadmissionRoutes = require('./routes/ipAdmission.routes');
// const ipBillRoutes = require('./routes/ipBill.routes');
const bedRoutes = require('./routes/bed.routes');
const careUnitRoutes = require('./routes/careUnit.routes');
// Routes

app.use('/api/auth', authRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/ip-admission', ipadmissionRoutes);
// app.use('/api/ipbill', ipBillRoutes);
app.use('/api/bed', bedRoutes);
app.use('/api/care-units', careUnitRoutes);

// Example route
app.get('/', (req, res) => {
  res.send('HMS Backend Running');
});

// MongoDB connection (updated for Mongoose 7+)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hms';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});