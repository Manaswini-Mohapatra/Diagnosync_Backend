const axios = require('axios');
const ChatSession = require('../models/ChatSession');
const Prediction   = require('../models/Prediction');
const MLTreatment  = require('../models/MLTreatment');

const SYMPTOM_API_URL  = process.env.SYMPTOM_API_URL  || 'https://symptomchecker-v02m.onrender.com';
const TREATMENT_API_URL = process.env.TREATMENT_API_URL || 'https://treatmentrec.onrender.com';

// ── POST /api/ml/session ───────────────────────────────────────────────────
// Calls the ML API to start a session. Does NOT create a DB record yet —
// the session is persisted lazily only when the user sends their first message.
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

    // Return sessionId to frontend — DB record created on first user message
    res.status(201).json({ sessionId, greeting });
  } catch (error) {
    console.error('Error starting ML session:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to start symptom checker session. Service may be unavailable.'
    });
  }
};

// ── POST /api/ml/chat ──────────────────────────────────────────────────────
// Forwards a chat message, persists messages, and auto-saves results.
// The ChatSession is created (upserted) on the FIRST user message so we never
// store empty/bot-only sessions.
exports.chatWithBot = async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({
      success: false,
      error: 'sessionId and message are required'
    });
  }

  try {
    // 1. Upsert session and append user message in one atomic operation.
    //    If the session doesn't exist yet (first message), it is created here.
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, userId: req.user._id },
      { $push: { messages: { role: 'user', text: message } } },
      { new: true, upsert: true }
    );

    if (!session) {
      return res.status(500).json({ success: false, error: 'Failed to save session.' });
    }

    // 2. Forward to ML API
    const mlRes = await axios.post(`${SYMPTOM_API_URL}/api/chat`, {
      sessionId,
      message
    });
    const data = mlRes.data;

    // 3. Save bot reply to DB
    const botText = data.reply || '';
    await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: { role: 'bot', text: botText } },
        $set: { phase: data.phase || 'gathering' }
      }
    );

    // 4. If results arrived → persist prediction + fetch & persist treatment
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

      // Auto-fetch treatments and save every predicted condition
      try {
        const allPredictedConditions = results.conditions || [];
        if (allPredictedConditions.length === 0 && results.primaryCondition) {
          allPredictedConditions.push({ name: results.primaryCondition });
        }

        // Fetch conditions already saved for this user to prevent duplicates in the VIEW
        const existingConditions = await MLTreatment.find({ userId: req.user._id })
          .select('condition')
          .lean();
        const existingSet = new Set(
          existingConditions.map((r) => r.condition.toLowerCase().trim())
        );

        // Insert only conditions not yet in history
        const newConditions = allPredictedConditions.filter(
          (cond) => !existingSet.has((cond.name || '').toLowerCase().trim())
        );

        const newRecords = [];

        // Fetch treatment for each new condition concurrently
        await Promise.all(newConditions.map(async (cond) => {
          try {
            // Trick the treatment API into treating this condition as primary
            // to bypass the top-3 limit and preserve medibot data enrichment
            const singleResultPayload = {
              ...results,
              primaryCondition: cond.name,
              conditions: [cond]
            };
            const treatRes = await axios.post(`${TREATMENT_API_URL}/api/treatment`, { results: singleResultPayload });
            
            newRecords.push({
              condition: cond.name,
              treatmentData: treatRes.data.primary
            });
          } catch (err) {
            // Graceful fallback when treatment API has no data for this condition
            newRecords.push({
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
            });
          }
        }));

        if (newRecords.length > 0) {
          await MLTreatment.insertMany(
            newRecords.map(({ condition, treatmentData: td }) => ({
              userId: req.user._id,
              sessionId,
              condition,
              treatmentData: td
            }))
          );
        }
        
        // For the immediate API response to the frontend, send the primary treatment
        const primaryRecord = newRecords.find(r => r.condition === results.primaryCondition) 
          || { treatmentData: null };
        treatmentPayload = { primary: primaryRecord.treatmentData };

      } catch (treatErr) {
        // Non-fatal: treatment fetch failed, still return prediction results
        console.error('Treatment API failed:', treatErr.message);
      }
    }

    // 5. Return combined response
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

// ── GET /api/ml/history/chat ───────────────────────────────────────────────
// Returns all chat sessions for the logged-in user, each with its prediction
exports.getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all predictions that belong to these sessions in one query
    const sessionIds = sessions.map((s) => s.sessionId);
    const predictions = await Prediction.find({
      userId: req.user._id,
      sessionId: { $in: sessionIds }
    }).lean();

    // Build a lookup map: sessionId → prediction
    const predictionMap = {};
    predictions.forEach((p) => { predictionMap[p.sessionId] = p; });

    // Attach prediction to each session (null if not yet completed)
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

// ── GET /api/ml/history/treatment ─────────────────────────────────────────
// Returns all AI-generated treatment records for the logged-in user
exports.getTreatmentHistory = async (req, res) => {
  try {
    const treatments = await MLTreatment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, treatments });
  } catch (error) {
    console.error('getTreatmentHistory error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch treatment history.' });
  }
};

// ── POST /api/ml/treatment (legacy – kept for backward compat) ────────────
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