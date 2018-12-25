
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
        // Only if we found something
        if (blockLogs.length > 0) {
            // Cut logs in lines
            var blockLines = bb.string.lines(blockLogs);
            // Add result to list of logs
            bb.array.appendArray(lines, blockLines);
            // Log
            if (blockLines.length > 0) {
                console.log(
                    "git.get.logs",
                    "-> ", "from:", bb.string.lpad(blockMinDate.format("LL"), 20),
                    " | ", "to:", bb.string.lpad(blockMaxDate.format("LL"), 20),
                    " | ", "size:", bb.string.lpad(bb.maths.int(blockLogs.length / 1024), 6), "kB"
                );
            }
        }
    }
    // Done
    return lines;
};
