require('dotenv').config();
const User = require('../models/user');
const Vendor = require('../models/vendor');
const Admin = require('../models/admin');
const Customer = require('../models/customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendOtp } = require('../services/sendOtp');
const { reSendOtp } = require('../services/sendOtp');
const ExcelJS = require('exceljs');


const registerUser = async (req, res) => {
  try { 
    const { name, username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Fill all fields' });
    }

    if (!["customer", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Role must be "customer", "vendor", or "admin".' });
    }

    const userAlreadyExists = await User.findOne({ username });

    if (userAlreadyExists) {
      return res.status(400).json({ message: 'Username already exists' });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    if (role === "vendor") {
      const newVendor = new Vendor({
        vendorId: newUser._id,
        products: [],
        inventory: [],
        orders: [],
        salesInsights: [],
        profile: {
          contactDetails: { phone: "", email: newUser.email },
          bankingInformation: { accountNumber: "", bankName: "" },
          policies: "",
        },
      });

      await newVendor.save();

      return res.status(201).json({ message: 'Vendor registration successful. Await admin approval.' });
    }

    if (role === "admin") {
      const newAdmin = new Admin({
        adminId: newUser._id,
        vendorManagement: {
          approvedVendors: [],
          rejectedVendors: [],
        },
        productOversight: {
          approvedProducts: [],
          rejectedProducts: [],
        },
        systemManagement: {
          websiteContent: "",
          categories: [],
          promotionalCampaigns: [],
        },
        orderManagement: {
          escalatedIssues: [],
        },
        reportingAndAnalytics: {
          salesReports: [],
          vendorPerformance: [],
          userEngagementMetrics: [],
        },
      });

      await newAdmin.save();

      return res.status(201).json({ message: 'Admin registration successful.' });
    }

    if (role === "customer") {
      const newCustomer = new Customer({
        userId: newUser._id,
        cart: [],
        wishlist: [],
        orders: [],
        browsingHistory: [],
        recommendations: [],
        customerSupport: { tickets: [] },
      });

      await newCustomer.save();

      return res.status(201).json({ message: 'Customer registration successful. You can log in now.' });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Fill all fields' });
    }

    const user = await User.findOne({ username, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: 'No user found with this username' });
    }

    if (!user.isVerified) {
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
      role: user.role, 
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '4h' });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
    });
  } catch (err) {
    console.error(err);
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

const uploadPicture = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const file = req.file;
    const newFileName = file.filename;
    const lastUnderscoreIndex = newFileName.lastIndexOf('_');
    const newBaseName = newFileName.slice(0, lastUnderscoreIndex);
    
    if (user.profilePicUrl) {
        const oldFileName = path.basename(user.profilePicUrl);
        const oldLastUnderscoreIndex = oldFileName.lastIndexOf('_');
        const oldBaseName = oldFileName.slice(0, oldLastUnderscoreIndex);
        const oldFilePath = path.join(__dirname, '../uploads/', user.username, oldFileName);

      if (fs.existsSync(oldFilePath)) {
        if (oldBaseName === newBaseName) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${user.username}/${newFileName}`;
    user.profilePicUrl = url;
    await user.save();

    res.status(201).json({ message: 'File uploaded successfully', url });
  } catch (err) {
    console.error('Error uploading file', err);
    res.status(500).send('Server error');
  }
};

const getPicture = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user || !user.profilePicUrl) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.status(200).json({ url: user.profilePicUrl });
  } catch (err) {
    console.error('Error fetching profile picture', err);
    res.status(500).send('Server error');
  }
}

const updateUserInfo = async (req, res) => {
  try {
    const userId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profile.phone": req.body.phone,  
          "profile.address": req.body.address, 
          "profile.bankingInformation": req.body.bankingInformation, 
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User information updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: "Server error" }); 
  }
};

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User information retrieved successfully.",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  registerUser,
  loginUser,
  emailVerification,
  reSendingOtp,
  verifyOtp,
  forgotPass,
  passwordReset,
  changePass,
  uploadPicture,
  getPicture,
  updateUserInfo,
  getUserInfo,
};