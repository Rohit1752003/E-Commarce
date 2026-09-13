const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID';
  }
  if (err.code === 11000) {
    statusCode = 409;
    message = 'User already exists';
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

export default errorHandler;
