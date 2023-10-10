const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    summary: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authors",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    totalSell: {
      type: Number,
      default: 0,
    },
    publishedDate: {
      type: Date,
    },
    updateDate: {
      type: Date,
    },
    edition: {
      type: Number,
      default: 1,
    },
    ISBN: {
      type: String,
      unique: true,
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    genre: [
      {
        type: String,
        required: true,
      },
    ],
    disable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const BookModel = mongoose.model("books", bookSchema);

module.exports = BookModel;
