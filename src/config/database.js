// database.js — MongoDB / Mongoose configuration constants
// Used by database/connection.js via config import (or directly if needed)

module.exports = {
  uri: process.env.MONGODB_URI,         // full Atlas connection string from .env

  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 5,                      // keep pool lean for Atlas free tier (512 MB)
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4                            // force IPv4
  },

  // Collection / schema-level constants
  COLLECTION_NAMES: {
    USERS:            'users',
    PATIENTS:         'patients',
    DOCTORS:          'doctors',
    APPOINTMENTS:     'appointments',
    PRESCRIPTIONS:    'prescriptions',
    SYMPTOMS:         'symptoms',
    CONDITIONS:       'conditions',
    MEDICATIONS:      'medications',
    DRUG_INTERACTIONS:'druginteractions',
    TREATMENTS:       'treatments',
    HEALTH_METRICS:   'healthmetrics',
    NOTIFICATIONS:    'notifications'
  }
};
