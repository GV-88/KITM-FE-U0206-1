const express = require("express");
const path = require("node:path");
const roomRoutes = require("./routes/roomRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();

app.use(express.json()); // this adds middleware that automatically parses request (?)

const apiPath = process.env.API_PATH || "/module-b/api/v1/rooms";

app.use(path.posix.join(apiPath, "rooms"), roomRoutes);
app.use(path.posix.join(apiPath, "reservations"), reservationRoutes);

module.exports = app;
