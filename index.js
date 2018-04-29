
var gitLogs = require("./src/git/logs");

console.log("gitLogs", gitLogs);

gitLogs.run("../Nanome/nanovr-0.2", function () {

    console.log("Done");

});
