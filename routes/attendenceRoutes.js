const express = require('express');
const router = express.Router();
const attendenceController = require('../controllers/attendenceController');
const { authenticateToken, authenticateResetToken } = require('../middleware/middleware');


router.post('/set-checkin', authenticateToken ,attendenceController.setCheckInTime);
router.post('/set-checkout', authenticateToken ,attendenceController.setCheckOutTime);
router.get('/get-attendence', authenticateToken ,attendenceController.getAttendence);
router.get('/get-AllAttendence', authenticateToken ,attendenceController.getAllAttendence);
router.post('/get-AttendenceByDateOrName', authenticateToken ,attendenceController.getAttendenceByDateOrName);
router.post('/get-AttendenceByDateForEmp', authenticateToken ,attendenceController.getAttendenceByDateForEmp);


module.exports = router;