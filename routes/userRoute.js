const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');
const userController = require('../controllers/userController');


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

// ******************Admin features in book and author*****************************************

// Get all pending books add or update
router.get(
  '/admin/pending-books',
  authenticateUser,
  authorizeRoles('admin'),
  userController.getPendingBooks
);

// Approve a book by ID
router.patch(
  '/admin/books/:id/approve',
  authenticateUser,
  authorizeRoles('admin'),
  userController.approveBook
);
// Reject a book by ID (new or updated)
router.patch(
  '/admin/books/:id/reject',
  authenticateUser,
  authorizeRoles('admin'),
  userController.rejectBook
);

// Get all books marked for deletion (by author)
router.get(
  '/admin/pending-deletes',
  authenticateUser,
  authorizeRoles('admin'),
  userController.getPendingDeleteBooks
);

// Approve deletion (permanently delete the book)
router.delete(
  '/admin/books/:id/approve-delete',
  authenticateUser,
  authorizeRoles('admin'),
  userController.approveBookDeletion
);

// Reject deletion request 
router.patch(
  '/admin/books/:id/reject-delete',
  authenticateUser,
  authorizeRoles('admin'),
  userController.rejectBookDeletion
);



module.exports = router;