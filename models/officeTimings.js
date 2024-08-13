const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const officeTimingsSchema = new Schema({
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      required: true
    },
  }, { timestamps: true });

const officeTimings = mongoose.model('OfficeTiming', officeTimingsSchema );
module.exports = officeTimings;