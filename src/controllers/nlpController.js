const nlpProcessor = require('../utils/nlpProcessor');

exports.analyzeSymptoms = async (req, res) => {
  try {
    const { text, patientId } = req.body;


    const extractedSymptoms = nlpProcessor.extractSymptoms(text);


    const normalizedSymptoms = nlpProcessor.normalizeSymptoms(extractedSymptoms);


    const severity = nlpProcessor.calculateSeverity(normalizedSymptoms);

    res.json({
      success: true,
      data: {
        symptoms: normalizedSymptoms,
        severity,
        confidence: Math.min(95, (normalizedSymptoms.length * 15) + 40),
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};