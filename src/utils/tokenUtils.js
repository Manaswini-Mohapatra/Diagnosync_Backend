const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';    
const REFRESH_TOKEN_EXPIRY = '7d';   


exports.generateAccessToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};


exports.generateRefreshToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};


exports.verifyToken = (token) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.verify(token, JWT_SECRET);
};


exports.decodeToken = (token) => {
  return jwt.decode(token);
};

exports.generateOtpToken = (payload, expiresIn = '1h') => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
