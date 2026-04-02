const DrugInteraction = require('../models/DrugInteraction');

// Check interactions between drugs
exports.checkDrugInteractions = async (drugs) => {
  try {
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

    return interactions;
  } catch (error) {
    throw new Error('Error checking drug interactions');
  }
};

// Get severity level
exports.getSeverityLevel = (interactions) => {
  if (interactions.length === 0) return 'safe';

  const severities = interactions.map(i => i.severity);
  
  if (severities.includes('major')) return 'major';
  if (severities.includes('moderate')) return 'moderate';
  if (severities.includes('minor')) return 'minor';
  
  return 'none';
};

// Get recommendations
exports.getRecommendations = (interactions) => {
  const recommendations = [];

  interactions.forEach(interaction => {
    if (interaction.recommendation) {
      recommendations.push(interaction.recommendation);
    }
  });

  return recommendations;
};

// Get alternatives
exports.getAlternatives = (interactions) => {
  const alternatives = [];

  interactions.forEach(interaction => {
    if (interaction.alternativeForDrug1) {
      alternatives.push({
        drug: interaction.drug1,
        alternative: interaction.alternativeForDrug1
      });
    }
    if (interaction.alternativeForDrug2) {
      alternatives.push({
        drug: interaction.drug2,
        alternative: interaction.alternativeForDrug2
      });
    }
  });

  return alternatives;
};

// Generate interaction report
exports.generateInteractionReport = (drugs, interactions) => {
  const report = {
    drugs,
    totalInteractions: interactions.length,
    severity: exports.getSeverityLevel(interactions),
    interactions: interactions.map(i => ({
      drug1: i.drug1,
      drug2: i.drug2,
      severity: i.severity,
      description: i.description
    })),
    recommendations: exports.getRecommendations(interactions),
    alternatives: exports.getAlternatives(interactions),
    timestamp: new Date()
  };

  return report;
};