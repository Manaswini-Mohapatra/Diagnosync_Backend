const Treatment = require('../models/Treatment');
const Condition = require('../models/Condition');

// Create treatment recommendation
exports.createTreatment = async (req, res) => {
  try {
    const {
      patientId,
      condition,
      conditionId,
      confidence,
      severity,
      symptoms,
      medications,
      lifestyle,
      warnings,
      emergencyWarnings,
      doctorConsultationRecommended,
      followUpSchedule
    } = req.body;

    const treatment = new Treatment({
      patientId,
      condition,
      conditionId,
      confidence,
      severity,
      symptoms,
      medications,
      lifestyle,
      warnings,
      emergencyWarnings,
      doctorConsultationRecommended,
      followUpSchedule
    });

    await treatment.save();

    res.status(201).json({
      success: true,
      treatment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get treatment for patient
exports.getPatientTreatments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const treatments = await Treatment.find({ patientId })
      .populate('conditionId', 'name description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      treatments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get specific treatment
exports.getTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    const treatment = await Treatment.findById(id)
      .populate('conditionId', 'name description symptoms')
      .populate('patientId', 'name email');

    if (!treatment) {
      return res.status(404).json({
        success: false,
        error: 'Treatment not found'
      });
    }

    res.json({
      success: true,
      treatment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update treatment
exports.updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const treatment = await Treatment.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      treatment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete treatment
exports.deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    await Treatment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Treatment deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get treatment recommendations by condition
exports.getTreatmentsByCondition = async (req, res) => {
  try {
    const { conditionId } = req.params;

    const treatments = await Treatment.find({ conditionId })
      .populate('conditionId', 'name description')
      .sort({ confidence: -1 });

    res.json({
      success: true,
      treatments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};