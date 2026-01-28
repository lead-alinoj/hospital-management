const Attendance = require('../models/attendance.model');
const Staff = require('../models/staff.model');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Shift = require('../models/shift.model');

exports.markAttendance = async (req, res) => {
  const { staffId, staffName, jobRole, shiftId } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: 'Shift ID missing' });
  }

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    return res.status(400).json({ error: 'Invalid shift' });
  }

  const now = new Date();
  const attendanceDate = new Date(now);
  attendanceDate.setHours(0, 0, 0, 0);

  // ✅ Convert HH:mm → Date
  const [h, m] = req.body.inTime.split(':');
  const inTime = new Date(attendanceDate);
  inTime.setHours(+h, +m, 0, 0);

  // ✅ Check open attendance ONLY for today
  const open = await Attendance.findOne({
    staffId,
    outTime: null,
    date: attendanceDate
  });

  if (open) {
    return res.status(400).json({ error: 'Previous attendance not closed' });
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
};



exports.updateAttendance = async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate('shiftId');

  if (!attendance || attendance.outTime) {
    return res.status(400).json({ error: 'Invalid logout' });
  }

  const now = new Date();
  const workedMinutes = Math.floor((now - attendance.inTime) / 60000);

  attendance.outTime = now;
  attendance.totalMinutes = workedMinutes;

  // ✅ KEEP STATUS AS PRESENT
  if (!attendance.status) {
    attendance.status = 'Present';
  }

  // optional overtime
  const shift = attendance.shiftId;
  if (workedMinutes > shift.fullDayMinutes) {
    attendance.overtimeMinutes = workedMinutes - shift.fullDayMinutes;
  }

  await attendance.save();
  res.json({ success: true, data: attendance });
};



exports.adminCloseAttendance = async (req, res) => {
  const { outTime, reason } = req.body;

  const attendance = await Attendance.findById(req.params.id)
    .populate('shiftId');

  if (!attendance || attendance.outTime) {
    return res.status(400).json({ error: 'Attendance already closed' });
  }

  const forcedOut = new Date(outTime);
  const workedMinutes =
    Math.floor((forcedOut - attendance.inTime) / 60000);

  const shift = attendance.shiftId;

  attendance.outTime = forcedOut;
  attendance.totalMinutes = Math.min(workedMinutes, shift.maxMinutes);

  attendance.status =
    attendance.totalMinutes >= shift.fullDayMinutes
      ? 'Present'
      : attendance.totalMinutes >= shift.halfDayMinutes
      ? 'Half Day'
      : 'Absent';

  attendance.adminLogout = true;
  attendance.adminOutTime = forcedOut;
  attendance.logoutReason = reason;
  attendance.adminClosedBy = req.user?.email || 'Admin';

  await attendance.save();

  res.json({ success: true, data: attendance });
};

// Get pending logout attendance (Admin only)
exports.getPendingLogoutAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      outTime: null
    })
    .populate('shiftId')
    .sort({ date: 1, inTime: 1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    const { startDate, endDate, staffId, jobRole } = req.query;
    
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

// Export attendance
exports.exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, staffId, jobRole, format = 'excel' } = req.query;

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
      
      // Add rows
      attendance.forEach(record => {
        worksheet.addRow({
          date: record.date.toISOString().split('T')[0],
          staffId: record.staffId,
          staffName: record.staffName,
          jobRole: record.jobRole,
shift: record.shiftId?.name,
          inTime: record.inTime,
          outTime: record.outTime || '-',
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
      
      attendance.forEach((record, index) => {
        doc.text(`${index + 1}. ${record.staffName} (${record.staffId}) - ${record.status}`);
        doc.text(`   Date: ${record.date.toISOString().split('T')[0]}, Shift: ${record.shiftId?.name}, In: ${record.inTime}, Out: ${record.outTime || '-'}`);
        doc.moveDown(0.5);
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