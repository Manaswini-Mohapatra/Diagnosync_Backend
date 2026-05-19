const { 
  checkDrugInteractions, 
  generateInteractionReport 
} = require('../utils/drugInteractionChecker');

exports.checkInteractions = async (req, res, next) => {
  try {
    const { drugs } = req.body;

    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of at least 2 drugs to check for interactions.'
      });
    }

    const interactions = await checkDrugInteractions(drugs);

    const report = generateInteractionReport(drugs, interactions);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};