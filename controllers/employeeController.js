require('dotenv').config();
const User = require('../models/user');
const OfficeTimings = require('../models/officeTimings')
const Attendence = require('../models/attendence')
const bcrypt = require('bcrypt');
const {sendCredentials} = require('../services/sendCredentials');
const { isNull, identity } = require('lodash');


const createEmployee = async (req,res)=>
{
    try {
        const { username, email, password, empRole ,emailToSendCred } = req.body;
        const {id,role} = req.user;

        if (!username || !email || !password || !empRole) {
          return res.status(400).json({ message: 'Fill all fields' });
        }

        if(role !== "admin")
        {
          return res.status(400).json({ message: 'Unauthorized' });
        }
        
        const isPasswordValid = /^(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
        if (!isPasswordValid) {
          return res.status(400).json({
            message: 'Password must be at least 8 characters long, include at least one special character, and contain at least one number.',
          });
        }
    
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          if (!isEmailValid) {
            return res.status(400).json({ message: 'Enter a valid email format' });
          }

        const user = await User.findOne({_id: id});
        if (!user) {
          return res.status(400).json({ message: 'User not found' });
        }
  
        const userAlreadyExists = await User.findOne({ username });
  
        if(userAlreadyExists )
        {
           if(userAlreadyExists.isDeleted !== true)
           {
            return res.status(400).json({ message: 'User already exists' });
           } 
        }  
         
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword,role: "employee", role: empRole ,admin: user.username, isVerified: true, emailToSendCred});
        await newUser.save();
        await sendCredentials({username,email,password,emailToSendCred});
    
        res.status(200).json({ message: 'Employee created and credentials sent successfully' });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
      }
};

const deleteEmployee = async (req, res) => {
  try {
    const { username, id} = req.body;
    const {role} = req.user;

    if(role !== "admin")
    {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    if(id)
    {
      const employee = await User.findOne({ _id: id , isDeleted: false});
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found' });
      }
      employee.isDeleted = true;
  
      employee.save();
    }


    if(username)
    {
      const employee = await User.findOne({ username , isDeleted: false});
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found' });
      }
      employee.isDeleted = true;
  
      employee.save();
    }

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const updateEmployee = async (req, res) => {
  try {
    const {id , updatedUsername, updatedEmail , updatedPass} = req.body;
    const {role} = req.user;

    if(role !== "admin")
    {
      return res.status(400).json({ message: 'Unauthorized' });
    }

    const employee = await User.findOne({_id: id});
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    updatedUsername !== null ? employee.username = updatedUsername :  employee.username;

    if(updatedEmail)
    {
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail);
      if (!isEmailValid) {
        return res.status(400).json({ message: 'Enter a valid email format' });
      }

      employee.email = updatedEmail;
    }

    if(updatedPass)
    {
      const isPasswordValid = /^(?=.*\d)(?=.*[\W_]).{8,}$/.test(updatedPass);
      if (!isPasswordValid) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters long, include at least one special character, and contain at least one number.',
        });
      }
      const hashedPassword = await bcrypt.hash(updatedPass, 10);

      employee.password = hashedPassword;
    }

    await employee.save();
    let username = updatedUsername? updatedUsername: employee.username;
    let email = updatedEmail? updatedEmail: employee.email;
    let password = updatedPass? updatedPass : employee.password;
    let emailToSendCred = employee.emailToSendCred;
    await sendCredentials({username,email,password,emailToSendCred});

    res.status(200).json({ message: 'Employee info updated successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllEmployees = async (req, res) => {
  try {
    const {role} = req.user;

    if(role !== "admin")
    {
      return res.status(400).json({ message: 'Unauthorized' });
    }
    const employees = await User.find({role: "employee", isDeleted: false});

    res.status(200).json({ message: 'Employees info: ', employees });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createEmployee,
  deleteEmployee,
  updateEmployee,
  getAllEmployees,
};
