const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateReviewData = (req, res, next) => {
    const { book, review, rating } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "user") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!book) {
        errors.book = "Book is required";
    } else if (typeof book !== "string") {
        errors.book = "Book must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(book);
        if (!isIdValid) {
            errors.book = "Book is not valid"
        }
    }

    if (!review || typeof review !== "string") {
        errors.review = !review ? "Review is required" : "Review must be a string";
    }

    if (!rating && rating !== 0) {
        errors.rating = "Rating is required";
    } else if (typeof rating !== "number" || rating < 1 || rating > 5 || rating % 1 !== 0) {
        errors.rating = "Rating must be a whole number between 1 and 5";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW, errors);
    }

    next();
}

const validateUpdateReviewData = (req, res, next) => {
    const { reviewId, review, rating } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "user") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!reviewId) {
        errors.reviewId = "Review ID is required";
    } else if (typeof reviewId !== "string") {
        errors.reviewId = "Review Id must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(reviewId);
        if (!isIdValid) {
            errors.reviewId = "Review ID is not valid"
        }
    }

    if (review && (!review || typeof review !== "string")) {
        errors.review = !review ? "Review is required" : "Review must be a string";
    }

    if (rating && (!rating && rating !== 0)) {
        errors.rating = "Rating is required";
    } else if (rating && (typeof rating !== "number" || rating < 1 || rating > 5 || rating % 1 !== 0)) {
        errors.rating = "Rating must be a whole number between 1 and 5";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW, errors);
    }

    next();
}

module.exports = { validateReviewData, validateUpdateReviewData };