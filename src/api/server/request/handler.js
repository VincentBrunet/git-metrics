var config = require("config");

var bb = require("../../../bb");

var thisStart = require("./start");
var thisEnd = require("./end");

module.exports = function (callback) {
    // Wrap a function with a function
    return function (req, res) {
        // Args parsing
        var args = {};
        bb.flow.for(req.params, function (key, value) {
            args[key] = value;
        });
        bb.flow.for(req.query, function (key, value) {
            args[key] = value;
        });
        bb.flow.for(req.body, function (key, value) {
            args[key] = value;
        });
        // Timeout protection
        var timeout = config.get("api.response.timeout");
        var request = thisStart(req, res);
        setTimeout(function () {
            var error = bb.error.make("RequestTimeout", "Request timeout");
            thisEnd(request, {
                success: false,
                results: null,
                error: error
            });
        }, timeout);
        // Run protected callback
        try {
            var param = {
                args: args,
            };
            callback(param, function (success, results, error) {
                thisEnd(request, {
                    success: success,
                    results: results,
                    error: error
                });
            });
        }
        catch (error) {
            thisEnd(request, {
                success: false,
                results: null,
                error: error
            });
        }
    };
};
