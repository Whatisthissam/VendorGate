export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error('[VendorGate API Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    // Keep stack trace clean and safe for academic/demo presentations
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
