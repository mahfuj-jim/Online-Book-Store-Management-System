const sendResponse = (res, statusCode, message, result = null) => {
  const response = {};
  if (statusCode >= 400) {
    response.success = false;
    response.message = message;
    response.error = result;
  } else {
    response.success = true;
    response.message = message;
    response.data = result;
  }

  res.status(statusCode).send(response);
};

module.exports = { sendResponse };
