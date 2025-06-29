const Book = require('../models/bookModel');

// Add a review to a book
exports.addReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId } = req.params;
        const { rating, text } = req.body;

        if (!rating || !text) {
            return res.status(400).json({ success: false, message: 'Rating and text are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }

        // Prevent duplicate reviews by the same user
        if (book.reviews.some(r => r.user.toString() === userId.toString())) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this book.' });
        }

        // Add review
        const review = { user: userId, rating, text };
        book.reviews.push(review);

        // Update averageRating and totalReviews
        book.totalReviews = book.reviews.length;
        book.averageRating = book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length;

        await book.save();
        res.status(201).json({ success: true, message: 'Review added.', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a review from a book
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId, reviewId } = req.params;
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }
        const review = book.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        // Only review author or admin can delete
        if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
        }
        review.remove();
        // Update averageRating and totalReviews
        book.totalReviews = book.reviews.length;
        book.averageRating = book.reviews.length > 0 ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length) : 0;
        await book.save();
        res.status(200).json({ success: true, message: 'Review deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all reviews for a book
exports.getReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const book = await Book.findById(bookId).populate('reviews.user', 'name');
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }
        res.status(200).json({ success: true, data: book.reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 