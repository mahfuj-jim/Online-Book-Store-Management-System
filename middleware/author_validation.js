const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateAuthorData = (req, res, next) => {
    const { name, about, country } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!name || name === "") {
        errors.name = "Name is required";
    }

    if (!about || about === "") {
        errors.about = "About is required";
    }

    if (!country || country === "") {
        errors.country = "Country is required";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR, errors);
    }

    next();
}

const validateDisableAuthor = (req, res, next) => {
    const { authorId, disable } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin" || !decodedToken.admin.superAdmin) {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_RESPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!authorId) {
        errors.authorId = "Author ID is required";
    } else if (typeof authorId !== "string") {
        errors.authorId = "Author ID must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(authorId);
        if (!isIdValid) {
            errors.authorId = "Author Id is not valid"
        }
    }

    if(!('disable' in req.body)){
        errors.disable = "Disable is required";
    }else if (typeof disable !== "boolean") {
        errors.disable = "Disable must be a boolean value";
    }   

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_DISABLE_AUTHOR, errors);
    }

    next();
}

module.exports = { validateAuthorData, validateDisableAuthor };