
var thisPostAsync = require("./postAsync");

module.exports = function (route, callback) {
    thisPostAsync(route, async function (req, done) {
        try {
            var results = await callback(req);
            return done(true, results);
        }
        catch (error) {
            return done(false, null, error);
        }
    });
};
