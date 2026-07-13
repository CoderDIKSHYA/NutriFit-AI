const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const protect = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/coach/query
// @desc    Get fitness & diet advice from Gemini AI Coach
// @access  Private (Allows access to user context securely)
router.post('/query', protect, async (req, res) => {
  const { question, userContext } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Question parameter is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'Gemini API key not configured on server' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
      You are a professional, encouraging certified Health Coach and Sports Nutritionist.
      
      User Physical Stats & Information:
      ${JSON.stringify(userContext || {}, null, 2)}
      
      Question: "${question}"
      
      Provide actionable, evidence-based, concise recommendations. Speak directly to the user.
      Avoid long introductions. Limit responses to 2-3 structured paragraphs or bullet lists.
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });
  } catch (error) {
    console.error('Gemini AI execution error:', error.message);
    res.status(500).json({ message: 'AI Health Coach failed to process query' });
  }
});

module.exports = router;
