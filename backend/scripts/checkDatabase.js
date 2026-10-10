const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { connectDatabase, databaseErrorMessage } = require("../config/database");

async function checkDatabase() {
  try {
    // This deliberately checks MongoDB even if the local file fallback is enabled.
    await connectDatabase();
    console.log(`MongoDB connected. Database: ${mongoose.connection.name}`);
    console.log("Database ping succeeded. The connection is ready for registration and login.");
  } catch (error) {
    console.error(databaseErrorMessage(error));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
