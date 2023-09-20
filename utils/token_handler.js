const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const generateAdminToken = (admin) => {
  const token = jwt.sign(
    {
      admin: {
        _id: admin.id,
        email: admin.email,
        superAdmin: admin.superAdmin,
      },
      role: "admin",
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "3d",
    }
  );

  return token;
};

const generateUserToken = (user) => {
  const token = jwt.sign(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      role: "user",
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "3d",
    }
  );

  return token;
};

function decodeToken(req) {
  const authHeader = req.header("Authorization");
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

module.exports = {
  generateAdminToken,
  generateUserToken,
  decodeToken
};
