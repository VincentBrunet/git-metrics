
var gitLog = require("./src/git/log");

console.log("gitLog", gitLog);

gitLog.run("../nanovr-0.2", 50, function () {

    console.log("Done");

});
