const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth');

// auth.js exports roleMiddleware only

// Attendance routes
router.post(
  '/mark',
  protect,                         // ✅ ADD THIS
  authorize('Admin', 'Reception'),
  attendanceController.markAttendance
);

router.put(
  '/update/:id',
  protect,                         // ✅ ADD THIS
  authorize('Admin', 'Reception'),
  attendanceController.updateAttendance
);


router.get('/today', attendanceController.getTodayAttendance);
router.get('/staff/:staffId', attendanceController.getStaffAttendance);
router.get('/date/:date', attendanceController.getAttendanceByDate);
router.get('/range', attendanceController.getAttendanceByDateRange);
router.get('/summary', attendanceController.getAttendanceSummary);
router.get('/pending-logout', attendanceController.getPendingLogoutAttendance);
router.put(
  '/admin-close/:id',
  protect,
  authorize('Admin'),
  attendanceController.adminCloseAttendance
);
router.get(
  '/summary-live',
  protect,
  authorize('Admin'),
  attendanceController.getAttendanceSummaryLive
);

// Export should be admin only
router.get(
  '/export',
  protect,                         // ✅ ADD THIS
  authorize('Admin'),
  attendanceController.exportAttendance
);
module.exports = router;
