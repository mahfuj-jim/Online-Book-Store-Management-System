const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateEditUser = (req, res, next) => {
    const { email, name, phoneNumber, address, disable, balance } = req.body;
    const errors = {};

    if (disable || balance) {
        return sendResponse(
            res,
            STATUS_CODE.UNPROCESSABLE_ENTITY,
            RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
            STATUS_RESPONSE.UNPROCESSABLE_ENTITY
        );
    }

    if (email) {
        errors.email = "Email is not modifieble"
    }

    if (name && typeof name !== "string") {
        errors.name = "Name must be a string";
    }

    if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
        errors.phoneNumber = "Phone number must be 11 digits long";
    }

    if (address) {
        const { district, area, houseNumber } = address;

        if (!district || district === "") {
            errors.address = "District is required";
        }
        if (!area || area === "") {
            errors.address = "Area is required";
        }
        if (!houseNumber || houseNumber === "") {
            errors.address = "House number is required";
        }
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER, errors);
    }

    next();
}

const validateDisableUser = (req, res, next) => {
    const { userId, disable } = req.body;
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

    if (!userId) {
        errors.userId = "User ID is required";
    } else if (typeof userId !== "string") {
        errors.userId = "User ID must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(userId);
        if (!isIdValid) {
            errors.userId = "User Id is not valid"
        }
    }

    if(!('disable' in req.body)){
        errors.disable = "Disable is required";
    }else if (typeof disable !== "boolean") {
        errors.disable = "Disable must be a boolean value";
    }   

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_DISABLE_USER, errors);
    }

    next();
}

module.exports = {
    validateEditUser,
    validateDisableUser
};