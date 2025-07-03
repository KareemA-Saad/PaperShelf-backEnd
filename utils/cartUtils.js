const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');

/**
 * Get user's cart with populated book details
 * @param {string} userId - User ID
 * @param {string} selectFields - Fields to select from book (default: 'title author price coverImage stock')
 * @returns {Promise<Object>} Cart object with populated items
 */
const getUserCartWithBooks = async (userId, selectFields = 'title author price coverImage stock') => {
    return await Cart.findOne({ user: userId })
        .populate({
            path: 'items.book',
            select: selectFields
        });
};

/**
 * Validate cart exists and has items
 * @param {Object} cart - Cart object
 * @returns {Object} Validation result with isValid and message
 */
const validateCartNotEmpty = (cart) => {
    if (!cart) {
        return {
            isValid: false,
            message: 'Cart not found'
        };
    }

    if (!cart.items || cart.items.length === 0) {
        return {
            isValid: false,
            message: 'Cart is empty'
        };
    }

    return {
        isValid: true,
        message: null
    };
};

/**
 * Check stock availability for cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Promise<Object>} Stock validation result
 */
const validateCartStockAvailability = async (cartItems) => {
    const issues = [];
    const warnings = [];
    let totalAmount = 0;

    for (const item of cartItems) {
        const book = item.book;

        // Check if book is available
        if (!book.isAvailable) {
            issues.push(`"${book.title}" is currently unavailable`);
            continue;
        }

        // Check stock availability
        if (book.stock < item.quantity) {
            issues.push(`"${book.title}" - Only ${book.stock} copies available (requested: ${item.quantity})`);
            continue;
        }

        // Check if stock is low
        if (book.stock < 5) {
            warnings.push(`"${book.title}" - Low stock (${book.stock} copies remaining)`);
        }

        totalAmount += item.priceAtTime * item.quantity;
    }

    return {
        isValid: issues.length === 0,
        issues,
        warnings,
        totalAmount
    };
};

/**
 * Prepare order items from cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Array} Array of order items
 */
const prepareOrderItems = (cartItems) => {
    return cartItems.map(item => ({
        book: item.book._id,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        subtotal: item.priceAtTime * item.quantity
    }));
};

/**
 * Clear user's cart
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated cart
 */
const clearUserCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
        cart.items = [];
        await cart.save();
    }
    return cart;
};

module.exports = {
    getUserCartWithBooks,
    validateCartNotEmpty,
    validateCartStockAvailability,
    prepareOrderItems,
    clearUserCart
}; 