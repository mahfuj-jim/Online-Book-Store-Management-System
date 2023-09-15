const UserController = require("../controllers/user_controller");
const express = require("express");
const router = express.Router();

router.get("/all", UserController.getAllUsers);

module.exports = router;