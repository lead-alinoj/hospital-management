const Attendance = require('../models/attendance.model');
const Staff = require('../models/staff.model');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.markAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const exists = await Attendance.findOne({
      staffId: req.body.staffId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for today'
      });
    }

    const now = new Date();
    const inTime = `${now.getHours().toString().padStart(2,'0')}:${now
      .getMinutes().toString().padStart(2,'0')}`;

    const attendance = await Attendance.create({
      staffId: req.body.staffId,
      staffName: req.body.staffName,
      jobRole: req.body.jobRole,
      shift: req.body.shift,
      inTime,
      status: req.body.status,
      remarks: req.body.remarks,
  enteredBy: req.user.email || req.user.username || 'System',
      date: today
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};



exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false });
    }

    if (attendance.outTime) {
      return res.status(400).json({
        success: false,
        error: 'Already logged out'
      });
    }

    const [h, m] = attendance.inTime.split(':').map(Number);
    const inDate = new Date(attendance.date);
    inDate.setHours(h, m, 0);

    const now = new Date();
    const diffMinutes = Math.floor((now - inDate) / 60000);

    // 🚫 BLOCK < 5 minutes
    if (diffMinutes < 5) {
      return res.status(400).json({
        success: false,
        error: 'Logout allowed only after 5 minutes'
      });
    }

    const outTime = `${now.getHours().toString().padStart(2,'0')}:${now
      .getMinutes().toString().padStart(2,'0')}`;

    attendance.outTime = outTime;
    attendance.totalMinutes = diffMinutes;

    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
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
    }).sort({ inTime: 1 });
    
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
      .sort({ date: -1 })
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
    }).sort({ inTime: 1 });
    
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
      // Fix: Use string dates directly without extra parsing
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Don't modify hours - let frontend handle it
      filter.date = { 
        $gte: new Date(start.setHours(0, 0, 0, 0)), 
        $lte: new Date(end.setHours(23, 59, 59, 999)) 
      };
    }
    
    
    if (staffId) filter.staffId = staffId;
    if (jobRole) filter.jobRole = jobRole;
    
    const attendance = await Attendance.find(filter)
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
    
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);
    
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
      {
        $sort: { _id: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export attendance
exports.exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, staffId, jobRole, format = 'excel' } = req.query;

    let filter = {};

    if (startDate && endDate) {
const start = new Date(startDate);
start.setHours(0,0,0,0);

const end = new Date(endDate);
end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lte: end };
    }

    if (staffId) filter.staffId = staffId;
    if (jobRole) filter.jobRole = jobRole;

    const attendance = await Attendance.find(filter)
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
          shift: record.shift,
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
        doc.text(`   Date: ${record.date.toISOString().split('T')[0]}, Shift: ${record.shift}, In: ${record.inTime}, Out: ${record.outTime || '-'}`);
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