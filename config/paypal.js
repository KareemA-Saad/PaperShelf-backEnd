require("dotenv").config(); 
// Import the PayPal SDK
const paypal = require("@paypal/checkout-server-sdk");

// Function to create the PayPal environment (Sandbox for testing)
function environment() {
  // Get credentials from environment variables for security
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  // Use SandboxEnvironment for testing, LiveEnvironment for production
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// Function to create and return a PayPal client instance
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Export the client function for use in routes
module.exports = { client };
