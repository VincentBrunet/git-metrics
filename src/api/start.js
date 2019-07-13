var bb = require("../bb");

var thisServer = require("./server");
var thisRoutes = require("./routes");

module.exports = function () {

    /*
    thisServer.get("/", function () {
        return new Promise(function (resolve, reject) {
            resolve("Welcome to Metrics");
        });
    });
    */

    thisServer.methods.get("/commit/count", thisRoutes.commit.count);

    thisServer.methods.get("/repository/list", thisRoutes.repository.list);

    //app.get("/repository/:id/authors/activity", routesAuthors.repositoryAuthorsActivity);

    thisServer.methods.get("/fail/number", function () {
        throw 42;
    });
    thisServer.methods.get("/fail/string", function () {
        throw "hello";
    });
    thisServer.methods.get("/fail/object", function () {
        throw {};
    });
    thisServer.methods.get("/fail/array", function () {
        throw [];
    });
    thisServer.methods.get("/fail/error", function () {
        throw new Error("route error");
    });
    thisServer.methods.get("/fail/bug", function () {
        console.log(hello);
    });
    thisServer.methods.get("/fail/validation", function () {
        return bb.error.block("BadRequest", "Invalid user id", bb.type.enforceInt, "hello");
    });
    thisServer.methods.get("/*", function () {
        throw bb.error.make("NotFound", "Unknown route");
    });

    thisServer.listen();
};
