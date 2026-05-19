require('dotenv').config();

const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV:     process.env.NODE_ENV    || 'development',
  PORT:         parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI:  process.env.MONGODB_URI,
  JWT_SECRET:   process.env.JWT_SECRET,
  CORS_ORIGIN:  process.env.CORS_ORIGIN || 'http://localhost:5173',

  isDev:  () => (process.env.NODE_ENV || 'development') === 'development',
  isProd: () => process.env.NODE_ENV === 'production'
};
