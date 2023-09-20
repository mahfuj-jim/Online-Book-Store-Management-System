const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "books",
    required: true,
  },
  review: {
    type: String,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  time: {
    type: Date,
    default: Date.now,
    required: [true, "Time is not provided"],
  },
});

const ReviewModel = mongoose.model("reviews", reviewSchema);

module.exports = ReviewModel;