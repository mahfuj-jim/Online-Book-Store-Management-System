const AuthController = require("../controllers/auth_controller");
const express = require("express");
const router = express.Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

module.exports = router;