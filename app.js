const express = require("express");
const path = require("node:path");
const roomRoutes = require("./routes/roomRoutes");

const app = express();

app.use(express.json()); // this adds middleware that automatically parses request (?)

const apiPath = process.env.API_PATH || "/module-b/api/v1/rooms";

const roomsPath = path.posix.join(apiPath, "rooms");
console.log(roomsPath);

app.use(path.posix.join(apiPath, "rooms"), roomRoutes);

module.exports = app;
