import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 * @param {string} password - Plain text password.
 * @returns {Promise<string>} Hashed password.
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password.
 * @param {string} password - Plain text password.
 * @param {string} hash - Hashed password.
 * @returns {Promise<boolean>} True if passwords match.
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
