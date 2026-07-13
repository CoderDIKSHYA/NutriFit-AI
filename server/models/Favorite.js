const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  prepTime: {
    type: Number,
    default: 0
  },
  ingredients: {
    type: [String],
    default: []
  },
  calories: {
    type: Number,
    default: 0
  },
  image: {
    type: String
  },
  largeImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index so a user cannot favorite the exact same recipe name twice
FavoriteSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
