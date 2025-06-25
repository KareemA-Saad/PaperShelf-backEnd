const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');

// Import controllers
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteMe,
  deleteUserById,
  changeUserRole,
} = require('../controllers/userController');

// Route definitions
// Admin only routes
router.get('/', authenticateUser, authorizeRoles('admin'), getAllUsers);
router.get('/:id', authenticateUser, authorizeRoles('admin'), getUserById);
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteUserById);
router.patch('/:id/role', authenticateUser, authorizeRoles('admin'), changeUserRole);

// User routes
router.patch('/:id', authenticateUser, updateUser); // User can update self, admin can update anyone (logic in controller)
router.delete('/me', authenticateUser, deleteMe);

module.exports = router;
