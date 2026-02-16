const Attendance = require('../models/attendance.model');
const Staff = require('../models/staff.model');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Shift = require('../models/shift.model');

exports.markAttendance = async (req, res) => {
  try {
    const { staffId, staffName, jobRole, shiftId } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Shift ID missing' });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(400).json({ error: 'Invalid shift' });
    }

    // ✅ 4. CHECK IF SHIFT IS ACTIVE
    if (!shift.active) {
      return res.status(400).json({ error: 'Shift is inactive' });
    }

    const now = new Date();
    const attendanceDate = new Date(now);
    attendanceDate.setHours(0, 0, 0, 0);

    // ✅ Convert HH:mm → Date
    const [h, m] = req.body.inTime.split(':');
    const inTime = new Date(attendanceDate);
    inTime.setHours(+h, +m, 0, 0);

    // ✅ FIXED: ENHANCED OPEN ATTENDANCE CHECK
    const openAttendance = await Attendance.findOne({
      staffId,
      outTime: null,
      date: { $gte: new Date(attendanceDate.getTime() - 24 * 60 * 60 * 1000) }
    }).populate('shiftId');

    if (openAttendance) {
      const shiftEnd = calculateShiftEnd(openAttendance.date, openAttendance.shiftId);
      const currentTime = new Date();
      
      const gracePeriod = 30; // minutes
      const shiftEndWithGrace = new Date(shiftEnd.getTime() + gracePeriod * 60000);
      
      if (currentTime > shiftEndWithGrace) {
        // Auto-close previous attendance as admin
        openAttendance.outTime = shiftEnd;
        openAttendance.adminLogout = true;
        openAttendance.logoutReason = 'Auto-closed for next shift';
        openAttendance.adminClosedBy = 'System';
        await openAttendance.save();
      } else {
        return res.status(400).json({ 
          error: 'Previous attendance not closed. Please mark out time first.',
          openAttendanceId: openAttendance._id 
        });
      }
    }

    // ✅ FIXED: SHIFT BOUNDARY VALIDATION FOR NIGHT SHIFTS
    const shiftStart = calculateShiftStart(attendanceDate, shift);
    let shiftEnd = calculateShiftEnd(attendanceDate, shift);
    
    const gracePeriod = 60; // 1 hour grace for early/late
    
    // For overnight shifts, adjust validation logic
    if (shift.isOvernight) {
      // For night shifts ending the next day
      const nextDay = new Date(attendanceDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Earliest allowed is 1 hour before shift start
      const earliestAllowed = new Date(shiftStart.getTime() - gracePeriod * 60000);
      
      // Latest allowed is 1 hour after shift end (which is on next day)
      const latestAllowed = new Date(shiftEnd.getTime() + gracePeriod * 60000);
      
      // Special case: If marking attendance for night shift in the morning after it ended
      // (e.g., shift ended at 06:00, marking at 08:00 for the previous night)
      const shiftEndTimeOnly = new Date(attendanceDate);
      const [endH, endM] = shift.endTime.split(':');
      shiftEndTimeOnly.setHours(+endH, +endM, 0, 0);
      
      // If inTime is after shift end time but before midnight, it's still valid for night shift
      if (inTime >= shiftEndTimeOnly && inTime < latestAllowed) {
        // This is acceptable for night shift logging
      } else if (inTime < earliestAllowed) {
        return res.status(400).json({ 
          error: `Cannot mark attendance more than ${gracePeriod} minutes before shift starts (${shift.startTime})` 
        });
      } else if (inTime > latestAllowed) {
        return res.status(400).json({ 
          error: `Cannot mark attendance more than ${gracePeriod} minutes after shift ends (${shift.endTime})` 
        });
      }
    } else {
      // Regular shift validation
      const earliestAllowed = new Date(shiftStart.getTime() - gracePeriod * 60000);
      const latestAllowed = new Date(shiftEnd.getTime() + gracePeriod * 60000);
      
      if (inTime < earliestAllowed) {
        return res.status(400).json({ 
          error: `Cannot mark attendance more than ${gracePeriod} minutes before shift starts (${shift.startTime})` 
        });
      }
      
      if (inTime > latestAllowed) {
        return res.status(400).json({ 
          error: `Cannot mark attendance more than ${gracePeriod} minutes after shift ends (${shift.endTime})` 
        });
      }
    }

    const attendance = await Attendance.create({
      staffId,
      staffName,
      jobRole,
      shiftId,
      date: attendanceDate,
      inTime,
      remarks: req.body.remarks || '',
      enteredBy: req.user?.email || 'System'
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to calculate shift start
const calculateShiftStart = (date, shift) => {
  const start = new Date(date);
  const [h, m] = shift.startTime.split(':');
  start.setHours(+h, +m, 0, 0);
  return start;
};

// Helper function to calculate shift end
const calculateShiftEnd = (date, shift) => {
  const end = new Date(date);
  const [h, m] = shift.endTime.split(':');
  end.setHours(+h, +m, 0, 0);
  
  if (shift.isOvernight && end < date) {
    end.setDate(end.getDate() + 1);
  }
  
  return end;
};
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('shiftId');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    if (attendance.outTime) {
      return res.status(400).json({ error: 'Attendance already has out time' });
    }

    // Get out time
    let outTime;
    if (req.body.outTime) {
      const [h, m] = req.body.outTime.split(':');
      outTime = new Date(attendance.date);
      outTime.setHours(+h, +m, 0, 0);
    } else {
      outTime = new Date();
    }

    const shift = attendance.shiftId;
    
    // Handle overnight shifts
    if (shift?.isOvernight && outTime < attendance.inTime) {
      outTime.setDate(outTime.getDate() + 1);
    }

    // Calculate worked minutes
    const workedMinutes = Math.max(
      Math.floor((outTime - attendance.inTime) / 60000),
      1
    );

    attendance.outTime = outTime;
    attendance.totalMinutes = workedMinutes;

    // Calculate overtime based on shift duration
    if (shift) {
      const shiftDuration = shift.fullDayMinutes || 480; // Default 8 hours
      
      if (workedMinutes > shiftDuration) {
        attendance.overtimeMinutes = workedMinutes - shiftDuration;
      } else {
        attendance.overtimeMinutes = 0;
      }

      // Update status based on worked minutes
      if (workedMinutes < shift.halfDayMinutes) {
        attendance.status = 'Absent';
      } else if (workedMinutes >= shift.halfDayMinutes && workedMinutes < shiftDuration) {
        attendance.status = 'Half Day';
      } else {
        attendance.status = 'Present';
      }
    }

    await attendance.save();

    // Return populated data
    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('shiftId');

    res.json({ success: true, data: updatedAttendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.adminCloseAttendance = async (req, res) => {
  try {
    const { outTime, reason } = req.body;
    const attendanceId = req.params.id;

    if (!outTime) {
      return res.status(400).json({ error: 'Out time is required' });
    }

    const attendance = await Attendance.findById(attendanceId).populate('shiftId');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    if (attendance.outTime) {
      return res.status(400).json({ error: 'Attendance already closed' });
    }

    // Parse the out time
    const forcedOut = new Date(outTime);
    
    // Validate date
    if (isNaN(forcedOut.getTime())) {
      return res.status(400).json({ error: 'Invalid out time format' });
    }

    const shift = attendance.shiftId;
    
    // Handle overnight shifts
    if (shift?.isOvernight && forcedOut < attendance.inTime) {
      forcedOut.setDate(forcedOut.getDate() + 1);
    }

    // Calculate worked minutes
    const workedMinutes = Math.max(
      Math.floor((forcedOut - attendance.inTime) / 60000),
      1
    );

    // Update attendance record
    attendance.outTime = forcedOut;
    attendance.totalMinutes = workedMinutes;
    attendance.adminLogout = true;
    attendance.adminOutTime = forcedOut;
    attendance.logoutReason = reason || 'Admin forced logout';
    attendance.adminClosedBy = req.user?.email || 'Admin';

    // Calculate overtime
    if (shift) {
      const shiftDuration = shift.fullDayMinutes || 480; // Default 8 hours if not set
      
      if (workedMinutes > shiftDuration) {
        attendance.overtimeMinutes = workedMinutes - shiftDuration;
      } else {
        attendance.overtimeMinutes = 0;
      }

      // Update status based on worked minutes
      if (workedMinutes < shift.halfDayMinutes) {
        attendance.status = 'Absent'; // Less than half day
      } else if (workedMinutes >= shift.halfDayMinutes && workedMinutes < shiftDuration) {
        attendance.status = 'Half Day';
      } else {
        attendance.status = 'Present';
      }
    }

    // Save with explicit fields
    await attendance.save();

    // Fetch the updated record with populated fields
    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate('shiftId')
      .lean();

    res.json({ 
      success: true, 
      data: updatedAttendance,
      message: 'Attendance closed successfully'
    });

  } catch (error) {
    console.error('Admin close attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to close attendance'
    });
  }
};

// Get pending logout attendance (Admin only)
exports.getPendingLogoutAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      outTime: null,  // Only records without outTime
      status: { $ne: 'Absent' } // Exclude absent records
    })
    .populate('shiftId')
    .sort({ date: -1, inTime: 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching pending logouts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('shiftId') 
    .sort({ inTime: 1 });
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get staff attendance history
exports.getStaffAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { staffId: req.params.staffId };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filter.date = { $gte: start, $lte: end };
    }
    
    const attendance = await Attendance.find(filter)
     .populate('shiftId')   
    .sort({ date: -1, inTime: 1 })
      .limit(100);
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get attendance by date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const attendance = await Attendance.find({
      date: {
        $gte: date,
        $lt: nextDay
      }
    })
    .populate('shiftId')
    .sort({ inTime: 1 });
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get attendance by date range
// Get attendance by date range
exports.getAttendanceByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, staffId, jobRole,shiftId  } = req.query;
    
    let filter = {};
    
  if (startDate && endDate) {
 const start = new Date(startDate);
start.setHours(0, 0, 0, 0);

const end = new Date(endDate);
end.setHours(23, 59, 59, 999);


  filter.date = { $gte: start, $lte: end };
}

    
    if (staffId) filter.staffId = staffId;
    if (jobRole) filter.jobRole = jobRole;
        if (shiftId) filter.shiftId = shiftId; // ✅ ADD THIS

    const attendance = await Attendance.find(filter)
      .populate('shiftId')   // ✅ THIS IS WHY UI SHOWS —
  
    .sort({ date: -1, inTime: 1 });
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start, end;

    if (startDate) {
    start = new Date(startDate);
start.setHours(0,0,0,0);

    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      end = new Date(endDate);
end.setHours(23,59,59,999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          attendance: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.initializeAutoAbsent = () => {
  // Run daily at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    console.log('Running auto-absent marking job...');
    await autoMarkAbsent();
  });
};

const autoMarkAbsent = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeStaff = await Staff.find({ active: true });
    const todayAttendance = await Attendance.find({ 
      date: today,
      status: { $ne: 'Absent' } // Don't mark absent for already absent
    });
    
    const markedStaffIds = new Set(todayAttendance.map(a => a.staffId));
    
    for (const staff of activeStaff) {
      if (!markedStaffIds.has(staff.staffId)) {
        await Attendance.create({
          staffId: staff.staffId,
          staffName: staff.name,
          jobRole: staff.jobRole,
          date: today,
          status: 'Absent',
          enteredBy: 'System Auto-Mark'
        });
        console.log(`Auto-marked absent: ${staff.name} (${staff.staffId})`);
      }
    }
  } catch (error) {
    console.error('Auto-absent job error:', error);
  }
};
// ✅ LIVE attendance summary (for dashboard)
exports.getAttendanceSummaryLive = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date();

    const end = endDate
      ? new Date(endDate)
      : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },

      // ⭐ KEY DIFFERENCE
      {
        $addFields: {
          effectiveStatus: {
            $cond: [
              { $eq: ['$outTime', null] }, // still working
              'Present',
              '$status'
            ]
          }
        }
      },

      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' }
            },
            status: '$effectiveStatus'
          },
          count: { $sum: 1 }
        }
      },

      {
        $group: {
          _id: '$_id.date',
          attendance: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },

      { $sort: { _id: -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export attendance
exports.exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, staffId, jobRole, shiftId, format = 'excel' } = req.query;

    let filter = {};

    if (startDate && endDate) {
   const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.date = { $gte: start, $lte: end };
    }

    if (staffId) filter.staffId = staffId;
    if (jobRole) filter.jobRole = jobRole;

    const attendance = await Attendance.find(filter)
      .populate('shiftId')   // ✅ ADD THIS

      .sort({ date: 1, inTime: 1 });
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance');
      
      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Staff ID', key: 'staffId', width: 12 },
        { header: 'Name', key: 'staffName', width: 25 },
        { header: 'job Role', key: 'jobRole', width: 15 },
        { header: 'Shift', key: 'shift', width: 12 },
        { header: 'In Time', key: 'inTime', width: 12 },
        { header: 'Out Time', key: 'outTime', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 30 },
        { header: 'Entered By', key: 'enteredBy', width: 20 }
      ];
      const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';
      // Add rows
      attendance.forEach(record => {
        worksheet.addRow({
date: record.date.toLocaleDateString('en-CA'),
          staffId: record.staffId,
          staffName: record.staffName,
          jobRole: record.jobRole,
shift: record.shiftId?.name,
         inTime: formatTime(record.inTime),
  outTime: formatTime(record.outTime),
          status: record.status,
          remarks: record.remarks,
          enteredBy: record.enteredBy
        });
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate}_to_${endDate}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // PDF export
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate}_to_${endDate}.pdf`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      doc.moveDown();
      
      // ===== TABLE HEADER =====
const tableTop = doc.y + 10;
const colX = {
  date: 40,
  name: 90,
  role: 180,
  shift: 240,
  in: 300,
  out: 340,
  status: 380
};

doc.fontSize(9).font('Helvetica-Bold');
doc.text('Date', colX.date, tableTop);
doc.text('Name', colX.name, tableTop);
doc.text('Role', colX.role, tableTop);
doc.text('Shift', colX.shift, tableTop);
doc.text('In', colX.in, tableTop);
doc.text('Out', colX.out, tableTop);
doc.text('Status', colX.status, tableTop);

doc.moveDown(0.5);
doc.font('Helvetica');

let y = tableTop + 15;

const fmtTime = d =>
  d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-';

// ===== TABLE ROWS =====
attendance.forEach(record => {
  if (y > 750) {
    doc.addPage();
    y = 50;
  }

doc.text(
  record.date.toLocaleDateString('en-GB'),
  colX.date,
  y
);
  doc.text(record.staffName, colX.name, y);
  doc.text(record.jobRole, colX.role, y);
  doc.text(record.shiftId?.name || '-', colX.shift, y);
  doc.text(fmtTime(record.inTime), colX.in, y);
  doc.text(fmtTime(record.outTime), colX.out, y);
  doc.text(record.status, colX.status, y);

  y += 16;
});

      
      doc.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};