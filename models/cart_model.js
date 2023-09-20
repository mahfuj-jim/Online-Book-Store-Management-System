const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    orderList: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "books",
        },
        quantity: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const CartModel = mongoose.model("carts", cartSchema);

module.exports = CartModel;