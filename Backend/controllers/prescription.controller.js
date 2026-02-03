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
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Doctor not found'
      });
    }

    const visit = await Visit.findById(visitId)
      .populate('patient', 'fullName age gender opNumber');

    if (!visit || !visit.patient) {
      return res.status(404).json({
        success: false,
        message: 'Visit or patient not found'
      });
    }

    // if (!Array.isArray(medicines) || medicines.length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'No medicines provided'
    //   });
    // }

    // Process medicines (NO STOCK BLOCKING)
if (Array.isArray(medicines) && medicines.length > 0) {
  for (const med of medicines) {

      // ✅ Manual / Outside medicine
 // ✅ Manual / Outside medicine
if (!med.medicineId) {
  med.type = 'MANUAL';
  med.medicineName = med.name;
  med.unitPrice = 0;
  med.totalPrice = 0;
  med.isOutOfStock = true;
  med.quantity = med.quantity || 1;
  continue;
}


      const medicine = await Medicine.findById(med.medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }
med.type = 'STOCK';
      med.medicineName = medicine.name;
      med.strength = medicine.strength;
  med.unitPrice = medicine.price;
    med.isOutOfStock = medicine.stockQty < (med.quantity || 0);

// 🔥 Important: price only if stock is available
   if (med.isOutOfStock) {
      med.totalPrice = 0;
    } else {
      med.totalPrice = medicine.price * (med.quantity || 0);
    }
  }}

    const prescription = await Prescription.create({
      visitId,
      patientId: visit.patient._id,
      doctorId,
        patientType: req.body.patientType || 'OP', // 🔥 SAFE

  medicines: Array.isArray(medicines) ? medicines : [],
      ...prescriptionData
    });

    await Visit.findByIdAndUpdate(visitId, {
      visitStatus: 'Consultation_Completed',
      consultationTime: new Date(),
      prescriptionId: prescription._id
    });

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Consultation completed successfully'
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
      .populate('doctorId', 'name specialization')
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
      .populate('doctorId', 'name specialization');

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
const hasStockMedicines = prescription.medicines.some(
  m => m.medicineId
);

// ✅ If no stock medicines → allow dispense without payment
if (!hasStockMedicines) {
  prescription.status = 'Completed';
  prescription.dispensedAt = new Date();
  prescription.dispensedBy = req.user?.id;
  prescription.paymentAmount = 0;
  prescription.paymentStatus = 'Not_Required';
  await prescription.save();

  return res.json({
    success: true,
    message: 'Prescription completed (outside medicines)',
    data: prescription
  });
}

    // Calculate total with additional charges
// ✅ PHARMACY-LEVEL BILLING (ONLY DISPENSED MEDICINES)
let medicineAmount = 0;

for (const med of prescription.medicines) {
  // ✅ Only include medicines that have stock and are not out of stock
  if (!med.medicineId) continue;        // manual / outside
  if (med.isOutOfStock) continue;       // out of stock
  if (!med.unitPrice) continue;         // zero price medicines
  medicineAmount += (med.unitPrice || 0) * (med.quantity || 0);
}

const totalWithCharges =
  medicineAmount +
  Number(labCharges || 0) +
  Number(consultationFee || 0) +
  Number(otherCharges || 0);

// ✅ SAVE BILLING
prescription.billing = {
  medicineAmount,
  labCharges: Number(labCharges || 0),
  consultationFee: Number(consultationFee || 0),
  otherCharges: Number(otherCharges || 0),
  totalAmount: totalWithCharges
};

prescription.status = 'Completed';
prescription.dispensedAt = new Date();
prescription.dispensedBy = req.user?.id;
prescription.paymentMethod = paymentMethod || 'Cash';
prescription.paymentAmount = paymentAmount || totalWithCharges;
prescription.paymentStatus =
  prescription.paymentAmount >= totalWithCharges ? 'Paid' : 'Partially_Paid';

// 🔥 Deduct stock ONLY during pharmacy dispensing
for (const med of prescription.medicines) {

  // Skip manual / outside medicines
  if (!med.medicineId) continue;

  const medicine = await Medicine.findById(med.medicineId);
  if (!medicine) continue;

  // Final pharmacy-level stock check
  if (medicine.stockQty < med.quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock for ${medicine.name} during dispensing`
    });
  }

  // Deduct stock now
  medicine.stockQty -= med.quantity;
  await medicine.save();
}

    await prescription.save();

    // Update visit status
    if (prescription.visitId) {
      await Visit.findByIdAndUpdate(prescription.visitId, {
        visitStatus: 'Completed',
        pharmacyTime: new Date()
      });
    }

    

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
      .populate('doctorId', 'name specialization')
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
      .populate('doctorId', 'name specialization')
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
      .populate('doctorId', 'name specialization')
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
      .populate('doctorId', 'name specialization')
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
