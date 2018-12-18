
var core = require("../core");

var bb = require("../bb");

var $local =  {};

$local.logsForTimePeriod = async function (repository, maxDate, minDate) {
    // Base command
    var command = "git log --numstat --full-history --parents --no-color --summary --all --date=iso --source --decorate=short";
    // Add date limits
    var dateFormat = 'MMMM DD YYYY HH:mm:ss ZZ';
    command += " --until=\"" + maxDate.format(dateFormat) + "\"";
    command += " --since=\"" + minDate.format(dateFormat) + "\"";
    // Make sure enough memory is allocated, and that it runs in repo folder
    var options = {
        cwd: repository,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    // Actual run the process
    var result = await bb.process.run(command, options);
    // Log
    console.log("Reading commits\t from:", maxDate.format("LL"), "\t to:", minDate.format("LL"), "\t->", result.stdout.length / 1024, "KB");
    // Only care about stdout
    return result.stdout;
};

var $this = {};

$this.logsPreviousDays = async function (repository, days) {
    // Initial setup
    var lines = [];
    var now = core.moment();
    // Work splitting
    var blockDays = 7;
    var blockCount = Math.ceil(days / blockDays);
    // Loop for each period
    for (var i = 0; i < blockCount; i++) {
        // Limit dates
        var blockMaxDate = core.moment(now).subtract(i * blockDays, 'days');
        var blockMinDate = core.moment(now).subtract((i + 1) * blockDays, 'days');
        // Wait for logs
        var blockLogs = await $local.logsForTimePeriod(repository, blockMaxDate, blockMinDate);
        // Add result to list of logs
        var blockLines = bb.string.lines(blockLogs);
        bb.collection.array.appendArray(lines, blockLines);
    }
    // Done
    return lines;
};

module.exports = $this;
