const ReviewController = require("../controllers/review_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateReviewData, validateUpdateReviewData } = require("../middleware/review_validation");
const express = require("express");
const router = express.Router();

router.get("/book/:id", ReviewController.getBookReview);
router.post("/add", validateToken, validateReviewData, ReviewController.addReview);
router.put("/update", validateToken, validateUpdateReviewData, ReviewController.editReview);
router.delete("/delete/", validateToken, ReviewController.deleteReview);

module.exports = router;