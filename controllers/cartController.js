const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');

// Get user's cart
const getUserCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate({
                path: 'items.book',
                select: 'title author price coverImage stock isAvailable'
            });

        if (!cart) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                }
            });
        }

        // Check stock availability for each item
        const itemsWithAvailability = cart.items.map(item => ({
            _id: item._id,
            book: item.book,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            subtotal: item.priceAtTime * item.quantity,
            isAvailable: item.book.stock >= item.quantity, // Check real-time availability
            stockStatus: item.book.stock === 0 ? 'out_of_stock' :
                item.book.stock < 5 ? 'low_stock' : 'in_stock',
            availableStock: item.book.stock // Real-time available stock
        }));

        res.json({
            success: true,
            data: {
                items: itemsWithAvailability,
                totalAmount: cart.totalAmount,
                totalItems: cart.totalItems
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { bookId, quantity = 1 } = req.body;

        // Validate quantity is positive
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Check if book exists and has sufficient stock
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        if (book.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${book.stock} copies available (requested: ${quantity})`,
                availableStock: book.stock,
                requestedQuantity: quantity
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        // Check if book already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.book.toString() === bookId
        );

        if (existingItemIndex > -1) {
            // Check if new total quantity exceeds limit
            const newTotalQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newTotalQuantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add ${quantity} more. Maximum 10 items per book allowed (current: ${cart.items[existingItemIndex].quantity})`,
                    currentInCart: cart.items[existingItemIndex].quantity,
                    requestedQuantity: quantity,
                    maxAllowed: 10
                });
            }
            // Update existing item
            cart.items[existingItemIndex].quantity = newTotalQuantity;
        } else {
            // Validate quantity doesn't exceed maximum for new items
            if (quantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 10 items per book allowed',
                    maxAllowed: 10,
                    requestedQuantity: quantity
                });
            }
            // Add new item
            cart.items.push({
                book: bookId,
                quantity: quantity,
                priceAtTime: book.price
            });
        }

        await cart.save();

        // Return updated cart
        const updatedCart = await Cart.findOne({ user: req.user.id })
            .populate('items.book', 'title author price coverImage stock');

        res.json({
            success: true,
            message: 'Item added to cart',
            data: {
                items: updatedCart.items,
                totalAmount: updatedCart.totalAmount,
                totalItems: updatedCart.totalItems
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
};

// Update item quantity
const updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;

        // Validate quantity is positive
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Validate quantity doesn't exceed maximum per book
        if (quantity > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 items per book allowed',
                maxAllowed: 10,
                requestedQuantity: quantity
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        const currentQuantity = cart.items[itemIndex].quantity;
        const quantityDifference = quantity - currentQuantity;

        // If quantity is being increased, check stock availability
        if (quantityDifference > 0) {
            const book = await Book.findById(cart.items[itemIndex].book);
            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found'
                });
            }

            if (book.stock < quantityDifference) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot increase quantity. Only ${book.stock} more copies available (requested increase: ${quantityDifference})`,
                    availableStock: book.stock,
                    requestedIncrease: quantityDifference,
                    currentInCart: currentQuantity
                });
            }
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user.id })
            .populate('items.book', 'title author price coverImage stock');

        res.json({
            success: true,
            message: 'Cart updated',
            data: {
                items: updatedCart.items,
                totalAmount: updatedCart.totalAmount,
                totalItems: updatedCart.totalItems
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating cart',
            error: error.message
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemToRemove = cart.items.find(item => item._id.toString() === itemId);
        if (!itemToRemove) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();

        const updatedCart = await Cart.findOne({ user: req.user.id })
            .populate('items.book', 'title author price coverImage stock');

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                items: updatedCart.items || [],
                totalAmount: updatedCart.totalAmount,
                totalItems: updatedCart.totalItems
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.json({
                success: true,
                message: 'Cart already empty',
                data: {
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                }
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            data: {
                items: [],
                totalAmount: 0,
                totalItems: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

// Get cart recommendations
const getCartRecommendations = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.book', 'category author');

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    recommendations: [],
                    message: 'Add books to your cart to get personalized recommendations'
                }
            });
        }

        // Extract categories and authors from cart items
        const categories = [...new Set(cart.items.map(item => item.book.category))];
        const authors = [...new Set(cart.items.map(item => item.book.author))];
        const bookIdsInCart = cart.items.map(item => item.book._id);

        // Find recommendations based on categories and authors
        const recommendations = await Book.find({
            $and: [
                { _id: { $nin: bookIdsInCart } }, // Exclude books already in cart
                {
                    $or: [
                        { category: { $in: categories } },
                        { author: { $in: authors } }
                    ]
                },
                { stock: { $gt: 0 } } // Only recommend available books
            ]
        })
            .select('title author price coverImage category averageRating')
            .limit(6)
            .sort({ averageRating: -1, totalSales: -1 });

        res.json({
            success: true,
            data: {
                recommendations,
                basedOn: {
                    categories,
                    authors
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching recommendations',
            error: error.message
        });
    }
};

module.exports = {
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartRecommendations
}; 