const Prescription = require('../models/Prescription');

// Create prescription
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medicationName,
      strength,
      frequency,
      quantity,
      doctorId,
      indication,
      instructions
    } = req.body;

    const prescription = new Prescription({
      patientId,
      medicationName,
      strength,
      frequency,
      quantity,
      doctorId,
      indication,
      instructions,
      prescribedDate: new Date()
    });

    await prescription.save();

    res.status(201).json({
      success: true,
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get prescriptions
exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId, status } = req.query;

    let filter = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    res.json({
      success: true,
      prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Request refill
exports.requestRefill = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    if (prescription.refillsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No refills remaining'
      });
    }

    prescription.refillsRemaining -= 1;
    await prescription.save();

    res.json({
      success: true,
      prescription,
      message: 'Refill requested'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};