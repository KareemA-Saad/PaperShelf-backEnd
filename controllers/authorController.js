// controllers/authorController.js
const Book = require('../models/bookModel');


// Create a new book

exports.createBook = async (req, res) => {
  try {
    // Check if body is empty
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data provided'
      });
    }

    const {
      title,
      description,
      isbn,
      price,
      discount,
      pages,
      category,
      coverImage,
      images,
      stock,
      isNew,
      isBestseller,
      isFeatured
    } = req.body;

    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }

    const book = new Book({
      title,
      description,
      isbn,
      price,
      discount,
      pages,
      category,
      coverImage,
      images,
      stock,
      isNew,
      isBestseller,
      isFeatured,
      author: req.user._id,
      isApproved: false
    });

    await book.save();
    res.status(201).json({ success: true, data: book });

  } catch (error) {
    console.error('❌ Error in createBook:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};


// Get my books

exports.getMyBooks = async (req, res) => {
  try {
    const books = await Book.find({ author: req.user._id });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get a single book by ID (for the author)
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, author: req.user._id });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a book

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

     if (book.isApproved) {
      book.isApproved = false; // Mark for re-approval
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'isbn', 'price', 'discount',
      'pages', 'category', 'coverImage', 'images',
      'stock', 'isNew', 'isBestseller', 'isFeatured'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    await book.save();
    res.json({ success: true, data: book });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Delete a book

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found or not yours' });
    }

    // if book is not approved delete
    if (!book.isApproved) {
      await book.deleteOne();
      return res.json({ success: true, message: 'Book deleted successfully' });
    }

    // if book is approved pending delete
    if (book.isApproved && !book.pendingDelete) {
      book.pendingDelete = true;
      await book.save();
      return res.json({
        success: true,
        message: 'Delete request submitted. Waiting for admin approval.'
      });
    }

    
    return res.status(400).json({
      success: false,
      message: 'Delete request already pending.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process delete request' });
  }
};
