const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        orderList: [
            {
                book: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "books",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
                discountPrice: {
                    type: Number,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const TransactionModel = mongoose.model("transactions", transactionSchema);

module.exports = TransactionModel;
