const mongoose = require('mongoose');

const FoodEntrySchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  proteinGrams: {
    type: Number,
    default: 0
  },
  carbsGrams: {
    type: Number,
    default: 0
  },
  fatsGrams: {
    type: Number,
    default: 0
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  }
});

const DailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logDate: {
    type: String,
    required: true // Format: YYYY-MM-DD
  },
  waterIntakeMl: {
    type: Number,
    default: 0
  },
  sleepHours: {
    type: Number,
    default: 0
  },
  foods: [FoodEntrySchema]
});

// Compound unique index so a user only has one entry per day
DailyLogSchema.index({ userId: 1, logDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
