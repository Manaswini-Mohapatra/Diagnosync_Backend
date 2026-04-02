const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';    // short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';    // long-lived refresh token

/**
 * Generate an access token for the given user payload.
 * Payload should contain: { id, email, role }
 */
exports.generateAccessToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generate a refresh token (longer lived).
 */
exports.generateRefreshToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

/**
 * Verify a token and return the decoded payload.
 * Throws a JsonWebTokenError if invalid or expired.
 */
exports.verifyToken = (token) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Decode a token WITHOUT verifying its signature (use only for inspection).
 */
exports.decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generate a short-lived one-time token (e.g. email verification, password reset).
 * @param {Object} payload  - data to encode
 * @param {string} expiresIn - e.g. '1h', '10m'
 */
exports.generateOtpToken = (payload, expiresIn = '1h') => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
