const axios = require('axios');
const ChatSession = require('../models/ChatSession');
const Prediction   = require('../models/Prediction');
const MLTreatment  = require('../models/MLTreatment');

const SYMPTOM_API_URL  = process.env.SYMPTOM_API_URL  || 'https://symptomchecker-v02m.onrender.com';
const TREATMENT_API_URL = process.env.TREATMENT_API_URL || 'https://treatmentrec.onrender.com';


exports.startSession = async (req, res) => {
  try {
    const response = await axios.post(`${SYMPTOM_API_URL}/api/session`);
    const { sessionId, greeting } = response.data;

    if (!sessionId) {
      return res.status(502).json({
        success: false,
        error: 'ML API did not return a sessionId.'
      });
    }


    res.status(201).json({ sessionId, greeting });
  } catch (error) {
    console.error('Error starting ML session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to start symptom checker session. Service may be unavailable.'
    });
  }
};


exports.chatWithBot = async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({
      success: false,
      error: 'sessionId and message are required'
    });
  }

  try {
    
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, userId: req.user._id },
      { $push: { messages: { role: 'user', text: message } } },
      { new: true, upsert: true }
    );

    if (!session) {
      return res.status(500).json({ success: false, error: 'Failed to save session.' });
    }


    const mlRes = await axios.post(`${SYMPTOM_API_URL}/api/chat`, {
      sessionId,
      message
    });
    const data = mlRes.data;


    const botText = data.reply || '';
    await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: { role: 'bot', text: botText } },
        $set: { phase: data.phase || 'gathering' }
      }
    );

    let treatmentPayload = null;

    if (data.phase === 'results' && data.results) {
      const results = data.results;

      // Save prediction
      await Prediction.create({
        userId: req.user._id,
        sessionId,
        primaryCondition: results.primaryCondition,
        risk: results.risk,
        urgency: results.urgency,
        conditions: results.conditions || [],
        recommendations: results.recommendations || [],
        disclaimer: results.disclaimer || ''
      });


      try {
        const allPredictedConditions = results.conditions || [];
        if (allPredictedConditions.length === 0 && results.primaryCondition) {
          allPredictedConditions.push({ name: results.primaryCondition });
        }


        const existingConditions = await MLTreatment.find({ userId: req.user._id })
          .select('condition')
          .lean();
        const existingSet = new Set(
          existingConditions.map((r) => r.condition.toLowerCase().trim())
        );

        const reappearingConditions = allPredictedConditions.filter(
          (cond) => existingSet.has((cond.name || '').toLowerCase().trim())
        );
        if (reappearingConditions.length > 0) {
          const names = reappearingConditions.map(c => c.name);
          await MLTreatment.updateMany(
            { userId: req.user._id, condition: { $in: names } },
            { $currentDate: { updatedAt: true } }
          );
        }

        // Insert only conditions not yet in history
        const newConditions = allPredictedConditions.filter(
          (cond) => !existingSet.has((cond.name || '').toLowerCase().trim())
        );

        // Fetch treatment for each new condition concurrently
        const newRecords = await Promise.all(newConditions.map(async (cond) => {
          try {

            const singleResultPayload = {
              ...results,
              primaryCondition: cond.name,
              conditions: [cond]
            };
            const treatRes = await axios.post(`${TREATMENT_API_URL}/api/treatment`, { results: singleResultPayload });
            
            return {
              condition: cond.name,
              treatmentData: treatRes.data.primary
            };
          } catch (err) {

            return {
              condition: cond.name,
              treatmentData: {
                condition: cond.name,
                severity: cond.severity || 'Low',
                recommendations: [],
                notes: 'Detailed treatment plan not available for this condition. Please consult your doctor.',
                duration: 'As directed by your physician',
                followUp: 'Schedule a consultation with your healthcare provider.',
                warnings: []
              }
            };
          }
        }));

        if (newRecords.length > 0) {

          await MLTreatment.insertMany(
            [...newRecords].reverse().map(({ condition, treatmentData: td }) => ({
              userId: req.user._id,
              sessionId,
              condition,
              treatmentData: td
            }))
          );
        }
        

        const primaryRecord = newRecords.find(r => r.condition === results.primaryCondition) 
          || { treatmentData: null };
        treatmentPayload = { primary: primaryRecord.treatmentData };

      } catch (treatErr) {
        console.error('Treatment API failed:', treatErr.message);
      }
    }
    res.status(200).json({
      ...data,
      ...(treatmentPayload ? { treatment: treatmentPayload } : {})
    });
  } catch (error) {
    console.error('Error in ML chat:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error communicating with AI Health Assistant. Please try again in a moment.'
    });
  }
};


exports.getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();


    const sessionIds = sessions.map((s) => s.sessionId);
    const predictions = await Prediction.find({
      userId: req.user._id,
      sessionId: { $in: sessionIds }
    }).lean();


    const predictionMap = {};
    predictions.forEach((p) => { predictionMap[p.sessionId] = p; });


    const sessionsWithPredictions = sessions.map((s) => ({
      ...s,
      prediction: predictionMap[s.sessionId] || null
    }));

    res.status(200).json({ success: true, sessions: sessionsWithPredictions });
  } catch (error) {
    console.error('getChatHistory error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history.' });
  }
};


exports.getTreatmentHistory = async (req, res) => {
  try {
    const treatments = await MLTreatment.find({ userId: req.user._id })
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    res.status(200).json({ success: true, treatments });
  } catch (error) {
    console.error('getTreatmentHistory error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch treatment history.' });
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

    const response = await axios.post(`${TREATMENT_API_URL}/api/treatment`, { results });
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