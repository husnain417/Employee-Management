require('dotenv').config();
const OfficeTiming = require('../models/officeTimings');

const setOfficeTimings = async (req, res) => {
    try {
        const { startTime, endTime, day } = req.body;
        const {role} = req.user;

        if(role !== "admin")
        {
          return res.status(400).json({ message: 'Unauthorized' });
        }

        if (!startTime || !endTime || !day) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingTiming = await OfficeTiming.findOne({ day });
        if (existingTiming) {
            return res.status(400).json({ message: `Office timings for ${day} already set` });
        }

        const newTiming = new OfficeTiming({ startTime, endTime, day });
        await newTiming.save();

        res.status(200).json({ message: `Office timings set successfully for ${day}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateOfficeTimings = async (req, res) => {
    try {
        const { startTime, endTime, day } = req.body;
        const {role} = req.user;

        if(role !== "admin")
        {
          return res.status(400).json({ message: 'Unauthorized' });
        }

        if (!startTime || !endTime || !day) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingTiming = await OfficeTiming.findOne({ day });
        if (!existingTiming) {
            return res.status(404).json({ message: `Office timings for ${day} not found` });
        }

        existingTiming.startTime = startTime;
        existingTiming.endTime = endTime;

        await existingTiming.save();

        res.status(200).json({ message:`Office timings updated successfully fro day ${day}`});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllTimings = async (req, res) => {
    try {
      const timings = await OfficeTiming.find({});
  
      res.status(200).json({ message: 'Timings: ',timings });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = {setOfficeTimings,updateOfficeTimings,getAllTimings};