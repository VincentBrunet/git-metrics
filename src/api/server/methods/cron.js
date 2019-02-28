
var thisCronAsync = require("./cronAsync");

module.exports = function (name, delay, callback) {
    thisCronAsync(name, delay, async function (req, done) {
        try {
            var results = await callback(req);
            return done(true, results);
        }
        catch (error) {
            return done(false, null, error);
        }
    });
};
