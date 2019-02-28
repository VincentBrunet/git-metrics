var config = require("config");
var fs = require("fs");
var http = require("http");
var https = require("https");

var thisApp = require("./app");

module.exports = function () {
    // Base
    var logged = config.get("api.response.logged");
    var certs = {
        //key: fs.readFileSync(config.get("api.certs.key")),
        //cert: fs.readFileSync(config.get("api.certs.crt")),
        requestCert: false,
        rejectUnauthorized: false
    };
    // Http
    var httpPort = config.get("api.ports.http");
    http.createServer(thisApp).listen(httpPort, function () {
        if (logged) {
            console.log("HTTP Server running on port", httpPort);
        }
    });
    // Https
    var httpsPort = config.get("api.ports.https");
    https.createServer(certs, thisApp).listen(httpsPort, function () {
        if (logged) {
            console.log("HTTPS Server running on port", httpsPort);
        }
    });
};
