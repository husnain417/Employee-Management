const mongoose = require('mongoose');
const { dbUrl } = require('./env'); 

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1); 
  }
};

module.exports = connectDB;
