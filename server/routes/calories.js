const express = require('express');
const axios = require('axios');
const protect = require('../middleware/auth');
const DailyLog = require('../models/DailyLog');
const router = express.Router();

// @route   GET /api/calories/calculate
// @desc    Proxy to RapidAPI Fitness Calculator (Protects client keys)
// @access  Public
router.get('/calculate', async (req, res) => {
  const { age, gender, height, weight, activitylevel } = req.query;

  if (!age || !gender || !height || !weight || !activitylevel) {
    return res.status(400).json({ message: 'Missing required query parameters' });
  }

  const apiHost = process.env.RAPID_API_HOST;
  const apiKey = process.env.RAPID_API_KEY;

  if (!apiHost || !apiKey) {
    return res.status(500).json({ message: 'RapidAPI keys not configured on server' });
  }

  try {
    const response = await axios.get('https://fitness-calculator.p.rapidapi.com/dailycalorie', {
      params: {
        age,
        gender,
        height,
        weight,
        activitylevel
      },
      headers: {
        'X-RapidAPI-Host': apiHost,
        'X-RapidAPI-Key': apiKey
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('RapidAPI calorie calculator error:', error.message);
    res.status(500).json({ message: 'Failed to perform calculation' });
  }
});

// @route   GET /api/calories/logs
// @desc    Get user's daily log for a specific date (YYYY-MM-DD)
// @access  Private
router.get('/logs', protect, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter (YYYY-MM-DD) is required' });
  }

  try {
    let log = await DailyLog.findOne({ userId: req.user._id, logDate: date });
    if (!log) {
      // Return empty blueprint if no log exists yet
      return res.json({
        logDate: date,
        waterIntakeMl: 0,
        sleepHours: 0,
        foods: []
      });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/calories/logs
// @desc    Add food entry or update water/sleep logs
// @access  Private
router.post('/logs', protect, async (req, res) => {
  const { date, waterIntakeMl, sleepHours, food } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    let log = await DailyLog.findOne({ userId: req.user._id, logDate: date });

    if (!log) {
      log = new DailyLog({
        userId: req.user._id,
        logDate: date,
        waterIntakeMl: waterIntakeMl || 0,
        sleepHours: sleepHours || 0,
        foods: []
      });
    } else {
      if (waterIntakeMl !== undefined) log.waterIntakeMl = waterIntakeMl;
      if (sleepHours !== undefined) log.sleepHours = sleepHours;
    }

    if (food && food.foodName && food.calories) {
      log.foods.push({
        foodName: food.foodName,
        calories: food.calories,
        proteinGrams: food.proteinGrams || 0,
        carbsGrams: food.carbsGrams || 0,
        fatsGrams: food.fatsGrams || 0,
        mealType: food.mealType || 'snack'
      });
    }

    await log.save();
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/calories/logs/food/:foodId
// @desc    Delete food entry from a specific daily log
// @access  Private
router.delete('/logs/food/:foodId', protect, async (req, res) => {
  const { foodId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    let log = await DailyLog.findOne({ userId: req.user._id, logDate: date });

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    // Pull the food entry
    log.foods = log.foods.filter((f) => f._id.toString() !== foodId);

    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
