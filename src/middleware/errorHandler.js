// Global error handler
// middleware/errorHandler.js

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
};
