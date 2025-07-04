const express = require('express');
const router = express.Router();

const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');
const authorController = require('../controllers/authorController');

// Validation from utils/validationSchemas.js
const validate = require('../middlewares/validate');
const { createBookSchema, updateBookSchema } = require('../utils/validationSchemas');

// Add new book
router.post(
  '/books',
  authenticateUser,
  authorizeRoles('author'),
  validate(createBookSchema),          
  authorController.createBook
);

// Get my books
router.get(
  '/books',
  authenticateUser,
  authorizeRoles('author'),
  authorController.getMyBooks
);

// Get single book by ID (for the author)
router.get(
  '/books/:id',
  authenticateUser,
  authorizeRoles('author'),
  authorController.getBookById
);

// Update book
router.put(
  '/books/:id',
  authenticateUser,
  authorizeRoles('author'),
  validate(updateBookSchema),          
  authorController.updateBook
);

// Delete book
router.delete(
  '/books/:id',
  authenticateUser,
  authorizeRoles('author'),
  authorController.deleteBook
);

module.exports = router;
