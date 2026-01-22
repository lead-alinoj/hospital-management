const Prescription = require('../models/prescription.model');
const Medicine = require('../models/medicine.model');
const Visit = require('../models/visit.model');
const Patient = require('../models/patient.model');
const Vitals = require('../models/vitals.model');


exports.createPrescription = async (req, res) => {
  try {
    const { visitId, medicines, ...prescriptionData } = req.body;
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Doctor not found' });
    }

    // Check if visit exists and populate patient
    const visit = await Visit.findById(visitId).populate('patient', 'fullName age gender opNumber');
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (!visit.patient) {
      return res.status(400).json({ success: false, message: 'Visit does not have a patient' });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'No medicines provided' });
    }

    const medicineUpdates = [];
    let totalAmount = 0;

    // Process each medicine
    for (const med of medicines) {
      const medicine = await Medicine.findById(med.medicineId);
      if (!medicine) {
        return res.status(404).json({ success: false, message: `Medicine ${med.medicineId} not found` });
      }

      if (medicine.stockQty < med.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQty}` 
        });
      }

      // Calculate medicine cost
      const medicineCost = medicine.price * med.quantity;
      totalAmount += medicineCost;

      // Add medicine details including price for billing
      med.medicineName = medicine.name;
      med.strength = medicine.strength;
      med.unitPrice = medicine.price;
      med.totalPrice = medicineCost;

      // Prepare stock update
      medicineUpdates.push({
        medicineId: medicine._id,
        quantity: med.quantity,
        price: medicine.price
      });
    }

    // Create prescription
    const prescription = await Prescription.create({
      visitId,
      patientId: visit.patient._id,
      doctorId,
      medicines,
      totalAmount,
      ...prescriptionData
    });

    // Update medicine stock
    for (const update of medicineUpdates) {
      await Medicine.findByIdAndUpdate(update.medicineId, {
        $inc: { stockQty: -update.quantity }
      });
    }

    // Update visit status
    await Visit.findByIdAndUpdate(visitId, {
      visitStatus: 'Consultation_Completed',
      consultationTime: new Date(),
      prescriptionId: prescription._id
    });

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Prescription created successfully'
    });

  } catch (error) {
    console.error('Prescription creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating prescription', 
      error: error.message 
    });
  }
};
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await Prescription.find({ patientId })
      .populate('doctorId', 'name')
      .populate('visitId', 'visitDate chiefComplaint')
      .sort({ createdAt: -1 }); // latest first

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient history'
    });
  }
};

exports.getPrescriptionsForPharmacy = async (req, res) => {
  try {
    const { status = 'Active', fromDate } = req.query;
    
    let query = { status };
    
    // Filter by date if provided (for today's dispensed)
    if (fromDate) {
      const startDate = new Date(fromDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.dispensedAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'fullName age gender opNumber address mobile')
      .populate('doctorId', 'name registrationNumber qualification')
      .populate('visitId', 'tokenNumber visitDate chiefComplaint')
      .populate({
        path: 'visitId',
        populate: {
          path: 'vitals',
          model: 'Vitals'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
      message: 'Prescriptions fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching prescriptions',
      error: error.message 
    });
  }
};
// In prescription.controller.js
exports.dispensePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      paymentMethod, 
      paymentAmount, 
      labCharges = 0,
      consultationFee = 0,
      otherCharges = 0
    } = req.body;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'fullName age gender opNumber')
      .populate('doctorId', 'name registrationNumber');

    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Prescription not found' 
      });
    }

    // Check if already dispensed
    if (prescription.status === 'Completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Prescription already dispensed' 
      });
    }

    // Calculate total with additional charges
    const totalWithCharges = prescription.totalAmount + 
      parseFloat(labCharges) + 
      parseFloat(consultationFee) + 
      parseFloat(otherCharges);

    // Update prescription status
    prescription.status = 'Completed';
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = req.user?.id;
    prescription.paymentMethod = paymentMethod || 'Cash';
    prescription.paymentAmount = paymentAmount || totalWithCharges;
    prescription.paymentStatus = paymentAmount >= totalWithCharges ? 'Paid' : 'Partially_Paid';
    
    // Store billing details
    prescription.billing = {
      medicineAmount: prescription.totalAmount,
      labCharges: parseFloat(labCharges),
      consultationFee: parseFloat(consultationFee),
      otherCharges: parseFloat(otherCharges),
      totalAmount: totalWithCharges
    };

    await prescription.save();

    // Update visit status
    if (prescription.visitId) {
      await Visit.findByIdAndUpdate(prescription.visitId, {
        visitStatus: 'Completed',
        pharmacyTime: new Date()
      });
    }

    // Update medicine stock (already deducted during prescription creation)
    // If you need to track dispensed quantities separately, add that logic here

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription dispensed successfully'
    });
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error dispensing prescription',
      error: error.message 
    });
  }
};
exports.getPrescriptionWithDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findById(id)
      .populate('patientId', 'fullName age gender opNumber address mobile')
      .populate('doctorId', 'name registrationNumber qualification')
      .populate('visitId', 'tokenNumber visitDate chiefComplaint')
      .populate({
        path: 'visitId',
        populate: {
          path: 'vitals',
          model: 'Vitals'
        }
      });

    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Prescription not found' 
      });
    }

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching prescription details',
      error: error.message 
    });
  }
};
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findById(id)
      .populate('patientId', 'fullName age gender opNumber address mobile')
      .populate('doctorId', 'name registrationNumber qualification')
      .populate('visitId', 'tokenNumber visitDate chiefComplaint');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ success: false, message: 'Error fetching prescription' });
  }
};

// Get prescriptions by patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name registrationNumber')
      .populate('visitId', 'visitDate chiefComplaint')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
      message: 'Patient prescriptions fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching patient prescriptions' });
  }
};
exports.getPrescriptionByVisit = async (req, res) => {
  try {
    const { visitId } = req.params;

    const prescription = await Prescription.findOne({ visitId })
      .populate('doctorId', 'name registrationNumber')
      .populate('patientId', 'fullName age gender opNumber');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ success: false, message: 'Error fetching prescription', error: error.message });
  }
};
