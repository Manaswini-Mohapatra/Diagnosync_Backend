module.exports = {
  uri: process.env.MONGODB_URI,         

  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 5,                     
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4                            
  },
 
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
