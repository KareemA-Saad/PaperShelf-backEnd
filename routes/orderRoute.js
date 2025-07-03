const express = require('express');
const router = express.Router();
const {
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders
} = require('../controllers/orderController');
const authenticateUser = require('../middlewares/authenticateUser');
const authorizeRoles = require('../middlewares/authorizeRoles');
const validate = require('../middlewares/validate');
const { updateOrderStatusSchema } = require('../utils/validationSchemas');

// All order routes require authentication
router.use(authenticateUser);

// User order routes
// Note: Order creation is now handled by POST /api/checkout/process

// GET /api/orders - Get user's order history
router.get('/', getUserOrders);

// GET /api/orders/:orderId - Get specific order details
router.get('/:orderId', getOrderById);

// Admin only routes
// PUT /api/orders/:orderId/status - Update order status (Admin only)
router.put('/:orderId/status',
    authorizeRoles('admin'),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

// GET /api/orders/admin/all - Get all orders (Admin only)
router.get('/admin/all', authorizeRoles('admin'), getAllOrders);

module.exports = router; 