const Medication = require('../models/Medication');

exports.getMedications = async (req, res, next) => {
  try {
    const { search = '', limit = 20 } = req.query;
    
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const medications = await Medication.find(filter)
      .limit(Number(limit))
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      data: medications
    });
  } catch (error) {
    next(error);
  }
};
