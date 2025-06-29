const express = require('express');
const router = express.Router();
const { addReview, deleteReview, getReviews } = require('../controllers/reviewController');
const authenticateUser = require('../middlewares/authenticateUser');

// Add a review (user must be logged in)
router.post('/:bookId', authenticateUser, addReview);

// Delete a review (user must be logged in)
router.delete('/:bookId/:reviewId', authenticateUser, deleteReview);

// Get all reviews for a book (public)
router.get('/:bookId', getReviews);

module.exports = router; 