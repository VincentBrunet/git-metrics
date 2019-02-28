
var thisGetAsync = require("./getAsync");

module.exports = function (route, callback) {
    thisGetAsync(route, async function (req, done) {
        try {
            var results = await callback(req);
            return done(true, results);
        }
        catch (error) {
            return done(false, null, error);
        }
    });
};
