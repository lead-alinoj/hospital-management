import Hospital from '../models/hospital.model.js';

export const getHospital = async (req, res) => {
  try {
    let hospital = await Hospital.findOne();
    
    if (!hospital) {
      // Create default hospital if not exists
      hospital = await Hospital.create({
        name: 'City Clinic',
        address: '123 Main Street',
        city: 'City Name',
        state: 'State',
        pincode: '000000',
        phone: '9876543210',
        email: 'contact@cityclinic.com'
      });
    }
    
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hospital data' });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const updates = req.body;
    
    let hospital = await Hospital.findOne();
    
    if (!hospital) {
      hospital = await Hospital.create(updates);
    } else {
      hospital = await Hospital.findOneAndUpdate({}, updates, { new: true });
    }
    
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating hospital data' });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const logoPath = `/uploads/hospital/${req.file.filename}`;
    
    let hospital = await Hospital.findOne();
    
    if (!hospital) {
      hospital = await Hospital.create({ logo: logoPath });
    } else {
      hospital.logo = logoPath;
      await hospital.save();
    }
    
    res.json({ success: true, data: { logo: logoPath } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading logo' });
  }
};