const AdminModel = require("../models/admin_models");
const AuthorModel = require("../models/author_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const { create } = require("../models/user_model");

class AuthorController {
  async addNewAuthor(req, res) {
    try {
      const response = req.body;

      const author = await AuthorModel.findOne({ name: response.name });
      if (author) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR,
          RESPONSE_MESSAGE.AUTHOR_NAME_EXISTS
        );
      }

      const createdAuthor = await AuthorModel.create(response);
      if (!createdAuthor) {
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
          STATUS_REPONSE.INTERNAL_SERVER_ERROR
        );
      }

      return sendResponse(
        res,
        STATUS_CODE.CREATED,
        RESPONSE_MESSAGE.AUTHOR_ADDED,
        {
            id: createdAuthor._id,
            name: createdAuthor.name,
            about: createdAuthor.about,
            country: createdAuthor.country
        }
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

module.exports = new AuthorController();
