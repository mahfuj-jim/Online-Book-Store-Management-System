const AuthModel = require("../models/auth_model");
const UserModel = require("../models/user_model");
const { sendResponse, writeToLogFile } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

class UserController {
  async getAllUsers(req, res) {
    try {
      const decodedToken = decodeToken(req);
      if (decodedToken.role !== "admin") {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

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
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_USERS,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserById(req, res) {
    try {
      const userId = req.params.id;

      const decodedToken = decodeToken(req);
      if ((decodedToken.role === "user" && decodedToken.user.id !== userId) && decodedToken.role !== "admin") {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const user = await UserModel.findOne(
        { _id: userId },
        { createdAt: false, updatedAt: false, __v: false }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_USER,
        user
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_USER,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editUser(req, res) {
    try {
      const requestBody = req.body;

      const decodedToken = decodeToken(req);
      if ((decodedToken.role !== "user" && decodedToken.user.id !== requestBody.userId) && decodedToken.role !== "admin") {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const user = await UserModel.findOne({ _id: requestBody.userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      if (requestBody.phoneNumber) {
        const isPhoneNumberUnique = await UserModel.findOne({
          _id: { $ne: requestBody.userId },
          phoneNumber: requestBody.phoneNumber,
        });

        if (isPhoneNumberUnique) {
          return sendResponse(
            res,
            STATUS_CODE.CONFLICT,
            RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
            RESPONSE_MESSAGE.PHONE_NUMBER_NOT_UNIQUE
          );
        }
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: requestBody.userId },
        { $set: requestBody },
        { new: true }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.USER_UPDATED,
        updatedUser
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteUser(req, res) {
    try {
      const requestBody = req.body;

      const decodedToken = decodeToken(req);
      if (decodedToken.role !== "admin" || !decodedToken.admin.superAdmin) {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const isIdValid = mongoose.Types.ObjectId.isValid(requestBody.userId);
      if (!isIdValid) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      const user = await UserModel.findOne({ _id: requestBody.userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      await UserModel.deleteOne({ _id: requestBody.userId });
      await AuthModel.deleteOne({ user: requestBody.userId });

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.DELETE_USER
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DELETE_USER,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateUserBalance(req, res) {
    try {
      const requestBody = req.body;

      const decodedToken = decodeToken(req);
      if (decodedToken.role === "user" && decodedToken.user.id !== requestBody.userId) {
        return sendResponse(
          res,
          STATUS_CODE.UNAUTHORIZED,
          STATUS_RESPONSE.UNAUTHORIZED,
          RESPONSE_MESSAGE.UNAUTHORIZED
        );
      }

      const user = await UserModel.findOne({ _id: requestBody.userId }, { createdAt: false, updatedAt: false, __v: false });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER_BALANCE,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      user.balance += requestBody.amount;
      await user.save();

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.USER_BALANCE_UPDATED,
        user
      );

    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER_BALANCE,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async disableUser(req, res) {
    try {
      const requestBody = req.body;

      const user = await UserModel.findOne({ _id: requestBody.userId, disable: !requestBody.disable }, { createdAt: false, updatedAt: false, __v: false });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DISABLE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      const auth = await AuthModel.findOne({email: user.email});
      if (!auth) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DISABLE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      user.disable = requestBody.disable;
      await user.save();

      auth.disable = requestBody.disable;
      await auth.save();

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.DISABLE_USER,
        user
      );

    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DISABLE_USER,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new UserController();
