const mongoose = require("mongoose");

// Return database errors without printing the URI or its password.
function databaseErrorMessage(error) {
  const message = String(error.message || "");

  if (/querySrv|queryTxt|ENOTFOUND|ETIMEOUT|ECONNREFUSED.*_mongodb/i.test(message)) {
    return "MongoDB DNS lookup failed. Check that the Atlas cluster is running and the hostname is current. If SRV lookups are blocked, use the standard connection string supplied by Atlas.";
  }

  if (error.code === 18 || /authentication failed|bad auth/i.test(message)) {
    return "MongoDB authentication failed. Check the Atlas database user, password encoding and authSource in MONGO_URI.";
  }

  if (error.name === "MongoServerSelectionError" || error.name === "MongooseServerSelectionError") {
    return "MongoDB could not be reached. Check the Atlas IP access list, cluster status and outbound port 27017. Run npm run check:db for a connection check.";
  }

  return "MongoDB connection failed. Check the connection string and database user permissions in Atlas.";
}

async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error("Set MONGO_URI to a valid MongoDB connection string in backend/.env or Heroku Config Vars.");
  }

  // Requests should fail clearly during an outage instead of sitting in a queue.
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  await mongoose.connection.db.admin().ping();
}

module.exports = { connectDatabase, databaseErrorMessage };
