require('dotenv').config();
const User = require('../models/user');
const Vendor = require('../models/vendor');
const Product = require('../models/product');
const Category = require("../models/category");
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');
const { notifyapprovalstatus } = require('../services/notifyapprovalstatus');
  


  
module.exports = {

};
