require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const bookRoute = require("./routes/bookRoute");
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./middlewares/logger");
const { handleUploadError } = require("./middlewares/upload");
const wishlistRoute = require('./routes/wishlistRoute');
const reviewRoute = require('./routes/reviewRoute');
const cartRoute = require('./routes/cartRoute');
const orderRoute = require('./routes/orderRoute');
const checkoutRoute = require('./routes/checkoutRoute');
const app = express();
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4200'], // Common frontend dev ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger);

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/v1/auth", authRoute);

// User routes
app.use("/api/v1/users", userRoute);

// Book routes
app.use("/api/v1/books", bookRoute);

// Wishlist routes
app.use('/api/wishlist', wishlistRoute);

// Review routes
app.use('/api/reviews', reviewRoute);

// Cart routes
app.use('/api/cart', cartRoute);

// Order routes
app.use('/api/orders', orderRoute);

// Checkout routes
app.use('/api/checkout', checkoutRoute);

// Upload error handling middleware
app.use(handleUploadError);

// Error handling middleware (must be last)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
});

module.exports = app;
