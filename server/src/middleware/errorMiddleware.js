import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  if (env.NODE_ENV === 'development') {
    console.error(`\x1b[31m[Error Handler]\x1b[0m`, err);
  }

  // Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'User with this email already exists.',
      errors: err.keyValue
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages
    });
  }

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: env.NODE_ENV === 'production' ? null : err.stack,
  });
};
