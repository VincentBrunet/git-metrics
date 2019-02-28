var uuid = require('uuid/v4');

var bb = require("../../../bb");

module.exports = function (req, res) {
    req.uuid = uuid();
    return {
        time: bb.moment(),
        res: res,
        req: req,
        finished: false
    };
};
