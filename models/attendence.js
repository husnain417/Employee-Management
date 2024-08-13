const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const attendenceSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    checkIn: {
      type: Date,
      required: true
    },
    checkOut: {
      type: Date,
      required: false 
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      required: true
    },
    date: {
        type: Date,
        required: true
    },
    workedHours: {
      type: Number,
      default: 0, 
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Early Checkout','Late Checkin'],
        default: 'Absent'
    }
  }
  ,{ timestamps: true });
  

const attendence = mongoose.model('Attendence', attendenceSchema );
module.exports = attendence;