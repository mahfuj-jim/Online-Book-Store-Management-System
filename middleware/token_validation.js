const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

function validateToken(req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    const token = authHeader.substring(7);

    try {
        const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (verifyToken) {
            next();
        } else {
            throw new Error();
        }
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return sendResponse(
                res,
                STATUS_CODE.UNAUTHORIZED,
                STATUS_REPONSE.UNAUTHORIZED,
                RESPONSE_MESSAGE.TOKEN_EXPIRE
            );
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return sendResponse(
                res,
                STATUS_CODE.UNAUTHORIZED,
                STATUS_REPONSE.UNAUTHORIZED,
                RESPONSE_MESSAGE.UNAUTHORIZED
            );
        }
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }
}

module.exports = {
    validateToken,
};