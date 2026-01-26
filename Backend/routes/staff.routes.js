const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth'); // 👈 REQUIRED
const roleMiddleware = require('../middleware/role.middleware');

// 🔐 ADMIN ONLY
router.post('/', protect, roleMiddleware(['Admin']), staffController.createStaff);
router.put('/:id', protect, roleMiddleware(['Admin']), staffController.updateStaff);
router.delete('/:id', protect, roleMiddleware(['Admin']), staffController.deleteStaff);

// 🔐 AUTHENTICATED READ
router.get('/', protect, staffController.getAllStaff);
router.get('/active', protect, staffController.getActiveStaff);
router.get('/search/:query', protect, staffController.searchStaff);
router.get('/role/:role', protect, staffController.getStaffByRole);
router.get('/:id', protect, staffController.getStaffById);

module.exports = router;
