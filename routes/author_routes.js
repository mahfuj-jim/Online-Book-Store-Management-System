const AuthorController = require("../controllers/author_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateAuthorData, validateDisableAuthor } = require("../middleware/author_validation");
const express = require("express");
const router = express.Router();

router.get("/all", AuthorController.getAllAuthor);
router.get("/:id", AuthorController.getAuthorById);
router.post("/add", validateToken, validateAuthorData, AuthorController.addNewAuthor);
router.patch('/disable', validateToken, validateDisableAuthor, AuthorController.disableAuthor);

module.exports = router;