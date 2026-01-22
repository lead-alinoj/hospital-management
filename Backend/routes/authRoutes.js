const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const authController = require('../controllers/authController');
const { protect,authorize  } = require('../middleware/auth');

/* ================= AUTH ================= */

// Register
router.post(
  '/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  authController.login
);
// Fetch all doctors (for dropdowns, etc.)
router.get('/users/doctors', protect, authController.getDoctors);

// Logged-in user
router.get('/me', protect, authController.getMe);
router.get('/validate-token', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});
/* ================= USER MANAGEMENT ================= */
/* ⚠️ NO ROLE CHECK – only login required */

/* ================= ADMIN ROUTES ================= */
router.use('/admin', protect, authorize('Admin')); // Add admin authorization

// Get all users
router.get('/admin/users', async (req, res) => {  // Add /admin
  const users = await User.find().select('-password');
  res.json({ success: true, data: users });
});

// Create user
router.post('/admin/users', async (req, res) => {  // Add /admin
  const { name, email, password, role, status } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || null,
    status: status || 'Pending',
    isActive: status === 'Active', // Sync isActive with status
    createdBy: req.user.id
  });

  res.json({ success: true, data: user });
});

router.put('/admin/users/:id', async (req, res) => {
  const { role, status, specialization } = req.body;
  const updates = { role, status, specialization, updatedBy: req.user.id };
  if (status) updates.isActive = status === 'Active';

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, data: user });
});

// Activate / Deactivate
router.patch('/admin/users/:id/active', async (req, res) => {  // Add /admin
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { 
      isActive: req.body.isActive,
      status: req.body.isActive ? 'Active' : 'Inactive',
      updatedBy: req.user.id 
    },
    { new: true }
  );

  res.json({ success: true, data: user });
});

// Block / Unblock
router.patch('/admin/users/:id/block', async (req, res) => {  // Add /admin
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { 
      status: req.body.blocked ? 'Blocked' : 'Active',
      isActive: !req.body.blocked, // Blocked users are inactive
      updatedBy: req.user.id 
    },
    { new: true }
  );

  res.json({ success: true, data: user });
});

// Reset password
router.post('/admin/users/:id/reset-password', async (req, res) => {  // Add /admin
  const hashed = await bcrypt.hash(req.body.newPassword, 10);
  await User.findByIdAndUpdate(
    req.params.id, 
    { 
      password: hashed,
      updatedBy: req.user.id 
    }
  );
  res.json({ success: true });
});

// Delete user
router.delete('/admin/users/:id', async (req, res) => {  // Add /admin
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
