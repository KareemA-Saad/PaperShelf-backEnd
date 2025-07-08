const express = require('express');
const router = express.Router();
const { addReview, deleteReview, getReviews, approveReview,getApprovedReviews } = require('../controllers/reviewController');
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');
const { getPendingReviews } = require('../controllers/reviewController');

// Add a review (user must be logged in)
router.post('/:bookId', authenticateUser, addReview);

// Delete a review (user must be logged in)
router.delete('/:bookId/:reviewId', authenticateUser, deleteReview);

// Get all reviews for a book (public)
router.get('/:bookId', getReviews);

// approve/reject review endpoint
router.patch('/approve/:bookId/:reviewId', authenticateUser, authorizeRoles('admin'), approveReview);

// API: get all pending reviews
router.get('/pending/all', authenticateUser, authorizeRoles('admin'), getPendingReviews);

// Add this line:
router.get('/approved/all', authenticateUser, authorizeRoles('admin'), getApprovedReviews);

module.exports = router; 


