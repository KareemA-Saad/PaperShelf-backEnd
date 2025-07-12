const express = require('express');
const router = express.Router();

// Import controllers
const {
    register,
    login,
    logout,
    verifyEmail,
    resendVerificationOTP,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    googleSignIn,
} = require('../controllers/authController');

// Import middlewares
const authenticateUser = require('../middlewares/authenticateUser');
const validate = require('../middlewares/validate');

// Import validation schemas
const {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    googleSignInSchema,
} = require('../utils/validationSchemas');

// Public routes (no authentication required)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleSignInSchema), googleSignIn);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// Email verification routes
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail); // Verify email with OTP
router.post('/resend-verification', validate(resendVerificationSchema), resendVerificationOTP); // Resend verification OTP

// Password reset routes
router.post('/request-password-reset', validate(requestPasswordResetSchema), requestPasswordReset); // Request password reset OTP
router.post('/reset-password', validate(resetPasswordSchema), resetPassword); // Reset password with OTP

module.exports = router;
