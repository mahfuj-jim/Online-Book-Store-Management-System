const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
    {
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
        password: {
            type: String,
            required: [true, "Password is not provided"]
        },
        role: {
            type: Number,
            enum: [1, 2],
            required: [true, "Role is not provided"],
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admins",
            required: function () {
                return this.role === 1;
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: function () {
                return this.role === 2;
            },
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lastLoginFailAttempt: {
            type: Date,
            default: null,
        },
        blockUntil: {
            type: Date,
            default: null,
        },
        lastLoginDate: {
            type: Date,
            required: [true, "Last Login is not provided"],
        },
        disable: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const AuthModel = mongoose.model("auths", authSchema);

module.exports = AuthModel;