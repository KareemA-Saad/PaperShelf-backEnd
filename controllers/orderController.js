const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');
const { validateStockAvailability } = require('../utils/stockManager');


// Get user's order history
const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = { user: req.user.id };
        if (status) {
            filter.orderStatus = status;
        }

        const orders = await Order.find(filter)
            .populate('items.book', 'title author coverImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalOrders,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get specific order details
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        }).populate('items.book', 'title author coverImage description');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus, trackingNumber, notes } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update fields
        if (orderStatus) {
            order.orderStatus = orderStatus;

            // Set deliveredAt when status changes to delivered
            if (orderStatus === 'delivered') {
                order.deliveredAt = new Date();
            }
        }

        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        if (notes) {
            order.notes = notes;
        }

        await order.save();

        const updatedOrder = await Order.findById(orderId)
            .populate('items.book', 'title author coverImage');

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = {};
        if (status) filter.orderStatus = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('items.book', 'title author')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalOrders,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

module.exports = {
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders
}; 
// Note: