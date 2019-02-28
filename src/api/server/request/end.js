var config = require("config");
var colors = require("colors/safe");

var bb = require("../../../bb");

var thisError = require("./error");

var statusCodes = {
    // 4xx
    "BadRequest": 400,
    "Unauthorized": 401,
    "PaymentRequired": 402,
    "Forbidden": 403,
    "NotFound": 404,
    "MethodNotAllowed": 405,
    "NotAcceptable": 406,
    "ProxyAuthenticationRequired": 407,
    "RequestTimeout": 408,
    "Conflict": 409,
    "Gone": 410,
    // 5xx
    "InternalServerError": 500,
    "NotImplemented": 501,
    "BadGateway": 502,
    "ProxyError": 502,
    "ServiceUnavailable": 503,
    "GatewayTimeout": 504,
};

module.exports = function (request, output) {
    // No double answers
    if (request.finished) {
        return;
    }
    request.finished = true;
    // How long
    var elapsed = bb.moment().diff(request.time, "ms");
    // Base response
    var response = {
        success: output.success,
        results: output.results,
        error: null,
    };
    // If there was an error
    if (output.error) {
        var parsed = thisError(output.error);
        response.error = {
            name: parsed.name,
            code: parsed.code,
            message: parsed.message,
            stack: parsed.stack,
            extra: parsed.extra,
        };
    }
    // If we allow profiling
    if (config.get("api.response.profiled")) {
        response.profile = {
            args: request.req.args,
            elapsed: elapsed + "ms",
        };
    }
    // If no profiling
    else {
        if (response.error) {
            response.error.stack = undefined;
            response.error.extra = undefined;
        }
    }
    // Response status depending on request type/error
    if (output.error) {
        request.res.status(statusCodes[output.error.name] || 500);
    } else {
        request.res.status(200);
    }
    // Do respond
    request.res.json(response);
    // Anonymized request log for statistics and fraud detection
    var uuid = request.req.uuid;
    var status = request.res.statusCode;
    var proto = (request.req.headers['x-forwarded-proto'] || request.req.connection.encrypted) ? 'https' : 'http';
    var host = request.req.headers['x-forwarded-host'] || request.req.headers["host"];
    var from = request.req.headers['x-forwarded-for'] || request.req.connection.remoteAddress;
    var path = request.req.path;
    // Log
    if (config.get("api.response.logged")) {
        // Status
        var statusStr = colors.green(status);
        if (status != 200 && status != 304) {
            statusStr = colors.red(status);
        }
        // Proto
        var protoStr = colors.yellow(proto);
        if (proto == "https") {
            proto = colors.green(status);
        }
        // Route
        var pathStr = colors.cyan(path);
        // Elapsed
        var elapsedStr = colors.green(elapsed + " ms");
        if (elapsed > 500) {
            elapsedStr = colors.yellow(elapsed + " ms");
        }
        if (elapsed > 2000) {
            elapsedStr = colors.red(elapsed + " ms");
        }
        // Trace
        var hostStr = colors.magenta(host);
        var fromStr = colors.blue(from);
        // Console
        console.log(
            "Request",
            "[" + statusStr + " " + pathStr + "]",
            elapsedStr,
            "(" + protoStr + " " + fromStr + " -> " + hostStr + ")"
        );
    }
};
