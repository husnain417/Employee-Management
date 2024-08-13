const express = require('express');
const router = express.Router();
const timingsController = require('../controllers/officeTimingsController');
const { authenticateToken, authenticateResetToken } = require('../middleware/middleware');

router.post('/set-timings', authenticateToken, timingsController.setOfficeTimings);
router.post('/update-timings', authenticateToken, timingsController.updateOfficeTimings);
router.get('/timings', authenticateToken, timingsController.getAllTimings);


module.exports = router;