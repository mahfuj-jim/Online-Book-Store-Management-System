const AuthModel = require("../models/auth_model");
const AdminModel = require("../models/admin_models");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const {
  generateAdminToken,
  generateUserToken,
} = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const bcrypt = require("bcrypt");

class AuthController {
  async signup(req, res) {
    try {
      const response = req.body;
      let id, token, responseData;

      const isEmailExists = await AuthModel.findOne({ email: response.email });
      if (isEmailExists) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
          RESPONSE_MESSAGE.EMAIL_ALREADY_EXISTS
        );
      }

      if (response.role === 1) {
        const admin = {
          name: response.name,
          role: response.role,
          email: response.email,
          secretId: response.secretId,
          superAdmin: response.superAdmin,
        };

        const createdAdmin = await AdminModel.create(admin);
        if (!createdAdmin) {
          return sendResponse(
            res,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
            STATUS_REPONSE.INTERNAL_SERVER_ERROR
          );
        }

        id = createdAdmin._id;
        token = generateAdminToken(createdAdmin);
        responseData = {
          id: id,
          email: response.email,
          name: response.name,
          secretId: response.secretId,
          superAdmin: response.superAdmin,
        };
      } else if (response.role === 2) {
        const user = {
          name: response.name,
          role: response.role,
          email: response.email,
          phoneNumber: response.phoneNumber,
        };

        const createdUser = await UserModel.create(user);
        if (!createdUser) {
          return sendResponse(
            res,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
            STATUS_REPONSE.INTERNAL_SERVER_ERROR
          );
        }

        id = createdUser._id;
        token = generateUserToken(createdUser);
        responseData = {
          id: id,
          email: response.email,
          name: response.name,
          phoneNumber: response.phoneNumber,
        };
      }

      const hashedPassword = await bcrypt.hash(response.password, 10);
      const auth = {
        email: response.email,
        password: hashedPassword,
        verified: true,
        role: response.role,
        admin: response.role === 1 ? id : null,
        user: response.role === 2 ? id : null,
        lastLoginDate: new Date(),
      };

      const createdAuth = await AuthModel.create(auth);
      if (!createdAuth) {
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
        RESPONSE_MESSAGE.SIGNUP_SUCCESSFUL,
        {
          accessToken: token,
          data: responseData,
        }
      );
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

  async login(req, res) {
    try {
      const { email, password } = req.body;
      let responseData, token;

      const auth = await AuthModel.findOne({ email })
        .populate("admin")
        .populate("user")
        .exec();
      if (!auth) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          RESPONSE_MESSAGE.EMAIL_DOESNT_EXIST
        );
      }

      if (!auth.verified) {
        return sendResponse(
          res,
          STATUS_CODE.FORBIDDEN,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          RESPONSE_MESSAGE.ACCOUNT_NOT_VERIFIED
        );
      }

      if (auth.blockUntil && auth.blockUntil > new Date()) {
        const remainingTimeInSeconds = Math.ceil(
          (auth.blockUntil - new Date()) / 1000
        );
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          `Account is blocked. Try again in ${remainingTimeInSeconds} seconds.`
        );
      }

      const isPasswordValid = await bcrypt.compare(password, auth.password);
      if (!isPasswordValid) {
        auth.loginAttempts = (auth.loginAttempts || 0) + 1;

        if (auth.loginAttempts >= 5) {
          // const blockUntil = new Date(Date.now() + 5 * 60 * 1000);
          auth.blockUntil = new Date(Date.now() + 5 * 60 * 1000);
          auth.loginAttempts = 0;

          await auth.save();
          return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            RESPONSE_MESSAGE.FAILED_TO_LOGIN,
            RESPONSE_MESSAGE.BLOCK_ACCOUNT
          );
        }

        await auth.save();
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          RESPONSE_MESSAGE.INVALID_CREDENTIAL
        );
      }

      if (auth.role === 1) {
        token = await generateAdminToken(auth.admin);
        responseData = auth.admin;
      } else if (auth.role === 2) {
        token = await generateUserToken(auth.user);
        responseData = auth.user;
      }

      auth.loginAttempts = 0;
      await auth.save();

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.LOGIN_SUCCESSFUL,
        {
          token: token,
          user: {
            id: responseData._id,
            email: responseData.email,
            name: responseData.name,
            phoneNumber: responseData.phoneNumber,
            address: responseData.address,
            superAdmin: responseData.superAdmin
          },
        }
      );
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
