const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateCartData = (req, res, next) => {
    const { bookId, quantity } = req.body;
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

    if (!bookId || bookId === "") {
        errors.bookId = "Book Id must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(bookId);
        if (!isIdValid) {
            errors.bookId = "Book id is not valid"
        }
    }

    if (!quantity && quantity !== 0) {
        errors.quantity = "Quantity is required.";
    } else if (typeof quantity !== "number" || quantity < 1) {
        errors.quantity = "Quantity must be a number greater than or equal to 1";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_UPDATE_CART, errors);
    }

    next();
}

module.exports = { validateCartData };