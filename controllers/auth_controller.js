const AuthModel = require("../models/auth_model");
const AdminModel = require("../models/admin_models");
const UserModel = require("../models/user_model");
const { sendResponse, writeToLogFile } = require("../utils/common");
const {
  generateAdminToken,
  generateUserToken,
  decodeToken,
} = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const bcrypt = require("bcrypt");

class AuthController {
  async signup(req, res) {
    try {
      const requestBody = req.body;
      let token, responseData;

      const isEmailExists = await AuthModel.findOne({
        email: requestBody.email,
      });
      if (isEmailExists) {
        writeToLogFile("Error: Failed to Signup Email Already Exists");
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
          RESPONSE_MESSAGE.EMAIL_ALREADY_EXISTS
        );
      }

      if (requestBody.role === 1) {
        const admin = {
          name: requestBody.name,
          role: requestBody.role,
          email: requestBody.email,
          secretId: requestBody.secretId,
          superAdmin: requestBody.superAdmin,
        };

        const createdAdmin = await AdminModel.create(admin);
        if (!createdAdmin) {
          writeToLogFile("Error: Failed to Signup - Internal Server Error");
          return sendResponse(
            res,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
            STATUS_RESPONSE.INTERNAL_SERVER_ERROR
          );
        }

        token = generateAdminToken(createdAdmin);
        responseData = {
          _id: createdAdmin._id,
          email: requestBody.email,
          name: requestBody.name,
          secretId: requestBody.secretId,
          superAdmin: requestBody.superAdmin,
        };
      } else if (requestBody.role === 2) {
        const isPhoneNumberExists = await UserModel.findOne({
          phoneNumber: requestBody.phoneNumber,
        });
        if (isPhoneNumberExists && isPhoneNumberExists.phoneNumber) {
          writeToLogFile("Error: Failed to Signup - Phone Number Already Exists");
          return sendResponse(
            res,
            STATUS_CODE.CONFLICT,
            RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
            RESPONSE_MESSAGE.PHONE_NUMBER_ALREADY_EXISTS
          );
        }

        const user = {
          name: requestBody.name,
          role: requestBody.role,
          email: requestBody.email,
          phoneNumber: requestBody.phoneNumber,
        };

        const createdUser = await UserModel.create(user);
        if (!createdUser) {
          
        writeToLogFile("Error: Failed to Signup - Internal Server Error");
          return sendResponse(
            res,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
            STATUS_RESPONSE.INTERNAL_SERVER_ERROR
          );
        }

        token = generateUserToken(createdUser);
        responseData = {
          _id: createdUser._id,
          email: requestBody.email,
          name: requestBody.name,
          phoneNumber: requestBody.phoneNumber,
        };
      }

      const hashedPassword = await bcrypt.hash(requestBody.password, 10);
      const auth = {
        email: requestBody.email,
        password: hashedPassword,
        verified: true,
        role: requestBody.role,
        admin: requestBody.role === 1 ? responseData._id : null,
        user: requestBody.role === 2 ? responseData._id : null,
        lastLoginDate: new Date(),
      };

      const createdAuth = await AuthModel.create(auth);
      if (!createdAuth) {
        writeToLogFile("Error: Failed to Signup - Internal Server Error");
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
          STATUS_RESPONSE.INTERNAL_SERVER_ERROR
        );
      }
      
      writeToLogFile("Signup: Successfull");
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
      writeToLogFile("Error: Failed to Signup - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
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
        writeToLogFile("Error: Failed to Login - Email Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          RESPONSE_MESSAGE.EMAIL_DOESNT_EXIST
        );
      }

      if (auth.disable) {
        writeToLogFile("Error: Failed to Login - Auth is Disable");
        return sendResponse(
          res,
          STATUS_CODE.FORBIDDEN,
          RESPONSE_MESSAGE.FAILED_TO_LOGIN,
          RESPONSE_MESSAGE.ACCOUNT_DISABLE
        );
      }

      if (auth.blockUntil && auth.blockUntil > new Date()) {
        const remainingTimeInSeconds = Math.ceil(
          (auth.blockUntil - new Date()) / 1000
        );
        writeToLogFile("Error: Failed to Login - User is Blocked");
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
          auth.blockUntil = new Date(Date.now() + 5 * 60 * 1000);
          auth.loginAttempts = 0;

          await auth.save();
          writeToLogFile("Error: Failed to Login - User Get Blocked");
          return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            RESPONSE_MESSAGE.FAILED_TO_LOGIN,
            RESPONSE_MESSAGE.BLOCK_ACCOUNT
          );
        }

        await auth.save();
        writeToLogFile("Error: Failed to Login - Invalid Credential");
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
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

      writeToLogFile("Login: Successfully Login");
      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.LOGIN_SUCCESSFUL,
        {
          token: token,
          user: {
            _id: responseData._id,
            email: responseData.email,
            name: responseData.name,
            phoneNumber: responseData.phoneNumber,
            address: responseData.address,
            superAdmin: responseData.superAdmin,
          },
        }
      );
    } catch (err) {
      writeToLogFile("Error: Failed to Login - Internal Server Error");
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_LOGIN,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthController();
