const HealthMetrics = require('../models/HealthMetrics');

// Create health metric record
exports.createHealthMetric = async (req, res) => {
  try {
    const {
      patientId,
      bloodPressure,
      heartRate,
      temperature,
      weight,
      height,
      bmi,
      bloodSugar,
      cholesterol,
      oxygenSaturation,
      respiratoryRate,
      notes,
      recordedBy,
      deviceType
    } = req.body;

    const healthMetric = new HealthMetrics({
      patientId,
      bloodPressure,
      heartRate,
      temperature,
      weight,
      height,
      bmi,
      bloodSugar,
      cholesterol,
      oxygenSaturation,
      respiratoryRate,
      notes,
      recordedBy,
      deviceType,
      date: new Date()
    });

    await healthMetric.save();

    res.status(201).json({
      success: true,
      healthMetric
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get patient health metrics
exports.getPatientMetrics = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { patientId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const metrics = await HealthMetrics.find(filter)
      .sort({ date: -1 });

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get latest health metric
exports.getLatestMetric = async (req, res) => {
  try {
    const { patientId } = req.params;

    const metric = await HealthMetrics.findOne({ patientId })
      .sort({ date: -1 });

    if (!metric) {
      return res.status(404).json({
        success: false,
        error: 'No health metrics found'
      });
    }

    res.json({
      success: true,
      metric
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update health metric
exports.updateHealthMetric = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const metric = await HealthMetrics.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      metric
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete health metric
exports.deleteHealthMetric = async (req, res) => {
  try {
    const { id } = req.params;

    await HealthMetrics.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Health metric deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get health metrics summary
exports.getMetricsSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const days = req.query.days || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await HealthMetrics.find({
      patientId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const summary = {
      totalRecords: metrics.length,
      averageHeartRate: metrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / metrics.length || 0,
      averageTemperature: metrics.reduce((sum, m) => sum + (m.temperature || 0), 0) / metrics.length || 0,
      averageWeight: metrics.reduce((sum, m) => sum + (m.weight || 0), 0) / metrics.length || 0,
      latestMetric: metrics[metrics.length - 1]
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};