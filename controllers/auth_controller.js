const AuthModel = require("../models/auth_model");
const AdminModel = require("../models/admin_models");
const UserModel = require("../models/user_model");
const { sendResponse, writeToLogFile } = require("../utils/common");
const {
  generateAdminToken,
  generateUserToken,
} = require("../utils/token_handler");
const { transport } = require("../config/mail");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const { promisify } = require("util");
const ejsRenderFile = promisify(ejs.renderFile);
const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

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
          writeToLogFile(
            "Error: Failed to Signup - Phone Number Already Exists"
          );
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
          role: auth.role,
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

  async sendForgetPasswordEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email || email == "") {
        return sendResponse(
          res,
          STATUS_CODE.UNPROCESSABLE_ENTITY,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          STATUS_RESPONSE.UNPROCESSABLE_ENTITY
        );
      }

      const auth = await AuthModel.findOne({ email })
        .populate("admin")
        .populate("user")
        .exec();
      if (!auth) {
        writeToLogFile("Error: Failed to Forget Password - Email Don't Exists");
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          RESPONSE_MESSAGE.EMAIL_DOESNT_EXIST
        );
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      auth.resetPasswordToken = resetToken;
      auth.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      auth.resetPassword = true;

      await auth.save();

      const resetUrl = path.join(
        process.env.FRONTEND_URL,
        "reset-password",
        resetToken,
        auth.user ? auth.user._id.toString() : auth.admin._id.toString()
      );

      const htmlBody = await ejsRenderFile(
        path.join(__dirname, "..", "views", "forget-password.ejs"),
        {
          name: auth.user ? auth.user.name : auth.admin.name,
          resetUrl: resetUrl,
        }
      );

      const result = await transport.sendMail({
        from: "online.bookstore@gmail.com",
        to: `${auth.name} ${email}`,
        subject: "Forget Password",
        html: htmlBody,
      });

      if (result.messageId) {
        return sendResponse(
          res,
          STATUS_CODE.OK,
          RESPONSE_MESSAGE.FORGETPASSWORD_SUCCESSFUL,
          STATUS_RESPONSE.OK
        );
      } else {
        return sendResponse(
          res,
          STATUS_CODE.UNPROCESSABLE_ENTITY,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          STATUS_RESPONSE.UNPROCESSABLE_ENTITY
        );
      }
    } catch (err) {
      console.log(err);
      writeToLogFile(
        "Error: Failed to Send Forget Password Email - Internal Server Error"
      );
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, userId, newPassword, confirmPassword } = req.body;

      if (
        !newPassword ||
        newPassword === "" ||
        !confirmPassword ||
        confirmPassword === ""
      ) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          "Password and Confrim Password is required"
        );
      } else if (
        !/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(
          newPassword
        )
      ) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          "Password must be at least 8 characters long and include at least one capital letter, one small letter, one special character, and one number."
        );
      }

      if (newPassword !== confirmPassword) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          "Password and confirm passsword is not matched"
        );
      }

      const auth = await AuthModel.findOne({
        $or: [{ user: userId }, { admin: userId }],
      });

      if (!auth) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          STATUS_RESPONSE.USER_NOT_FOUND
        );
      }

      const isPreviousPassword = await bcrypt.compare(
        newPassword,
        auth.password
      );
      if (isPreviousPassword) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          "Previous Password"
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      auth.password = hashedPassword;
      auth.resetPasswordToken = null;
      auth.resetPasswordExpire = null;
      auth.resetPassword = false;

      await auth.save();

      return sendResponse(res, STATUS_CODE.OK, STATUS_RESPONSE.OK);
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validatePasswordRequest(req, res) {
    console.log(req);
    try {
      const { token, userId } = req.query;
      console.log(userId, token);

      const auth = await AuthModel.findOne({
        $or: [{ user: userId }, { admin: userId }],
      });
      if (!auth) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          STATUS_RESPONSE.USER_NOT_FOUND
        );
      }

      if (auth.resetPasswordToken !== token || auth.resetPassword === false) {
        return sendResponse(
          res,
          STATUS_CODE.GONE,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          "Request is not valid"
        );
      }

      if (auth.resetPasswordExpire < Date.now()) {
        return sendResponse(
          res,
          STATUS_CODE.FORBIDDEN,
          RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
          STATUS_RESPONSE.GONE
        );
      }

      return sendResponse(res, STATUS_CODE.OK, STATUS_RESPONSE.OK);
    } catch (err) {
      writeToLogFile(
        "Error: Failed to Send Forget Password Email - Internal Server Error"
      );
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_FORGETPASSWORD,
        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthController();
