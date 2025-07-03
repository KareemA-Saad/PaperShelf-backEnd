const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Import controllers
const {
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteMe,
  deleteUserById,
  changeUserRole,
  getAllAuthors,
} = require('../controllers/userController');

const { updateUserSchema } = require('../utils/validationSchemas');
const validate = require('../middlewares/validate');

// Route definitions
// Public routes
router.get('/authors', getAllAuthors);

// Admin only routes
router.get('/', authenticateUser, authorizeRoles('admin'), getAllUsers);
router.get('/:id', authenticateUser, authorizeRoles('admin'), getUserById);
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteUserById);
router.patch('/:id/role', authenticateUser, authorizeRoles('admin'), changeUserRole);

// User routes
router.patch('/profile/:id', authenticateUser, validate(updateUserSchema), updateUserProfile); // User profile update (name/password)
router.patch('/:id', authenticateUser, authorizeRoles('admin'), validate(updateUserSchema), updateUser); // Admin can update any user
router.delete('/me', authenticateUser, deleteMe);

module.exports = router;
