const nodemailer = require("nodemailer");

var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "3d75e3ed82dc51",
    pass: "6c664298e9eeba",
  },
});

module.exports = { transport };