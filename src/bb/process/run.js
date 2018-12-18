var child_process = require('child_process');

module.exports = async function (command, options) {
    if (options === undefined) {
        options = {};
    }
    return new Promise(function (resolve, reject) {
        child_process.exec(command, options, function callback(error, stdout, stderr) {
            if (error == null) {
                resolve({
                    stdout: stdout,
                    stderr: stderr,
                });
            }
            else {
                reject(error);
            }
        });
    });
};
