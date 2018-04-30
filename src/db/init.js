
var dbController = require("./controller");

var $this = {};

$this.build = function (next) {
    dbController.table("git_commit", {
        "hash": "TEXT PRIMARY KEY",
        "comment": "TEXT",
        "date": "INT",
    }, next);
};

module.exports = $this;
