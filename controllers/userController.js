require('dotenv').config();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');

const loginUser = async (req, res) => {
  try {
    const { username, password , role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Fill all fields' });
    }

    if (role !== "admin" && role !== "employee")
    {
      return res.status(400).json({ message: 'Enter correct role' });
    }

    const user = await User.findOne({ username , isDeleted: false});
    if (!user) {
      return res.status(400).json({ message: 'No user found with this username' });
    }

    if(user.role !== role)
    {
      return res.status(400).json({ message: 'No user with this role found' });
    }

    if(!user.isVerified)
    {
      return res.status(400).json({ message: 'Verify email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', accessToken });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const emailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    await sendOtp(user);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const reSendingOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    await reSendOtp(user);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyOtp = async(req,res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.otp = null;  
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();    
    
    res.status(200).json({ message: 'OTP verified successfully' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const forgotPass = async(req,res) => {
  try {
    const { email  } = req.body;

    const user = await User.findOne({ email });
    if(!user)
    {
      return res.status(400).json({message: 'User doesnot exist'})
    }

    if(user.role !== "admin")
    {
      return res.status(400).json({message: 'Invalid action'})
    }
      const payload = {
        id: user._id,
        username: user.username,
        email: user.email
      };

      const resetToken = jwt.sign(payload, process.env.RESET_TOKEN_SECRET , { expiresIn: '15m' });

      await reSendOtp(user);

      res.status(200).json({ message: 'Enter New Password with Otp sent to your mail',resetToken});
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const passwordReset = async (req, res) => {
  try {
    const { otp, newPassword} = req.body;
    const { id } = req.user; 
    
    const isPasswordValid = /^(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, include at least one special character, and contain at least one number.',
      });
    }

    const user = await User.findOne({ id });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;

    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.log(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const changePass = async (req, res) => {
  try {
    const { oldPassword , newPassword } = req.body;
    const { id } = req.user; 

    if(oldPassword == newPassword)
    {
      return res.status(400).json({message : "You entered the same password please change: "});
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: 'No user found with this email' });
    }

    if(user.role !== "admin")
    {
      return res.status(400).json({message: 'Invalid action'})
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginUser,
  emailVerification,
  reSendingOtp,
  verifyOtp,
  forgotPass,
  passwordReset,
  changePass,
};
