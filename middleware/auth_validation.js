const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

const validateAdminSignup = (req, res, next) => {
    const { email, password, name, secretId, superAdmin } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (!decodedToken.admin || !decodedToken.admin.superAdmin) {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_RESPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!email || email === "") {
        errors.email = "Email is required";
    } else if (!email.includes("@") && !email.includes(".")) {
        errors.email = "Invalid Email";
    }

    if (!password || password === "") {
        errors.password = "Password is required";
    } else if (
        !/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(
            password
        )
    ) {
        errors.password =
            "Password must be at least 8 characters long and include at least one capital letter, one small letter, one special character, and one number.";
    }

    if (!name || typeof name !== "string") {
        errors.name = !name ? "Name is required" : "Name must be a string";
    }

    if (!secretId || typeof secretId !== "string") {
        errors.secretId = !secretId ? "Secret ID is required" : "Secret ID must be a string";
    }

    if (typeof superAdmin !== "boolean") {
        errors.superAdmin = "SuperAdmin must be a boolean";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

const validateUserSignup = (req, res, next) => {
    const { role, email, password, name, phoneNumber, address } = req.body;
    const errors = {};

    if (role !== 2) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, RESPONSE_MESSAGE.INVALID_ROLE);
    }

    if (!email || email === "") {
        errors.email = "Email is required";
    } else if (!email.includes("@") && !email.includes(".")) {
        errors.email = "Invalid Email";
    }

    if (!password || password === "") {
        errors.password = "Password is required";
    } else if (
        !/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(
            password
        )
    ) {
        errors.password =
            "Password must be at least 8 characters long and include at least one capital letter, one small letter, one special character, and one number.";
    }

    if (!name || typeof name !== "string") {
        errors.name = !name ? "Name is required" : "Name must be a string";
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
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = {};

    if (!email || email === "") {
        errors.email = "Email is required";
    }

    if (!password || password === "") {
        errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_LOGIN, errors);
    }

    next();
}

module.exports = {
    validateAdminSignup,
    validateUserSignup,
    validateLogin
};