var colors = require("colors/safe");
var config = require('config');
var express = require('express');
var bodyParser = require("body-parser");
var cors = require("cors");

var app = express();
app.use(bodyParser.json());
app.use(cors());

if (config.get("api.response.indented")) {
    app.set("json spaces", 2);
}

var errorHanlder = function (error) {
    console.log(colors.red("------------------ UNHANDLED EXCEPTION CAUGHT ------------------"));
    console.log(colors.red(error));
};
process.on("uncaughtException", errorHanlder);
process.on("unhandledRejection", errorHanlder);

module.exports = app;
