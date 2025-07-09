const jwt = require('jsonwebtoken');

// Generate access token (short-lived)
const generateAccessToken = (userId, role, tokenVersion) => {
    return jwt.sign(
      { userId, role, tokenVersion },
      process.env.JWT_ACCESS_SECRET || 'your_access_secret',
      { expiresIn: '1h' }
    );
  };

// Generate refresh token (longer-lived)
const generateRefreshToken = (userId, tokenVersion) => {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
    { expiresIn: '1d' }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_access_secret');
    } catch (error) {
        throw new Error('Invalid access token');
    }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret');
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

// Generate both tokens
const generateTokens = (user) => {
    const accessToken = generateAccessToken(user._id, user.role, user.tokenVersion);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);
    return { accessToken, refreshToken };
  };

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokens
};
