const AuthController = require("../controllers/auth_controller.js");
const express = require("express");
const router = express.Router();

router.post("/signup", AuthController.signup);

module.exports = router;