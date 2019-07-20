
var bb = require("../../bb");

var thisLogs = require("./logs");

module.exports = async function (path, days, chunks, offset) {
    // Initial setup
    var lines = [];
    var now = bb.moment();
    // Work splitting
    var blockOffset = offset || 0;
    var blockDays = chunks;
    var blockCount = Math.ceil(days / blockDays);
    // Loop for each period
    for (var i = 0; i < blockCount; i++) {
        // Limit dates
        var blockIndex = i + (blockOffset * blockCount);
        var blockMaxDate = bb.moment(now).subtract(blockIndex * blockDays, 'days');
        var blockMinDate = bb.moment(now).subtract((blockIndex + 1) * blockDays, 'days');
        // Record time
        var start = bb.moment();
        // Wait for logs
        var blockLogs = await thisLogs(path, blockMaxDate, blockMinDate);
        // Elapsed time
        var elapsed = bb.moment().diff(start);
        // Cut logs in lines
        var blockLines = bb.string.lines(blockLogs);
        // Add result to list of logs
        bb.array.appendArray(lines, blockLines);
        // Log
        console.log(
            "git.get.logs",
            " | ", "date: ", bb.string.lpad(blockMinDate.format("LL"), 20),
            " | ", bb.string.lpad(elapsed + " ms", 8),
            " | ", bb.string.lpad(bb.maths.int(blockLogs.length / 1024) + " kB", 8),
            " | "
        );
    }
    // Done
    return lines;
};
