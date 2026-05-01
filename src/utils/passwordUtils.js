const bcryptjs = require('bcryptjs');

// ── Strong Password Rule ────────────────────────────────────────────────────
// Applied to NEW signups and password resets. NOT applied to login (backward compat).
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#^])[A-Za-z\d@$!%*?&\-_#^]{8,}$/;

exports.isStrongPassword = (password) => STRONG_PASSWORD_REGEX.test(password);

exports.STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&-_#^).';

// Validate password strength (detailed breakdown — used for UI feedback)
exports.validatePasswordStrength = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };

  const isStrong = Object.values(requirements).every(r => r);
  const strength = Object.values(requirements).filter(r => r).length;

  return {
    isStrong,
    strength: strength / 5 * 100,
    requirements
  };
};

// Generate password
exports.generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  for (let i = 0; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password;
};

// Hash password
exports.hashPassword = async (password) => {
  try {
    const salt = await bcryptjs.genSalt(10);
    return await bcryptjs.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

// Compare passwords
exports.comparePasswords = async (password, hashedPassword) => {
  try {
    return await bcryptjs.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};