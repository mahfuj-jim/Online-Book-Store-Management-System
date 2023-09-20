const TransactionController = require("../controllers/transaction_controller");
const { validateToken } = require("../middleware/token_validation");
const express = require("express");
const router = express.Router();

router.get("/all", validateToken, TransactionController.getAllTransactions);
router.get("/user/:id", validateToken, TransactionController.getTransactionsForUser);
router.post("/create", validateToken, TransactionController.createTransaction);

module.exports = router;