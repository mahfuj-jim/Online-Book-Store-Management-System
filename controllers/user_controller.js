const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await UserModel.find(
        {},
        { createdAt: false, updatedAt: false, __v: false }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_ALL_USERS,
        users
      );
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new UserController();
