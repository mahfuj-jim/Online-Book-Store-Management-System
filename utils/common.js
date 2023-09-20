const path = require("path");
const fsPromise = require("fs").promises;
const mongoose = require("mongoose");

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

const getCurrentDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const writeToLogFile = async (message) => {
  const logFilePath = path.join(__dirname, "..", "server", "server.log");
  const formattedMessage = `${getCurrentDateTime()} - ${message}\n`;

  return fsPromise.appendFile(logFilePath, formattedMessage, (err) => {
      if (err) {
          console.error("Error writing to log file:", err);
      }
  });
};

const discountQuery = (bookIds, authorIds) => {
  const query = {
    $and: [
      { validFrom: { $lte: new Date() } },
      { validTo: { $gte: new Date() } },
    ],
    $or: [
      { books: { $in: bookIds } },
      { authors: { $in: authorIds } },
    ],
  };

  return query;
}

const countBookDiscount = (books, discounts) => {
  const booksWithDiscounts = books.map((book) => {
    const discount = discounts.find((discount) => {
      return (
        discount.books.includes(book._id) ||
        discount.authors.includes(book.author._id)
      );
    });

    if (book instanceof mongoose.Document) {
      book = book.toObject()
    } 

    if (discount) {
      if (discount.discountPercentage) {
        const discountPrice = (book.price / 100) * discount.discountPercentage;
        return { ...book, discountPrice: book.price - discountPrice };
      } else if (discount.discountAmount) {
        return { ...book, discountPrice: book.price - discount.discountAmount };
      }
    } else {
      return book;
    }
  });

  return booksWithDiscounts;
}

module.exports = { sendResponse, getCurrentDateTime, writeToLogFile, discountQuery, countBookDiscount };
