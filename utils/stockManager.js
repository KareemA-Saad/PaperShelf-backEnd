const Book = require('../models/bookModel');

/**
 * Reduce stock for order items after successful payment
 * @param {Array} orderItems - Array of order items with book ID and quantity
 * @returns {Promise<Object>} - Result with success status and any errors
 */
const reduceStockAfterPayment = async (orderItems) => {
    try {
        const results = [];
        const errors = [];

        for (const item of orderItems) {
            try {
                // Use findOneAndUpdate to atomically reduce stock
                const result = await Book.findOneAndUpdate(
                    {
                        _id: item.book,
                        stock: { $gte: item.quantity } // Only update if stock is sufficient
                    },
                    {
                        $inc: { stock: -item.quantity } // Reduce the stock
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                if (!result) {
                    errors.push(`Book ${item.book}: Insufficient stock available (requested: ${item.quantity})`);
                } else {
                    results.push({
                        bookId: item.book,
                        quantity: item.quantity,
                        newStock: result.stock
                    });
                }
            } catch (error) {
                errors.push(`Book ${item.book}: ${error.message}`);
            }
        }

        return {
            success: errors.length === 0,
            results,
            errors
        };
    } catch (error) {
        return {
            success: false,
            results: [],
            errors: [error.message]
        };
    }
};

/**
 * Validate stock availability for order items (without reducing stock)
 * @param {Array} orderItems - Array of order items with book ID and quantity
 * @returns {Promise<Object>} - Result with validation status and any issues
 */
const validateStockAvailability = async (orderItems) => {
    try {
        const issues = [];
        const validItems = [];

        for (const item of orderItems) {
            try {
                const book = await Book.findById(item.book);
                if (!book) {
                    issues.push(`Book ${item.book}: Book not found`);
                    continue;
                }

                if (book.stock < item.quantity) {
                    issues.push(`"${book.title}": Only ${book.stock} copies available (requested: ${item.quantity})`);
                } else {
                    validItems.push({
                        bookId: item.book,
                        bookTitle: book.title,
                        quantity: item.quantity,
                        availableStock: book.stock
                    });
                }
            } catch (error) {
                issues.push(`Book ${item.book}: ${error.message}`);
            }
        }

        return {
            isValid: issues.length === 0,
            validItems,
            issues
        };
    } catch (error) {
        return {
            isValid: false,
            validItems: [],
            issues: [error.message]
        };
    }
};

module.exports = {
    reduceStockAfterPayment,
    validateStockAvailability
}; 