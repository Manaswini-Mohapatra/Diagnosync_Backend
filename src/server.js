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

app.use('/api/appointments', stubRouter('Appointment'));
app.use('/api/prescriptions', stubRouter('Prescription'));
app.use('/api/nlp', stubRouter('NLP'));
app.use('/api/ml', stubRouter('ML'));
app.use('/api/interactions', stubRouter('DrugInteraction'));
// /api/patients ─ live (Phase 3)
// /api/doctors  ─ live (Phase 3)
app.use('/api/treatments', stubRouter('Treatment'));
app.use('/api/notifications', stubRouter('Notification'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DiagnoSync server is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
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