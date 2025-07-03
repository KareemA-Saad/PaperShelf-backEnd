const express = require('express');
const router = express.Router();
const {
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartRecommendations
} = require('../controllers/cartController');
const authenticateUser = require('../middlewares/authenticateUser');
const validate = require('../middlewares/validate');
const { addToCartSchema, updateCartItemSchema } = require('../utils/validationSchemas');

// All cart routes require authentication
router.use(authenticateUser);

// GET /api/cart - Get user's cart
router.get('/', getUserCart);

// POST /api/cart/add - Add item to cart
router.post('/add', validate(addToCartSchema), addToCart);

// PUT /api/cart/update - Update item quantity
router.put('/update', validate(updateCartItemSchema), updateCartItem);

// DELETE /api/cart/remove/:itemId - Remove specific item
router.delete('/remove/:itemId', removeFromCart);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', clearCart);

// GET /api/cart/recommendations - Get AI recommendations
router.get('/recommendations', getCartRecommendations);

module.exports = router; 