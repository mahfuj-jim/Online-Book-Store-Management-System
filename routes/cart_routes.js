const CartController = require("../controllers/cart_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateCartData } = require("../middleware/cart_validation");
const express = require("express");
const router = express.Router();

router.get("/view/:id", validateToken, CartController.viewUserCart);
router.patch("/add", validateToken, validateCartData, CartController.addBookToCart);
router.patch("/remove", validateToken, validateCartData, CartController.removeBookToCart);

module.exports = router;