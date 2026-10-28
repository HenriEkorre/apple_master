const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || 500
  res.status(statusCode).json({
    error: {
      message: err.message,
      status: statusCode
    }
  })
}

export default errorHandler