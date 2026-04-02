// constants.js — Application-wide constants for DiagnoSync backend

// ── HTTP Status Codes ─────────────────────────────────────────────────────────
const HTTP_STATUS = {
  OK:                   200,
  CREATED:              201,
  NO_CONTENT:           204,
  BAD_REQUEST:          400,
  UNAUTHORIZED:         401,
  FORBIDDEN:            403,
  NOT_FOUND:            404,
  CONFLICT:             409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS:    429,
  INTERNAL_SERVER:      500
};

// ── User Roles ────────────────────────────────────────────────────────────────
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR:  'doctor',
  ADMIN:   'admin'
};

// ── Appointment Statuses ──────────────────────────────────────────────────────
const APPOINTMENT_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  CANCELLED:  'cancelled',
  COMPLETED:  'completed',
  NO_SHOW:    'no_show'
};

// ── Symptom Severity Levels ───────────────────────────────────────────────────
const SYMPTOM_SEVERITY = {
  MILD:     'mild',
  MODERATE: 'moderate',
  SEVERE:   'severe',
  CRITICAL: 'critical'
};

// ── Symptom Categories ────────────────────────────────────────────────────────
const SYMPTOM_CATEGORIES = [
  'respiratory', 'cardiovascular', 'neurological', 'gastrointestinal',
  'musculoskeletal', 'dermatological', 'urological', 'endocrine',
  'mental_health', 'reproductive', 'sensory', 'general', 'other'
];

// ── Notification Types ────────────────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER:  'appointment_reminder',
  PRESCRIPTION_READY:    'prescription_ready',
  LAB_RESULT:            'lab_result',
  GENERAL:               'general',
  URGENT:                'urgent'
};

// ── Prescription Statuses ─────────────────────────────────────────────────────
const PRESCRIPTION_STATUS = {
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ── Pagination Defaults ───────────────────────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100
};

// ── JWT / Auth ────────────────────────────────────────────────────────────────
const AUTH = {
  ACCESS_TOKEN_EXPIRY:  '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  OTP_EXPIRY:           '1h',
  BCRYPT_SALT_ROUNDS:   10
};

// ── Atlas Free Tier Safety ────────────────────────────────────────────────────
const ATLAS = {
  MAX_DOCUMENTS_PER_QUERY: 100,  // never pull unbounded result sets
  STORAGE_LIMIT_MB:        512
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  APPOINTMENT_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_CATEGORIES,
  NOTIFICATION_TYPES,
  PRESCRIPTION_STATUS,
  PAGINATION,
  AUTH,
  ATLAS
};
