// E:\HMS\backend\scripts\createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

console.log('🔍 Looking for User model...');

// Try different possible locations for the User model
const possiblePaths = [
  path.join(__dirname, '..', 'models', 'User.js'),    // ../models/User.js
  path.join(__dirname, '..', 'models', 'User'),       // ../models/User
  path.join(__dirname, '..', 'src', 'models', 'User.js'), // ../src/models/User.js
  path.join(__dirname, '..', 'src', 'models', 'User')     // ../src/models/User
];

let User;
let modelFound = false;

for (const modelPath of possiblePaths) {
  try {
    console.log(`   Trying: ${modelPath}`);
    if (fs.existsSync(modelPath) || fs.existsSync(modelPath + '.js')) {
      User = require(modelPath);
      console.log(`✅ Found User model at: ${modelPath}`);
      modelFound = true;
      break;
    }
  } catch (error) {
    // Continue trying other paths
  }
}

// If model not found, create it inline
if (!modelFound) {
  console.log('📝 Creating User model inline...');
  
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['Admin', 'Doctor', 'Reception', 'Nurse', 'Pharmacy'],
      default: null
    },
    isActive: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Encrypt password using bcrypt
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  // Match user entered password to hashed password in database
  userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User = mongoose.model('User', userSchema);
}

// Create admin user function
const createAdminUser = async () => {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB (remove deprecated options for newer mongoose)
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hms';
    
    // For Mongoose 7+, use simpler connection
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoURI}`);
    
    // Check if admin already exists
    console.log('\n🔍 Checking for existing admin user...');
    const adminExists = await User.findOne({ email: 'admin@hospital.com' });
    
    if (adminExists) {
      console.log('\n✅ Admin user already exists:');
      console.log(`   Name: ${adminExists.name}`);
      console.log(`   Email: ${adminExists.email}`);
      console.log(`   Role: ${adminExists.role}`);
      console.log(`   Active: ${adminExists.isActive}`);
      console.log(`   Created: ${adminExists.createdAt}`);
      
      // Check if password is correct
      const isPasswordCorrect = await bcrypt.compare('Admin@123', adminExists.password);
      if (isPasswordCorrect) {
        console.log('   ✅ Password matches: Admin@123');
      } else {
        console.log('   ⚠️  Password does not match Admin@123');
      }
      
      process.exit(0);
    }
    
    console.log('👤 Creating admin user...');
    
    // Create admin user directly (password will be hashed by pre-save hook)
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@hospital.com',
      password: 'Admin@123', // This will be hashed automatically
      role: 'Admin',
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('\n🎉 Admin user created successfully!');
    console.log('===================================');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: Admin@123`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.isActive}`);
    console.log('===================================');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n💡 Use these credentials to login:');
    console.log('   Email: admin@hospital.com');
    console.log('   Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error('   Message:', error.message);
    console.error('   Full error:', error);
    
    if (error.code === 11000) {
      console.error('   Issue: Email already exists in database');
    }
    
    if (error.name === 'MongoServerError') {
      console.error('   MongoDB Error Code:', error.code);
    }
    
    process.exit(1);
  }
};

// Check and create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📄 Creating .env file...');
  const envContent = `MONGO_URI=mongodb://127.0.0.1:27017/hms
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
PORT=5000`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
}

// Read .env file
require('dotenv').config({ path: envPath });

createAdminUser();