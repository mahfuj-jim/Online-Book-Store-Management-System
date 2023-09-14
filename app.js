const { databaseConnection } = require("./config/database.js");
const express = require("express");
const cors = require("cors");

const PORT = 8000;
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res) => {
  return failure(res, 404, "Not Found", "Request Not Found");
});

databaseConnection(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
