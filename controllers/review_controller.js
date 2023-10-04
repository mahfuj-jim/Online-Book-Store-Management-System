const BookModel = require("../models/book_model");
const ReviewModel = require("../models/review_model");
const TransactionModel = require("../models/transaction_model");
const UserModel = require("../models/user_model");
const { sendResponse, writeToLogFile } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

class ReviewController {
  async getBookReview(req, res) {
    try {
      const bookId = req.params.id;
      const reviews = await ReviewModel.find({ book: bookId })
        .populate({
          path: "book",
          select: "title rating",
        })
        .populate({
          path: "user",
          select: "name",
        })
        .exec();

      writeToLogFile("Get Reviews: Successfull");
      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_REVIEW,
        reviews
      );
    } catch (err) {
      writeToLogFile("Failed Get Reviews: Internal Server Errro");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_REVIEW,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async addReview(req, res) {
    try {
      const requestBody = req.body;
      const decodedToken = decodeToken(req);
      const userId = decodedToken.user.id;
      let totalReview = 0;
      let totalRating = 0;

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        writeToLogFile("Error: Failed to Add Review - User not Found");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      const book = await BookModel.findOne({
        _id: requestBody.book,
        disable: false,
      });
      if (!book) {
        writeToLogFile("Error: Failed to Add Review - Book Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      const existingReview = await ReviewModel.findOne({
        user: userId,
        book: book._id,
      });
      if (existingReview) {
        writeToLogFile("Error: Failed to Add Review - Review Dont Exists");
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
          RESPONSE_MESSAGE.REVIEW_EXISTS
        );
      }

      const review = {
        user: userId,
        book: book._id,
        rating: requestBody.rating,
        review: requestBody.review,
      };

      const createdReview = await ReviewModel.create(review);
      if (!createdReview) {
        writeToLogFile("Error: Failed to Add Review - Internal Server Error");
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }

      const reviews = await ReviewModel.find({ book: requestBody.book }).exec();
      reviews.map((review) => {
        totalReview++;
        totalRating += review.rating;
      });

      book.rating = totalRating / totalReview;
      await book.save();

      writeToLogFile("Add Review: Successful");
      return sendResponse(
        res,
        STATUS_CODE.CREATED,
        RESPONSE_MESSAGE.ADD_REVIEW,
        createdReview
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Add Review - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editReview(req, res) {
    try {
      const requestBody = req.body;
      const decodedToken = decodeToken(req);
      const userId = decodedToken.user.id;
      let totalReview = 0;
      let totalRating = 0;

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      const isIdValid = mongoose.Types.ObjectId.isValid(requestBody.reviewId);
      if (!isIdValid) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
          RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
        );
      }

      const existingReview = await ReviewModel.findOne({
        _id: requestBody.reviewId,
      }).exec();
      if (!existingReview) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
          RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
        );
      }

      const book = await BookModel.findOne({
        _id: existingReview.book,
        disable: false,
      });
      if (!book) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      existingReview.review = requestBody.review;
      existingReview.rating = requestBody.rating;
      existingReview.time = new Date();
      await existingReview.save();

      const reviews = await ReviewModel.find({ book: existingReview.book });
      reviews.map((review) => {
        totalReview++;
        totalRating += review.rating;
      });

      book.rating = totalRating / totalReview;
      await book.save();

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.UPDATE_REVIEW,
        existingReview
      );
    } catch (err) {
      console.error(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteReview(req, res) {
    try {
      const { reviewId } = req.body;
      const decodedToken = decodeToken(req);
      let totalReview = 0;
      let totalRating = 0;

      if (!decodedToken.role === "user") {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const userId = decodedToken.user.id;

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      const isIdValid = mongoose.Types.ObjectId.isValid(reviewId);
      if (!isIdValid) {
        console.log("Invalid");
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
          RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
        );
      }

      const existingReview = await ReviewModel.findOne({ _id: reviewId });
      if (!existingReview) {
        console.log(reviewId);
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
          RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
        );
      }

      if (existingReview.user.toString() !== userId) {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const book = await BookModel.findOne({
        _id: existingReview.book,
        disable: false,
      });
      if (!book) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
          RESPONSE_MESSAGE.BOOK_DONT_EXISTS
        );
      }

      const deleteReview = await ReviewModel.findOneAndDelete({
        _id: reviewId,
      });
      if (!deleteReview) {
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }

      const reviews = await ReviewModel.find({ book: existingReview.book });
      if (!reviews || reviews.length === 0) {
        book.rating = undefined;
        await book.save();
      } else {
        reviews.map((review) => {
          totalReview++;
          totalRating += review.rating;
        });

        book.rating = totalRating / totalReview;
        await book.save();
      }

      return sendResponse(res, STATUS_CODE.OK, RESPONSE_MESSAGE.DELETE_REVIEW);
    } catch (err) {
      console.error(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new ReviewController();
