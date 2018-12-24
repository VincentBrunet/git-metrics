
var bb = require("../../bb");

module.exports = async function (path) {
    var command = "git config --get remote.origin.url";
    var options = {
        cwd: path,
    };
    var result = await bb.process.run(command, options);
    return result.stdout.trim();
};
