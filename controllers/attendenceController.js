require('dotenv').config();
const User = require('../models/user');
const OfficeTimings = require('../models/officeTimings')
const Attendence = require('../models/attendence')
const ExcelJS = require('exceljs');


const setCheckInTime = async (req, res) => {
  try {
    const { id } = req.user;
    const { checkIn, day, date } = req.body;

    if (!checkIn || !day || !date) {
      return res.status(400).json({ message: 'Check-in time, day, and date are required' });
    }

    const dateTimeString = `${date}T${checkIn}`;
    const checkInDateTime = new Date(dateTimeString);

    if (isNaN(checkInDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in time or date' });
    }

    const existingAttendance = await Attendence.findOne({ user: id, day, date });
    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in on this day' });
    }

    const newAttendance = new Attendence({
      user: id,
      checkIn: checkInDateTime,
      day,
      date
    });

    await newAttendance.save();

    res.status(200).json({ message: 'Check-in successful', data: newAttendance });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

  
const setCheckOutTime = async (req, res) => {
  try {
    const { id } = req.user;
    const { checkOut, day, date } = req.body;

    if (!checkOut || !day || !date) {
      return res.status(400).json({ message: 'Check-out time, day, and date are required' });
    }

    const checkOutDateTime = new Date(`${date}T${checkOut}`);
    const existingAttendance = await Attendence.findOne({ user: id, day, date });

    if (!existingAttendance) {
      return res.status(400).json({ message: 'No check-in record found for this day' });
    }

    if (existingAttendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out on this day' });
    }

    existingAttendance.checkOut = checkOutDateTime;
    const workedHours = (checkOutDateTime - existingAttendance.checkIn) / 3600000;
    existingAttendance.workedHours = workedHours;

    const minimumHours = 7;
    const lateCheckinThreshold = new Date(`${date}T09:00:00`);
    const earlyCheckoutThreshold = new Date(`${date}T17:00:00`);

    if (workedHours >= minimumHours) {
      existingAttendance.status = 'Present';
    } else if (workedHours < minimumHours) {
      if (existingAttendance.checkOut < earlyCheckoutThreshold) {
        existingAttendance.status = 'Early Checkout';
      } else if (existingAttendance.checkIn > lateCheckinThreshold) {
        existingAttendance.status = 'Late Checkin';
      } else {
        existingAttendance.status = 'Absent';
      }
    }

    await existingAttendance.save();

    res.status(200).json({ message: 'Check-out successful', data: existingAttendance });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAttendence = async (req,res) => {
  try {
    const { id } = req.user;

    const employeeAtt = await Attendence.find({ user: id });

    res.status(200).json({ message: 'your attendence: ', employeeAtt });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const getAttendenceByDateForEmp = async (req, res) => {
  try {
    const { id,role } = req.user;
    const { date } = req.body;

    if (role !== "employee") {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 1);

    const employeeAtt = await Attendence.find({
      user: id,
      date: { 
        $gte: startDate, 
        $lt: endDate 
      }
    });

    res.status(200).json({ message: 'Attendance By Day:', employeeAtt });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllAttendence = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "admin") {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    const allAttendence = await Attendence.find({}).populate('user', 'username _id'); 

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 25 },      
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Check-In Time', key: 'checkIn', width: 25 },
      { header: 'Check-Out Time', key: 'checkOut', width: 25 },
      { header: 'Day', key: 'day', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Worked Hours', key: 'workedHours', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    allAttendence.forEach(attendance => {
      worksheet.addRow({
        employeeId: attendance.user._id.toString(),              
        employeeName: attendance.user.username, 
        checkIn: attendance.checkIn ? attendance.checkIn.toISOString().slice(0, 19).replace('T', ' ') : '-',
        checkOut: attendance.checkOut ? attendance.checkOut.toISOString().slice(0, 19).replace('T', ' ') : '-',
        day: attendance.day,
        date: attendance.date.toISOString().slice(0, 10), 
        workedHours: attendance.workedHours.toFixed(2),
        status: attendance.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating xlsx file', err);
    res.status(500).send('Server error');
  }
};

const getAttendenceByDateOrName = async (req, res) => {
  try {
    const { role } = req.user;
    const { date, name } = req.body;

    if (role !== "admin") {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(startDate.getDate() + 1);

      query.date = { 
        $gte: startDate, 
        $lt: endDate 
      };
    }

    if (name) {
      const user = await User.findOne({ username: name });
      if (!user) {
        return res.status(200).json({ message: 'No user record found' });
      }
      query.user = user._id;
    }

    const attendance = await Attendence.find(query);

    res.status(200).json({ message: 'Attendance Records:', attendance });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};



  module.exports = {setCheckInTime,
                   setCheckOutTime,
                   getAttendence,
                   getAllAttendence,
                   getAttendenceByDateOrName,
                   getAttendenceByDateForEmp};