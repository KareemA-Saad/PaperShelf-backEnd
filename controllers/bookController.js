const Book = require('../models/bookModel');
const Cart = require('../models/cartModel');
const { generateFileUrl, deleteFile } = require('../middlewares/upload');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Get all books with filtering, sorting, and pagination
const getAllBooks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sort = 'createdAt',
            order = 'desc',
            category,
            author,
            minPrice,
            maxPrice,
            rating,
            inStock,
            discount
        } = req.query;

        // Build filter object
        const filter = {};

        if (category) filter.category = category;
        if (author) {
            // Support comma-separated list for multi-author search
            const authors = author.split(',').map(a => a.trim());
            filter.author = { $in: authors.map(a => new RegExp(a, 'i')) };
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (rating) filter.averageRating = { $gte: parseFloat(rating) };
        if (inStock === 'true') filter.stock = { $gt: 0 };
        if (discount) filter.discount = { $gt: 0 };

        // Build sort object
        const sortObj = {};
        sortObj[sort] = order === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const books = await Book.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalBooks = await Book.countDocuments(filter);
        const totalPages = Math.ceil(totalBooks / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBooks,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Search books
const searchBooks = async (req, res) => {
    try {
        const { q, page = 1, limit = 20, searchIn = ['title', 'author', 'description'] } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Build search query based on searchIn fields
        const searchQuery = {
            $or: []
        };

        if (searchIn.includes('title')) {
            searchQuery.$or.push({ title: { $regex: q, $options: 'i' } });
        }
        if (searchIn.includes('author')) {
            searchQuery.$or.push({ author: { $regex: q, $options: 'i' } });
        }
        if (searchIn.includes('description')) {
            searchQuery.$or.push({ description: { $regex: q, $options: 'i' } });
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute search
        const books = await Book.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalBooks = await Book.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalBooks / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBooks,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Book.distinct('category');

        // Get book count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Book.countDocuments({ category });
                return {
                    name: category,
                    bookCount: count
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                categories: categoriesWithCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get featured books
const getFeaturedBooks = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const books = await Book.find({ isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                books
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ADMIN FUNCTIONS

// Create a new book (Admin only)
const createBook = async (req, res) => {
    try {
        const bookData = { ...req.body };

        if (!req.file && !req.body.coverImage && !req.body.coverImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Cover image is required. Please upload a file or provide a URL.'
            });
        }

        // Handle cover image - either uploaded file or URL
        if (req.file) {
            // File was uploaded via Multer
            bookData.coverImage = generateFileUrl(req.file.filename);
        } else if (req.body.coverImageUrl) {
            // URL was provided directly
            bookData.coverImage = req.body.coverImageUrl;
        }

        // Handle additional images (if any)
        if (req.files && req.files.length > 0) {
            bookData.images = req.files.map(file => generateFileUrl(file.filename));
        } else if (req.body.imageUrls) {
            // Handle array of URLs
            const imageUrls = Array.isArray(req.body.imageUrls)
                ? req.body.imageUrls
                : [req.body.imageUrls];
            bookData.images = imageUrls.filter(url => url && url.trim() !== '');
        }

        // Create the book
        const book = await Book.create(bookData);

        res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: {
                book
            }
        });

    } catch (error) {
        // If book creation fails, delete uploaded files
        if (req.file) {
            deleteFile(req.file.filename);
        }
        if (req.files) {
            req.files.forEach(file => deleteFile(file.filename));
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get book by ID
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Stock info and warning
        let stockStatus = 'in_stock';
        let stockWarning = null;
        if (book.stock === 0) {
            stockStatus = 'out_of_stock';
        } else if (book.stock <= 5) {
            stockStatus = 'low_stock';
            stockWarning = `Only ${book.stock} left in stock!`;
        }

        res.status(200).json({
            success: true,
            data: {
                book,
                stock: book.stock,
                stockStatus,
                stockWarning
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get book by ID with cart information (for authenticated users)
const getBookByIdWithCart = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Stock info and warning
        let stockStatus = 'in_stock';
        let stockWarning = null;
        if (book.stock === 0) {
            stockStatus = 'out_of_stock';
        } else if (book.stock <= 5) {
            stockStatus = 'low_stock';
            stockWarning = `Only ${book.stock} left in stock!`;
        }

        // Get user's cart to check if book is already in cart
        let cartInfo = null;
        if (req.user) {
            const cart = await Cart.findOne({ user: req.user.id });
            if (cart) {
                const cartItem = cart.items.find(item =>
                    item.book.toString() === req.params.id
                );
                if (cartItem) {
                    cartInfo = {
                        inCart: true,
                        quantity: cartItem.quantity,
                        priceAtTime: cartItem.priceAtTime
                    };
                } else {
                    cartInfo = {
                        inCart: false,
                        quantity: 0
                    };
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                book,
                cartInfo,
                stock: book.stock,
                stockStatus,
                stockWarning
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update book (Admin only)
const updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const updateData = { ...req.body };

        // Handle cover image update
        if (req.file) {
            // Delete old cover image file if it exists
            if (book.coverImage && book.coverImage.includes('/uploads/')) {
                const oldFilename = book.coverImage.split('/').pop();
                deleteFile(oldFilename);
            }
            // Set new cover image
            updateData.coverImage = generateFileUrl(req.file.filename);
        } else if (req.body.coverImageUrl) {
            // Delete old cover image file if it exists
            if (book.coverImage && book.coverImage.includes('/uploads/')) {
                const oldFilename = book.coverImage.split('/').pop();
                deleteFile(oldFilename);
            }
            // Set new cover image URL
            updateData.coverImage = req.body.coverImageUrl;
        }

        // Handle additional images update
        if (req.files && req.files.length > 0) {
            // Delete old image files if they exist
            if (book.images && book.images.length > 0) {
                book.images.forEach(imageUrl => {
                    if (imageUrl.includes('/uploads/')) {
                        const oldFilename = imageUrl.split('/').pop();
                        deleteFile(oldFilename);
                    }
                });
            }
            // Set new images
            updateData.images = req.files.map(file => generateFileUrl(file.filename));
        } else if (req.body.imageUrls) {
            // Delete old image files if they exist
            if (book.images && book.images.length > 0) {
                book.images.forEach(imageUrl => {
                    if (imageUrl.includes('/uploads/')) {
                        const oldFilename = imageUrl.split('/').pop();
                        deleteFile(oldFilename);
                    }
                });
            }
            // Set new image URLs
            const imageUrls = Array.isArray(req.body.imageUrls)
                ? req.body.imageUrls
                : [req.body.imageUrls];
            updateData.images = imageUrls.filter(url => url && url.trim() !== '');
        }

        // Update the book
        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Book updated successfully',
            data: {
                book: updatedBook
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete book (Admin only)
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Delete associated image files
        if (book.coverImage && book.coverImage.includes('/uploads/')) {
            const filename = book.coverImage.split('/').pop();
            deleteFile(filename);
        }

        if (book.images && book.images.length > 0) {
            book.images.forEach(imageUrl => {
                if (imageUrl.includes('/uploads/')) {
                    const filename = imageUrl.split('/').pop();
                    deleteFile(filename);
                }
            });
        }

        // Delete the book
        await Book.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Book deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Toggle featured status (Admin only)
const toggleFeatured = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Toggle featured status
        book.isFeatured = !book.isFeatured;
        await book.save();

        res.status(200).json({
            success: true,
            message: `Book ${book.isFeatured ? 'added to' : 'removed from'} featured list`,
            data: {
                book
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//generateBookSummary
const axios = require('axios');
const getFormattedSummary = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const { isbn, title } = book;

    // 🔍 Get book description
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(googleUrl);
    const data = await response.json();

    const item = data.items?.[0];
    const description = item?.volumeInfo?.description || 'No description available.';
    const author = item?.volumeInfo?.authors?.[0] || 'Unknown Author';

    // ✏️ Create full prompt
    const prompt = `
📘 AI Summary
“${title}” by ${author}

Write a long, in-depth summary of the book below that explains the key points, main storyline, and overall themes.

Book Description:
${description}
    `.trim();

    // 🔁 Send to Hugging Face Model
     const hfRes = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const result = await hfRes.json();

    const summary = result[0]?.summary_text || 'No summary generated';

    return res.json({ summary });
  } catch (error) {
    console.error('AI Summary Error:', error.message);
    return res.status(500).json({ message: 'Failed to generate summary' });
  }
};


module.exports = {
    getAllBooks,
    searchBooks,
    getCategories,
    getFeaturedBooks,
    createBook,
    getBookById,
    getBookByIdWithCart,
    updateBook,
    deleteBook,
    toggleFeatured, 
    getFormattedSummary
    
};
// Note: Ensure that the deleteFile function is implemented in your upload middleware to handle file deletions properly.