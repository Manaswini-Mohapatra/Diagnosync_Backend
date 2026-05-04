const axios = require('axios');

const SYMPTOM_API_URL = process.env.SYMPTOM_API_URL || 'https://symptomchecker-v02m.onrender.com';
const TREATMENT_API_URL = process.env.TREATMENT_API_URL || 'https://treatmentrec.onrender.com';

exports.startSession = async (req, res) => {
  try {
    const response = await axios.post(`${SYMPTOM_API_URL}/api/session`);
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error starting ML session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to start symptom checker session. Service may be unavailable.'
    });
  }
};

exports.chatWithBot = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required'
      });
    }

    const response = await axios.post(`${SYMPTOM_API_URL}/api/chat`, {
      sessionId,
      message
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in ML chat:', error.message);
    // Render free tier might take time to wake up, adding helpful context
    res.status(500).json({
      success: false,
      error: 'Error communicating with AI Health Assistant. Please try again in a moment.'
    });
  }
};

exports.getTreatment = async (req, res) => {
  try {
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({
        success: false,
        error: 'results object is required to fetch treatments'
      });
    }

    const response = await axios.post(`${TREATMENT_API_URL}/api/treatment`, {
      results
    });

    res.status(200).json(response.data);
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error getting treatment recommendation:', errorMsg);
    res.status(500).json({
      success: false,
      error: 'Error fetching treatment recommendations.',
      details: errorMsg
    });
  }
};