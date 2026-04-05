const HealthMetrics = require('../models/HealthMetrics');

// ── Helpers ────────────────────────────────────────────────────────────────
const verifyOwnership = (patientId, user) => {
  if (user.role === 'admin' || user.role === 'doctor') return true;
  return patientId.toString() === user._id.toString();
};

// ── POST /api/health-metrics ───────────────────────────────────────────────
exports.createHealthMetric = async (req, res, next) => {
  try {
    const data = req.body;

    // Security: If patient, force patientId to be their own ID
    if (req.user.role === 'patient') {
      data.patientId = req.user._id;
      data.recordedBy = 'patient';
    } else {
      if (!data.patientId) return res.status(400).json({ success: false, error: 'Patient ID required' });
      if (!data.recordedBy) data.recordedBy = req.user.role === 'doctor' ? 'doctor' : 'device';
    }

    const healthMetric = await HealthMetrics.create({
      ...data,
      date: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Health metric logged successfully',
      data: healthMetric
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/health-metrics/patient/:patientId ─────────────────────────────
exports.getPatientMetrics = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    if (!verifyOwnership(patientId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let filter = { patientId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const metrics = await HealthMetrics.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/health-metrics/patient/:patientId/latest ──────────────────────
exports.getLatestMetric = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!verifyOwnership(patientId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const metric = await HealthMetrics.findOne({ patientId }).sort({ date: -1 });

    if (!metric) {
      return res.status(404).json({ success: false, error: 'No health metrics found' });
    }

    res.status(200).json({
      success: true,
      data: metric
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/health-metrics/:id ──────────────────────────────────────────
exports.updateHealthMetric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const metric = await HealthMetrics.findById(id);
    if (!metric) return res.status(404).json({ success: false, error: 'Health metric not found' });

    if (!verifyOwnership(metric.patientId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await HealthMetrics.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/health-metrics/:id ─────────────────────────────────────────
exports.deleteHealthMetric = async (req, res, next) => {
  try {
    const { id } = req.params;

    const metric = await HealthMetrics.findById(id);
    if (!metric) return res.status(404).json({ success: false, error: 'Health metric not found' });

    if (!verifyOwnership(metric.patientId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await HealthMetrics.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Health metric deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/health-metrics/patient/:patientId/summary ─────────────────────
exports.getMetricsSummary = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const days = req.query.days || 30;

    if (!verifyOwnership(patientId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const metrics = await HealthMetrics.find({
      patientId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const totalRecords = metrics.length;
    let summary = {
      totalRecords,
      averageHeartRate: 0,
      averageTemperature: 0,
      averageWeight: 0,
      latestMetric: totalRecords > 0 ? metrics[totalRecords - 1] : null
    };

    if (totalRecords > 0) {
      summary.averageHeartRate = metrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / totalRecords;
      summary.averageTemperature = metrics.reduce((sum, m) => sum + (m.temperature || 0), 0) / totalRecords;
      summary.averageWeight = metrics.reduce((sum, m) => sum + (m.weight || 0), 0) / totalRecords;
    }

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};