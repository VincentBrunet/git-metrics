
var serverApp = require("../app");
var requestHandler = require("../request/handler");

module.exports = function (route, callback) {
    serverApp.get(route, requestHandler(callback));
};
