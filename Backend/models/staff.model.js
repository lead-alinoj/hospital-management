const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: true
  },
   jobRole: {
      type: String,
      required: true,
      trim: true
    },
 systemRole: {
    type: String,
    enum: ['None', 'Admin', 'Reception', 'Doctor', 'Nurse', 'Pharmacy'],
    default: 'None'
  },
  
  phone: {
    type: String,
    required: true,
    unique: true 
  },
   gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  joiningDate: {
    type: Date
  },

  address: {
    type: String
  },

  qualification: {
    type: String
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String
  },

  // 🔹 ID PROOF (OPTIONAL)
  idProof: {
    type: {
      type: String, // Aadhaar, PAN, Voter ID
    },
    number: {
      type: String
    }
  },
  // 🔹 SALARY TYPE
  salaryType: {
    type: String,
    enum: ['Monthly', 'Daily', 'PerVisit'],
    default: 'Monthly'
  },
  salary: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

staffSchema.pre('save', async function (next) {
  if (!this.staffId) {
    const count = await mongoose.model('Staff').countDocuments();
    const code = this.jobRole.substring(0, 2).toUpperCase();
    this.staffId = `${code}${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Staff', staffSchema);