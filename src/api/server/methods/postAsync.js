
var serverApp = require("../app");
var requestHandler = require("../request/handler");

module.exports = function (route, callback) {
    serverApp.post(route, requestHandler(callback));
};
