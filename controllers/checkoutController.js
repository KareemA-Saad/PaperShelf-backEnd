const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Book = require('../models/bookModel');
const { validateStockAvailability, reduceStockAfterPayment } = require('../utils/stockManager');
const {
    getUserCartWithBooks,
    validateCartNotEmpty,
    validateCartStockAvailability,
    prepareOrderItems,
    clearUserCart
} = require('../utils/cartUtils');

// Validate cart before checkout
const validateCheckout = async (req, res) => {
    try {
        const cart = await getUserCartWithBooks(req.user.id, 'title author price stock isAvailable');

        const cartValidation = validateCartNotEmpty(cart);
        if (!cartValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: cartValidation.message,
                data: {
                    isValid: false,
                    issues: [cartValidation.message]
                }
            });
        }

        const stockValidation = await validateCartStockAvailability(cart.items);

        // Calculate shipping cost
        const shippingCost = 50;
        const finalTotal = stockValidation.totalAmount + shippingCost;

        res.json({
            success: true,
            data: {
                isValid: stockValidation.isValid,
                cart: {
                    items: cart.items,
                    totalAmount: cart.totalAmount,
                    totalItems: cart.totalItems
                },
                checkout: {
                    subtotal: stockValidation.totalAmount,
                    shippingCost,
                    totalAmount: finalTotal
                },
                issues: stockValidation.issues,
                warnings: stockValidation.warnings
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error validating checkout',
            error: error.message
        });
    }
};

// Process the complete checkout
const processCheckout = async (req, res) => {
    try {
        const {
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes
        } = req.body;

        // Get user's cart
        const cart = await getUserCartWithBooks(req.user.id, 'title author price stock isAvailable');

        const cartValidation = validateCartNotEmpty(cart);
        if (!cartValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: cartValidation.message
            });
        }

        // Validate stock availability for all items (no stock reduction yet)
        const stockValidation = await validateStockAvailability(cart.items.map(item => ({
            book: item.book._id,
            quantity: item.quantity
        })));

        if (!stockValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Stock issues detected',
                data: {
                    issues: stockValidation.issues
                }
            });
        }

        // Prepare order items
        const orderItems = prepareOrderItems(cart.items);

        // Calculate totals
        const subtotal = cart.totalAmount;
        const shippingCost = 50;
        const totalAmount = subtotal + shippingCost;

        // Create order
        const order = new Order({
            user: req.user.id,
            items: orderItems,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            subtotal,
            shippingCost,
            totalAmount,
            paymentMethod,
            notes
        });

        await order.save();

        // Clear the cart
        await clearUserCart(req.user.id);

        // Populate order with book details for response
        const populatedOrder = await Order.findById(order._id)
            .populate('items.book', 'title author coverImage');

        res.status(201).json({
            success: true,
            message: 'Checkout completed successfully',
            data: {
                order: populatedOrder,
                orderNumber: order.orderNumber
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing checkout',
            error: error.message
        });
    }
};

// Handle payment processing
const processPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, paymentDetails } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // Simulate payment processing based on method
        let paymentResult = { success: false, message: '' };

        switch (paymentMethod) {
            case 'cash_on_delivery':
                paymentResult = {
                    success: true,
                    message: 'Cash on delivery payment confirmed',
                    paymentId: `COD-${Date.now()}`
                };
                break;

            case 'paypal':
                // Simulate PayPal payment processing
                if (paymentDetails && paymentDetails.paypalId) {
                    paymentResult = {
                        success: true,
                        message: 'PayPal payment processed successfully',
                        paymentId: paymentDetails.paypalId
                    };
                } else {
                    paymentResult = {
                        success: false,
                        message: 'PayPal payment details required'
                    };
                }
                break;

            default:
                paymentResult = {
                    success: false,
                    message: 'Unsupported payment method'
                };
        }

        if (paymentResult.success) {
            // Reduce stock after successful payment
            const stockReduction = await reduceStockAfterPayment(order.items);

            if (!stockReduction.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock reduction failed after payment',
                    data: {
                        errors: stockReduction.errors
                    }
                });
            }

            // Update order payment status
            order.paymentStatus = 'paid';
            order.paymentId = paymentResult.paymentId;
            order.orderStatus = 'confirmed';
            await order.save();

            const updatedOrder = await Order.findById(orderId)
                .populate('items.book', 'title author coverImage');

            res.json({
                success: true,
                message: 'Payment processed successfully',
                data: {
                    order: updatedOrder,
                    payment: paymentResult
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment failed',
                data: {
                    error: paymentResult.message
                }
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

// Get shipping options
const getShippingOptions = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.book', 'weight');

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    options: [],
                    message: 'Cart is empty'
                }
            });
        }

        // Calculate total weight (assuming books have weight property)
        const totalWeight = cart.items.reduce((weight, item) => {
            return weight + (item.book.weight || 0.5) * item.quantity; // Default 0.5kg per book
        }, 0);

        // Define shipping options based on weight and location
        const shippingOptions = [
            {
                id: 'standard',
                name: 'Standard Delivery',
                description: '5-7 business days',
                cost: 50,
                estimatedDays: '5-7'
            },
            {
                id: 'express',
                name: 'Express Delivery',
                description: '2-3 business days',
                cost: totalWeight > 2 ? 150 : 100,
                estimatedDays: '2-3'
            },
            {
                id: 'overnight',
                name: 'Overnight Delivery',
                description: 'Next business day',
                cost: totalWeight > 2 ? 300 : 200,
                estimatedDays: '1'
            }
        ];

        res.json({
            success: true,
            data: {
                options: shippingOptions,
                cartWeight: totalWeight,
                recommended: totalWeight > 2 ? 'standard' : 'express'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching shipping options',
            error: error.message
        });
    }
};

module.exports = {
    validateCheckout,
    processCheckout,
    processPayment,
    getShippingOptions
}; 