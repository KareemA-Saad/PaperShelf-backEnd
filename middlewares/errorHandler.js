// middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // For backend logging
  
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
    res.status(statusCode).json({
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : '🥞',
    });
  };
  
  module.exports = errorHandler;
  