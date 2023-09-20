const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const databaseConnection = async (callback) => {
    try {
        if (process.env.DATABASE_URL) {
            const client = await mongoose.connect(process.env.DATABASE_URL);
            if (client) {
                console.log("Database connection successfully");
                callback();
            }
        } else {
            console.log("Database url is not provided");
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = { databaseConnection };