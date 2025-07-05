const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Import controllers
const {
    getAllBooks,
    searchBooks,
    getCategories,
    getFeaturedBooks,
    createBook,
    getBookById,
    getBookByIdWithCart,
    updateBook,
    deleteBook,
    toggleFeatured
} = require('../controllers/bookController');

// Import middlewares
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');
const validate = require('../middlewares/validate');
const { uploadBookCover, uploadBookImages } = require('../middlewares/upload');

// Import validation schemas
const {
    createBookSchema,
    updateBookSchema,
    bookListingSchema,
    bookSearchSchema
} = require('../utils/validationSchemas');

// Public routes (no authentication required)
// GET /api/v1/books - Get all books with filtering and pagination
router.get('/', validate(bookListingSchema, 'query'), getAllBooks);

// GET /api/v1/books/search - Search books
router.get('/search', validate(bookSearchSchema, 'query'), searchBooks);

// GET /api/v1/books/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/v1/books/featured - Get featured books
router.get('/featured', getFeaturedBooks);

// Protected routes (authentication required)
// POST /api/v1/books - Create new book (Admin only)
router.post('/',
    authenticateUser,
    authorizeRoles('admin'),
    uploadBookCover,
    validate(createBookSchema),
    createBook
);

// GET /api/v1/books/:id - Get book by ID (must be after specific routes)
router.get('/:id', getBookById);

// GET /api/v1/books/:id/cart - Get book by ID with cart information (authenticated users)
router.get('/:id/cart', authenticateUser, getBookByIdWithCart);

// PUT /api/v1/books/:id - Update book (Admin only)
router.put('/:id',
    authenticateUser,
    authorizeRoles('admin'),
    uploadBookCover,
    validate(updateBookSchema),
    updateBook
);

// DELETE /api/v1/books/:id - Delete book (Admin only)
router.delete('/:id',
    authenticateUser,
    authorizeRoles('admin'),
    deleteBook
);

// PATCH /api/v1/books/:id/featured - Toggle featured status (Admin only)
router.patch('/:id/featured',
    authenticateUser,
    authorizeRoles('admin'),
    toggleFeatured
);

//ai model
// routes/bookRoutes.js
router.get('/:id/formatted-summary', bookController.getFormattedSummary);


module.exports = router;