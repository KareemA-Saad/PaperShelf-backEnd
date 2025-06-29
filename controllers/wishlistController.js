const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Add book to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId } = req.body;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Add to wishlist if not already present
        const user = await User.findById(userId);
        if (user.wishlist.includes(bookId)) {
            return res.status(400).json({ success: false, message: 'Book already in wishlist' });
        }
        user.wishlist.push(bookId);
        await user.save();

        res.status(200).json({ success: true, message: 'Book added to wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove book from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId } = req.params;

        const user = await User.findById(userId);
        user.wishlist = user.wishlist.filter(id => id.toString() !== bookId);
        await user.save();

        res.status(200).json({ success: true, message: 'Book removed from wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('wishlist');
        res.status(200).json({ success: true, data: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 