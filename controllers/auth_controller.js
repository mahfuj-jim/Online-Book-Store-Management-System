const AuthModel = require("../models/auth_model");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class AuthController {
  async signup(req, res) {
    try {
      const response = req.body;
      let id, token;

      const isEmailExists = await AuthModel.findOne({ email: response.email });
      if (isEmailExists) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
          RESPONSE_MESSAGE.EMAIL_ALREADY_EXISTS
        );
      }

      if (response.role === 2) {
        const user = {
          name: response.name,
          role: response.role,
          email: response.email,
          phoneNumber: response.phoneNumber,
        };

        const createdUser = await UserModel.create(user);
        console.log(createdUser);
        //const user = await UserModel.create(newInstance);
        // console.log(user);
      }

      console.log(response);
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthController();
