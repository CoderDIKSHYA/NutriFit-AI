const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  age: {
    type: Number,
    min: [15, 'Age must be at least 15'],
    max: [80, 'Age must be under 80'],
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  heightCm: {
    type: Number,
    min: [130, 'Height must be at least 130 cm'],
    max: [230, 'Height must be under 230 cm'],
    required: true
  },
  weightKg: {
    type: Number,
    min: [40, 'Weight must be at least 40 kg'],
    max: [160, 'Weight must be under 160 kg'],
    required: true
  },
  activityLevel: {
    type: String,
    required: true
  },
  targetWeightKg: {
    type: Number
  },
  dailyCalorieTarget: {
    type: Number,
    default: 2000
  }
});

module.exports = mongoose.model('Profile', ProfileSchema);
