const AuthorModel = require("../models/author_model");
const BookModel = require("../models/book_model");
const DiscountModel = require("../models/discount_model");
const {
  sendResponse,
  writeToLogFile,
  discountQuery,
  countBookDiscount,
} = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class BookController {
  async getAllBooks(req, res) {
    try {
      const { sortProperty } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortOrder = req.query.sortOrder || "asc";
      const genreFilter = req.query.genreFilter || "";
      const searchKey = req.query.searchKey || "";
      let bookIds = [];
      let authorIds = [];
      let uniqueAuthors = new Set();
      let sortStage = {};

      if (sortProperty) {
        if (
          sortProperty !== "price" ||
          sortProperty !== "rating" ||
          sortProperty !== "stock" ||
          sortProperty !== "totalSell" ||
          sortOrder !== "asc" ||
          sortOrder !== "desc"
        ) {
          if (sortOrder === "desc") {
            sortStage[sortProperty] = -1;
          } else {
            sortStage[sortProperty] = 1;
          }
        } else {
          writeToLogFile(
            "Error: Failed to Get All Books - Invalid Sort Property"
          );
          return sendResponse(
            res,
            STATUS_CODE.UNPROCESSABLE_ENTITY,
            RESPONSE_MESSAGE.FAILED_TO_GET_BOOKS,
            RESPONSE_MESSAGE.INVALID_SORT_PROPERTY
          );
        }
      }

      let aggregatePipeline = [
        {
          $lookup: {
            from: "authors",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $match: { "author.disable": false, disable: false },
        },
        {
          $match: {
            $or: [
              { title: { $regex: searchKey, $options: "i" } },
              { "author.name": { $regex: searchKey, $options: "i" } },
            ],
            genre: { $regex: genreFilter, $options: "i" },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            price: 1,
            genre: 1,
            country: 1,
            image: 1,
            "author._id": 1,
            "author.name": 1,
            "author.country": 1,
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ];

      if (Object.keys(sortStage).length > 0) {
        aggregationPipeline.push({
          $sort: sortStage,
        });
      }

      let books = await BookModel.aggregate(aggregatePipeline);

      books.map((book) => {
        bookIds.push(book._id);
        uniqueAuthors.add(book.author._id);
      });
      authorIds = Array.from(uniqueAuthors);

      const query = discountQuery(bookIds, authorIds);
      const discounts = await DiscountModel.find(query);
      const booksWithDiscounts = countBookDiscount(books, discounts);

      writeToLogFile("Get All Books: Successfully Get All Books");
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_MESSAGE.GET_ALL_BOOKS, {
        page: page,
        bookPerPage: limit,
        totalBooks: booksWithDiscounts.length,
        books: booksWithDiscounts,
      });
    } catch (err) {
      console.log(err);
      writeToLogFile("Error: Failed to Get All Books - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_BOOKS,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getBookById(req, res) {
    try {
      const bookId = req.params.id;
      let bookIds = [];
      let authorIds = [];

      const book = await BookModel.findOne(
        { _id: bookId, disable: false },
        { createdAt: false, updatedAt: false, __v: false, disable: false }
      )
        .populate("author", "_id name about country")
        .exec();

      console.log(book);

      const author = await AuthorModel.findOne({
        _id: book.author._id,
        disable: false,
      });
      if (!author) {
        writeToLogFile("Error: Failed to Book by ID - Book Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      bookIds.push(book._id);
      authorIds.push(book.author._id);

      const query = discountQuery(bookIds, authorIds);
      const discounts = await DiscountModel.find(query);
      const bookWithDiscounts = countBookDiscount([book], discounts);

      if (bookWithDiscounts.length !== 1) {
        writeToLogFile("Error: Failed to Book by ID - Internal Server Error");
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }

      writeToLogFile("Get Book by ID: Successfully Get Book by ID");
      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_BOOK,
        bookWithDiscounts[0]
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Book by ID - Internal Server Error");
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async addNewBook(req, res) {
    try {
      const requestBody = req.body;

      const book = await BookModel.findOne({ ISBN: requestBody.ISBN });
      if (book) {
        writeToLogFile("Error: Failed to Add Book - Book Exists");
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
          RESPONSE_MESSAGE.BOOK_EXISTS
        );
      }

      const author = await AuthorModel.findOne({ _id: requestBody.author });
      if (!author) {
        writeToLogFile("Error: Failed to Add Book - Author Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
          RESPONSE_MESSAGE.FAILED_TO_AUTHOR_DONT_EXISTSDD_AUTHOR
        );
      }

      const createdBook = await BookModel.create(requestBody);
      if (!createdBook) {
        writeToLogFile("Error: Failed to Add Book - Internal Server Error");
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }

      writeToLogFile("Add Book: Successfully Add New Book");
      return sendResponse(
        res,
        STATUS_CODE.CREATED,
        RESPONSE_MESSAGE.BOOK_ADDED,
        createdBook
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Add Book - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editBook(req, res) {
    try {
      const requestBody = req.body;

      const book = await BookModel.findOne({
        _id: requestBody.bookId,
        disable: false,
      });
      if (!book) {
        writeToLogFile("Error: Failed to Edit Book - Book Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      if (requestBody.author) {
        const author = await AuthorModel.findOne({ _id: requestBody.author });
        if (!author) {
          writeToLogFile("Error: Failed to Edit Book - Author Don't Exists");
          return sendResponse(
            res,
            STATUS_CODE.NOT_FOUND,
            RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
            RESPONSE_MESSAGE.AUTHOR_DONT_EXISTS
          );
        }
      }

      const updatedBook = await BookModel.findOneAndUpdate(
        { _id: requestBody.bookId },
        { $set: requestBody },
        { new: true }
      );

      if (!updatedBook) {
        writeToLogFile("Error: Failed to Edit Book - Internal Server Error");
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }

      writeToLogFile("Update Book: Successfull");
      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.BOOK_UPDATED,
        updatedBook
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Edit Book - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteBook(req, res) {
    try {
      const { bookId } = req.body;

      const book = await BookModel.findOne({ _id: bookId });
      if (!book) {
        writeToLogFile("Error: Failed to Delete Book - Book Don't Exist");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_BOOK,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      await BookModel.deleteOne({ _id: bookId });

      writeToLogFile("Delete Book: Successull");
      return sendResponse(res, STATUS_CODE.OK, RESPONSE_MESSAGE.BOOK_DELETED);
    } catch (err) {
      writeToLogFile("Error: Failed to Delete Book - Interal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DELETE_BOOK,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async disableBook(req, res) {
    try {
      const requestBody = req.body;

      const book = await BookModel.findOne(
        { _id: requestBody.bookId, disable: !requestBody.disable },
        { createdAt: false, updatedAt: false, __v: false }
      );
      if (!book) {
        writeToLogFile("Error: Failed to Disable Book - Book Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DISABLE_BOOK,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      book.disable = requestBody.disable;
      await book.save();

      writeToLogFile("Disable Book - Successfull");
      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.DISABLE_BOOK,
        book
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Disable Book - Interal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DISABLE_BOOK,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new BookController();
