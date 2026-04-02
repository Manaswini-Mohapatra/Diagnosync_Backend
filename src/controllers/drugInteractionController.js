const DrugInteraction = require('../models/DrugInteraction');

exports.checkInteractions = async (req, res) => {
  try {
    const { drugs } = req.body;

    // Check for interactions
    const interactions = [];
    
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const interaction = await DrugInteraction.findOne({
          $or: [
            { drug1: drugs[i], drug2: drugs[j] },
            { drug1: drugs[j], drug2: drugs[i] }
          ]
        });

        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    const overallRisk = interactions.length > 0 ? 'warning' : 'safe';

    res.json({
      success: true,
      interactions,
      overallRisk,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};