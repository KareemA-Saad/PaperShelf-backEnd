// middlewares/authorizeRoles.js

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (from authenticateUser middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized`
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
