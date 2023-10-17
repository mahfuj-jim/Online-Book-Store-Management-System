const fileTypes = require("../constants/file_types");
const path = require("path");
const multer = require("multer");

const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  storage: multer.diskStorage({
    destination: (req, file, callBack) => {
      if (file) {
        callBack(null, "./server/images");
      } else {
        req.file.error = "File not found";
        callBack("File not found", null);
      }
    },
    filename: (req, file, callBack) => {
      if (file) {
        callBack(null, Date.now() + "_" + file.originalname);
      } else {
        callBack("File not found", null);
      }
    },
  }),
  fileFilter: (req, file, callBack) => {
    if (file) {
      const extension = path.extname(file.originalname);
      req.file_extension = extension;
      if (fileTypes.includes(extension)) {
        callBack(null, true);
      } else {
        callBack(null, false);
      }
    } else {
        callBack("File not found", false);
    }
  },
});

module.exports = upload;
