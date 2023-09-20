const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    totalBook: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
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

const AuthorModel = mongoose.model("authors", authorSchema);

module.exports = AuthorModel;
