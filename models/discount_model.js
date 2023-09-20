const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    type: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "books",
      },
    ],
    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "authors",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const DiscountModel = mongoose.model("discounts", discountSchema);

module.exports = DiscountModel;
