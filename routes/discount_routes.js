const DiscountController = require("../controllers/discount_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateDiscountData, validateUpdateDiscountData } = require("../middleware/discount_validation");
const express = require("express");
const router = express.Router();

router.get("/all", validateToken, DiscountController.getAllDiscount);
router.post("/add", validateToken, validateDiscountData, DiscountController.addDiscount);
router.put("/update", validateToken, validateUpdateDiscountData, DiscountController.updateDiscount);
router.delete("/delete", validateToken, DiscountController.deleteDiscount);

module.exports = router;