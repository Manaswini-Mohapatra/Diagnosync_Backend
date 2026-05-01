require('dotenv').config();
const express = require('express');
const connectDB = require('./database/connection');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
const corsMiddleware = require('./middleware/corsMiddleware');
const errorHandler = require('./middleware/errorHandler');

app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Database ───────────────────────────────────────────────────────────────
connectDB();

// ── Routes — Phase 2 (Auth & Users) ───────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

// ── Routes — Phase 3 (Patient & Doctor Profiles) ──────────────────────────
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes  = require('./routes/doctorRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/doctors',  doctorRoutes);

// ── Stub router helper ─────────────────────────────────────────────────────
// Returns 501 for any route on routes not yet implemented.
// Remove each stub as the real router is written.
const stubRouter = (label) => {
  const router = express.Router();
  router.all('*', (req, res) => {
    res.status(501).json({
      success: false,
      error: `${label} routes are not implemented yet`
    });
  });
  return router;
};

const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);
const prescriptionRoutes = require('./routes/prescriptionRoutes');
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/nlp', stubRouter('NLP'));
app.use('/api/ml', stubRouter('ML'));
const drugInteractionRoutes = require('./routes/drugInteractionRoutes');
app.use('/api/interactions', drugInteractionRoutes);
// /api/patients ─ live (Phase 3)
// /api/doctors  ─ live (Phase 3)
const medicationRoutes = require('./routes/medicationRoutes');
app.use('/api/medications', medicationRoutes);

const treatmentRoutes = require('./routes/treatmentRoutes');
app.use('/api/treatments', treatmentRoutes);

const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const healthMetricsRoutes = require('./routes/healthMetricsRoutes');
app.use('/api/health-metrics', healthMetricsRoutes);
// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DiagnoSync server is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});


app.get('/api', (req, res) => {
  res.json({
    message: "Diagnosync API is running 🚀"
  });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  DiagnoSync Backend running on port ${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api`);
  console.log(`🏥  Health: http://localhost:${PORT}/api/health`);
});