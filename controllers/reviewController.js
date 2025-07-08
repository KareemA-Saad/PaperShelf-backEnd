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
        const review = { user: userId, rating, text, approved: false };
        book.reviews.push(review);

        // Update averageRating and totalReviews
        book.totalReviews = book.reviews.length;
        book.averageRating = book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length;

        await book.save();
        const savedReview = book.reviews[book.reviews.length - 1];
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
    // try {
    //     const { bookId } = req.params;
    //     const book = await Book.findById(bookId).populate('reviews.user', 'name');
    //     if (!book) {
    //         return res.status(404).json({ success: false, message: 'Book not found.' });
    //     }
    //     res.status(200).json({ success: true, data: book.reviews });
    // } catch (error) {
    //     res.status(500).json({ success: false, message: error.message });
    // }
    try {
        const { bookId } = req.params;
        const book = await Book.findById(bookId).populate({
            path: 'reviews.user',
            select: 'name'
        });

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }

        const approvedReviews = book.reviews
            .filter(r => r.approved)
            .map(review => ({
                bookId: book._id,
                bookTitle: book.title,
                reviewId: review._id,
                user: review.user ? { _id: review.user._id, name: review.user.name } : { name: 'Unknown' },
                rating: review.rating,
                text: review.text,
                createdAt: review.createdAt
            }));

        res.status(200).json({ success: true, data: approvedReviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 

// Approve or reject a review
exports.approveReview = async (req, res) => {
    try {
        const { bookId, reviewId } = req.params;
        const { approved } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can approve or reject reviews.'
            });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }

        console.log('[DEBUG] Incoming reviewId param:', reviewId);
        console.log('[DEBUG] All reviews IDs in book:', book.reviews.map(r => r._id.toString()));

        const review = book.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        review.approved = approved;
        await book.save();

        res.status(200).json({
            success: true,
            message: `Review has been ${approved ? 'approved' : 'rejected'}.`,
            data: {
                bookId: book._id,
                bookTitle: book.title,
                reviewId: review._id,
                user: review.user,  
                rating: review.rating,
                text: review.text,
                approved: review.approved,
                createdAt: review.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all pending reviews across all books (for admin dashboard)
exports.getPendingReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim();

        const reviewsPipeline = [
            { $unwind: "$reviews" },
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.user",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            ...(search ? [{
                $match: {
                    $or: [
                        { "title": { $regex: search, $options: "i" } },
                        { "author": { $regex: search, $options: "i" } },
                        { "reviews.text": { $regex: search, $options: "i" } },
                        { "userData.name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),
            { $match: { "reviews.approved": false } },
            {
                $project: {
                    bookId: "$_id",
                    bookTitle: "$title",
                    coverImage: "$coverImage",
                    author: "$author",
                    reviewId: "$reviews._id",
                    rating: "$reviews.rating",
                    text: "$reviews.text",
                    createdAt: "$reviews.createdAt",
                    user: {
                        $cond: [
                            { $gt: [{ $size: "$userData" }, 0] },
                            {
                                _id: { $arrayElemAt: ["$userData._id", 0] },
                                name: { $arrayElemAt: ["$userData.name", 0] }
                            },
                            { name: "Unknown" }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const pendingReviews = await Book.aggregate(reviewsPipeline);

        const totalCountAggPipeline = [
            { $unwind: "$reviews" },
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.user",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            ...(search ? [{
                $match: {
                    $or: [
                        { "title": { $regex: search, $options: "i" } },
                        { "author": { $regex: search, $options: "i" } },
                        { "reviews.text": { $regex: search, $options: "i" } },
                        { "userData.name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),
            { $match: { "reviews.approved": false } },
            { $count: "total" }
        ];

        const totalCountAgg = await Book.aggregate(totalCountAggPipeline);
        const totalItems = totalCountAgg[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            data: pendingReviews.map(r => ({
                bookId: r.bookId,
                bookTitle: r.bookTitle,
                coverImage: r.coverImage,
                author: r.author,
                reviewId: r.reviewId,
                user: { name: r.user.name },
                rating: r.rating,
                text: r.text,
                createdAt: r.createdAt
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('[getPendingReviews ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getApprovedReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim();

        const reviewsPipeline = [
            { $unwind: "$reviews" },
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.user",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            ...(search ? [{
                $match: {
                    $or: [
                        { "title": { $regex: search, $options: "i" } },
                        { "author": { $regex: search, $options: "i" } },
                        { "reviews.text": { $regex: search, $options: "i" } },
                        { "userData.name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),
            { $match: { "reviews.approved": true } },
            {
                $project: {
                    bookId: "$_id",
                    bookTitle: "$title",
                    coverImage: "$coverImage",
                    author: "$author",
                    reviewId: "$reviews._id",
                    rating: "$reviews.rating",
                    text: "$reviews.text",
                    createdAt: "$reviews.createdAt",
                    user: {
                        $cond: [
                            { $gt: [{ $size: "$userData" }, 0] },
                            {
                                _id: { $arrayElemAt: ["$userData._id", 0] },
                                name: { $arrayElemAt: ["$userData.name", 0] }
                            },
                            { name: "Unknown" }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const approvedReviews = await Book.aggregate(reviewsPipeline);

        const totalCountAggPipeline = [
            { $unwind: "$reviews" },
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.user",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            ...(search ? [{
                $match: {
                    $or: [
                        { "title": { $regex: search, $options: "i" } },
                        { "author": { $regex: search, $options: "i" } },
                        { "reviews.text": { $regex: search, $options: "i" } },
                        { "userData.name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),
            { $match: { "reviews.approved": true } },
            { $count: "total" }
        ];

        const totalCountAgg = await Book.aggregate(totalCountAggPipeline);
        const totalItems = totalCountAgg[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            data: approvedReviews.map(r => ({
                bookId: r.bookId,
                bookTitle: r.bookTitle,
                coverImage: r.coverImage,
                author: r.author,
                reviewId: r.reviewId,
                user: { name: r.user.name },
                rating: r.rating,
                text: r.text,
                createdAt: r.createdAt
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('[getApprovedReviews ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
