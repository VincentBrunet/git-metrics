
var bb = require("../../bb");

module.exports = async function (path, maxDate, minDate) {
    // Base command
    var command = "git log --numstat --full-history --parents --no-color --summary --all --date=rfc2822 --source --decorate=short";
    // Add date limits
    var dateFormat = 'MMMM DD YYYY HH:mm:ss ZZ';
    command += " --until=\"" + maxDate.format(dateFormat) + "\"";
    command += " --since=\"" + minDate.format(dateFormat) + "\"";
    // Make sure enough memory is allocated, and that it runs in repo folder
    var options = {
        cwd: path,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    // Actual run the process
    var result = await bb.process.run(command, options);
    // Only care about stdout
    return result.stdout;
};
