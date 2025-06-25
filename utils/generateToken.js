const jwt = require('jsonwebtoken');

// Generate access token (short-lived)
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET || 'your_access_secret',
        { expiresIn: '15m' }
    );
};

// Generate refresh token (longer-lived)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
        { expiresIn: '30m' }
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
const generateTokens = (userId, role) => {
    const accessToken = generateAccessToken(userId, role);
    const refreshToken = generateRefreshToken(userId);

    return { accessToken, refreshToken };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokens
};
