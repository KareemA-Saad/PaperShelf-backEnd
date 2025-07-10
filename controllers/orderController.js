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

// Update payment status (Admin only)
const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;

        const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        const updatedOrder = await Order.findById(orderId)
            .populate('items.book', 'title author coverImage');

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: updatedOrder
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
};


// Get all orders (Admin only)
// const getAllOrders = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 20,
//             status,
//             paymentStatus,
//             paymentMethod,
//             search,
//             sortBy = 'createdAt',
//             sortOrder = 'desc'
//         } = req.query;

//         const skip = (parseInt(page) - 1) * parseInt(limit);
//         const sortDirection = sortOrder === 'asc' ? 1 : -1;

//         const matchStage = {};
//         if (status) matchStage.orderStatus = status;
//         if (paymentStatus) matchStage.paymentStatus = paymentStatus;
//         if (paymentMethod) matchStage.paymentMethod = paymentMethod;

//         const searchConditions = [];

//         if (search && search.trim() !== '') {
//             const regex = new RegExp(search.trim(), 'i');

//             searchConditions.push(
//                 { orderNumber: { $regex: regex } },
//                 { trackingNumber: { $regex: regex } },
//                 { notes: { $regex: regex } },
//                 { 'user.name': { $regex: regex } },
//                 { 'user.email': { $regex: regex } }
//             );
//         }

//         const pipeline = [
//             { $match: matchStage },
//             {
//                 $lookup: {
//                     from: 'users',
//                     localField: 'user',
//                     foreignField: '_id',
//                     as: 'user'
//                 }
//             },
//             { $unwind: '$user' },
//             {
//                 $lookup: {
//                     from: 'books',
//                     localField: 'items.book',
//                     foreignField: '_id',
//                     as: 'bookDetails'
//                 }
//             },
//         ];

//         if (searchConditions.length > 0) {
//             pipeline.push({
//                 $match: {
//                     $or: searchConditions
//                 }
//             });
//         }

//         pipeline.push(
//             { $sort: { [sortBy]: sortDirection } },
//             { $skip: skip },
//             { $limit: parseInt(limit) }
//         );

//         const orders = await Order.aggregate(pipeline);

//         // Count total documents (with same filters)
//         const countPipeline = [...pipeline.filter(stage => !('$skip' in stage) && !('$limit' in stage) && !('$sort' in stage))];
//         countPipeline.push({ $count: 'total' });
//         const countResult = await Order.aggregate(countPipeline);
//         const totalOrders = countResult[0]?.total || 0;
//         const totalPages = Math.ceil(totalOrders / parseInt(limit));

//         res.json({
//             success: true,
//             data: {
//                 orders,
//                 pagination: {
//                     currentPage: parseInt(page),
//                     totalPages,
//                     totalOrders,
//                     hasNextPage: parseInt(page) < totalPages,
//                     hasPrevPage: parseInt(page) > 1
//                 }
//             }
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching orders',
//             error: error.message
//         });
//     }
// };
// Get all orders (Admin only) - MODIFIED VERSION
const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            paymentMethod,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const filter = {};
        if (status) filter.orderStatus = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (paymentMethod) filter.paymentMethod = paymentMethod;

        if (search?.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { orderNumber: { $regex: regex } },
                { trackingNumber: { $regex: regex } },
                { notes: { $regex: regex } }
            ];
        }

        const totalOrders = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('items.book', '_id title coverImage')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const transformedOrders = orders.map(order => {
            const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const bookInfo = order.items.map(item => {
                const book = item.book || {};
                return {
                    bookId: book._id || null,
                    bookName: book.title || 'Unknown Book',
                    bookCoverImage: book.coverImage || null,
                    quantity: item.quantity,
                    priceAtTime: item.priceAtTime,
                    itemSubtotal: item.subtotal
                };
            });

            return {
                orderId: order._id,
                orderNumber: order.orderNumber,
                userName: order.user?.name || 'Unknown User',
                userEmail: order.user?.email || 'Unknown Email',
                quantityOfItemsPurchased: totalQuantity,
                subtotal: order.subtotal,
                shippingPrice: order.shippingCost,
                totalPrice: order.totalAmount,
                statusOfOrder: order.orderStatus,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                bookInfo: bookInfo,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            };
        });

        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.json({
            success: true,
            data: {
                orders: transformedOrders,
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
    updatePaymentStatus,
    getAllOrders
};
// Note: