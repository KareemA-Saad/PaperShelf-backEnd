const express = require("express");
const router = express.Router();
const { client } = require("../config/paypal");
const paypal = require("@paypal/checkout-server-sdk");

// Route to create a PayPal order
router.post("/create-order", async (req, res) => {
  // Build the order request body
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD", // You can make this dynamic
          value: req.body.amount, // Amount should come from the client
        },
      },
    ],
  });

  try {
    // Create the order with PayPal
    const order = await client().execute(request);
    // Send the order ID to the client
    res.json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to capture a PayPal order after approval
router.post("/capture-order/:orderId", async (req, res) => {
  const orderId = req.body.orderID; // Order ID from the client
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    // Capture the order payment
    const capture = await client().execute(request);
    // Send the capture result to the client
    res.json({ capture: capture.result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
