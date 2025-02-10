const express = require("express");

const app = express();

app.use(express.json()); // this adds middleware that automatically parses request (?)

module.exports = app;
