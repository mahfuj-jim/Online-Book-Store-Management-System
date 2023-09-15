const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is not provided"],
      maxLength: 30,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is not provided"],
      validate: {
        validator: function (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Invalid email format",
      },
    },
    secretId: {
      type: String,
      minLength: 8, 
      required: [true, "Secret ID is required"],
    },
    superAdmin: {
      type: Boolean,
      default: false, 
      required: [true, "Super Admin status is required"],
    },
  },
  {
    timestamps: true,
  }
);

const AdminModel = mongoose.model("admins", adminSchema);

module.exports = AdminModel;
