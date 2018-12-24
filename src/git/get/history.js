
var bb = require("../../bb");

var thisLogs = require("./logs");

module.exports = async function (path, days) {
    // Initial setup
    var lines = [];
    var now = bb.moment();
    // Work splitting
    var blockDays = 7;
    var blockCount = Math.ceil(days / blockDays);
    // Loop for each period
    for (var i = 0; i < blockCount; i++) {
        // Limit dates
        var blockMaxDate = bb.moment(now).subtract(i * blockDays, 'days');
        var blockMinDate = bb.moment(now).subtract((i + 1) * blockDays, 'days');
        // Wait for logs
        var blockLogs = await thisLogs(path, blockMaxDate, blockMinDate);
        // Add result to list of logs
        var blockLines = bb.string.lines(blockLogs);
        bb.array.appendArray(lines, blockLines);
    }
    // Done
    return lines;
};
