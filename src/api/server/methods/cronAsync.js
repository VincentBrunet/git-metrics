
module.exports = function (name, delay, callback) {
    let running = false;
    setInterval(function () {
        if (running) {
            return false;
        }
        running = true;
        callback(function (success, results, error) {
            if (!success) {
                console.log("CRON FAILURE", name, error);
            }
            running = false;
        });
    }, delay);
};
