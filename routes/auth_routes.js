const AuthController = require("../controllers/auth_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateAdminSignup, validateUserSignup, validateLogin } = require("../middleware/auth_validation");
const express = require("express");
const router = express.Router();

router.post("/signup", (req, res, next) => {
    const { role } = req.body;
    if (role === 1) {
        validateToken(req, res, next);
    } else {
        next();
    }
}, (req, res, next) => {
    const { role } = req.body;
    if (role === 1) {
        validateAdminSignup(req, res, next);
    } else {
        validateUserSignup(req, res, next);
    }
}, AuthController.signup);
router.post("/login", validateLogin, AuthController.login);

module.exports = router;