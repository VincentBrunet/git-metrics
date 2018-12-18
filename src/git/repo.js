
var bb = require("../bb");

var $this = {};

$this.currentRepo = async function (repository, next) {
    var command = "git config --get remote.origin.url";
    var options = {
        cwd: repository,
    };
    var result = await bb.process.run(command, options);
    return result.stdout.trim();
};

module.exports = $this;
