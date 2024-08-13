const express = require('express');
const router = express.Router();
const empController = require('../controllers/employeeController');
const { authenticateToken, authenticateResetToken } = require('../middleware/middleware');


router.post('/create', authenticateToken ,empController.createEmployee);
router.post('/delete', authenticateToken ,empController.deleteEmployee);
router.post('/update', authenticateToken ,empController.updateEmployee);
router.get('/getAll', authenticateToken ,empController.getAllEmployees);


module.exports = router;