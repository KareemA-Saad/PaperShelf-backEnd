const express = require('express');
const router = express.Router();
const authenticateUser = require('../middlewares/authenticateUser');
const validate = require('../middlewares/validate');
const {
    validateCheckoutSchema,
    processCheckoutSchema,
    processPaymentSchema
} = require('../utils/validationSchemas');
const {
    validateCheckout,
    processCheckout,
    processPayment,
    getShippingOptions
} = require('../controllers/checkoutController');

// All checkout routes require authentication
router.use(authenticateUser);

// Validate cart before checkout
router.post('/validate', validateCheckout);

// Get shipping options
router.get('/shipping-options', getShippingOptions);

// Process checkout (create order)
router.post('/process', validate(processCheckoutSchema), processCheckout);

// Process payment for existing order
router.post('/payment', validate(processPaymentSchema), processPayment);

module.exports = router; 