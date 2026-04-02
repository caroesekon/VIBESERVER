const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({
    field: err.param,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    errors: extractedErrors,
  });
};

module.exports = { validate };