const express = require('express');
const axios = require('axios');
const protect = require('../middleware/auth');
const Favorite = require('../models/Favorite');
const router = express.Router();

// @route   GET /api/recipes/search
// @desc    Proxy search to Edamam API (Protects client keys)
// @access  Public (Or Private if you want to restrict it)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;

    if (!appId || !appKey) {
      return res.status(500).json({ message: 'Edamam API keys not configured on server' });
    }

    const response = await axios.get(
      `https://api.edamam.com/api/recipes/v2?type=public&q=${q}&app_id=${appId}&app_key=${appKey}`
    );

    if (!response.data || !response.data.hits) {
      return res.status(200).json([]);
    }

    const recipes = response.data.hits.map((hit) => {
      let largeImage = hit.recipe.images.LARGE !== undefined 
        ? hit.recipe.images.LARGE.url 
        : hit.recipe.images.REGULAR.url;

      return {
        name: hit.recipe.label,
        prepTime: hit.recipe.totalTime,
        ingredients: hit.recipe.ingredientLines,
        calories: hit.recipe.calories,
        image: hit.recipe.images.SMALL.url,
        largeImage: largeImage
      };
    });

    res.json(recipes);
  } catch (error) {
    console.error('Edamam API error:', error.message);
    res.status(500).json({ message: 'Failed to fetch recipes from provider' });
  }
});

// @route   GET /api/recipes/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/recipes/favorites
// @desc    Add a recipe to favorites
// @access  Private
router.post('/favorites', protect, async (req, res) => {
  const { name, prepTime, ingredients, calories, image, largeImage } = req.body;

  try {
    const favoriteExists = await Favorite.findOne({ userId: req.user._id, name });

    if (favoriteExists) {
      return res.status(400).json({ message: 'Recipe already in favorites' });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      name,
      prepTime,
      ingredients,
      calories,
      image,
      largeImage
    });

    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/recipes/favorites
// @desc    Remove a recipe from favorites by name (to match client implementation easily)
// @access  Private
router.delete('/favorites', protect, async (req, res) => {
  const { name } = req.body;

  try {
    const favorite = await Favorite.findOneAndDelete({ userId: req.user._id, name });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
