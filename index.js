
var gitLogs = require("./src/git/logs");

console.log("gitLogs", gitLogs);

gitLogs.run("../nanovr-0.2", 365, function () {

    console.log("Done");

});
