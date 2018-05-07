
var express = require('express');

var core = require("../core");

var app = express();
app.set('json spaces', 2);

var $local = {};

$local.requestStart = function (req, res) {
    return {
        "startTime": core.moment(),
        "hasFinished": false,
        "res": res,
        "req": req,
    };
};

$local.requestEnd = function (request, json) {
    if (!request.hasFinished) {
        request.hasFinished = true;
        json.timing = core.moment().diff(request.startTime, "ms") + "ms";
        console.log("Request", request.req.url, json.timing);
        request.res.json(json);
    }
};

var $this = {};

$this.get = function (route, callback) {
    app.get(route, function (req, res) {
        var request = $local.requestStart(req, res);
        setTimeout(function () {
            $local.requestEnd(request, {
                success: false,
                data: undefined,
                error: core.types.enforceErrorMessage(new Error("Request timeout")),
            });
        }, 2000);
        try {
            callback(req, function (success, json, error) {
                $local.requestEnd(request, {
                    success: success,
                    data: json,
                    error: core.types.enforceErrorMessage(error),
                });
            });
        }
        catch (error) {
            $local.requestEnd(request, {
                success: false,
                data: undefined,
                error: core.types.enforceErrorMessage(error),
            });
        }
    });
};

/*
$this.post = function () {
};
*/

$this.listen = function (host, port) {
    app.listen(port, host);
};

module.exports = $this;
