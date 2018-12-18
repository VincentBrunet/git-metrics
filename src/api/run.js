
var app = require("./app");

var routesAuthors = require("./routes/authors");
var routesRepositories = require("./routes/repositories");

var $this = {};

$this.start = function (host, port) {

    app.get("/repository/list", routesRepositories.listRepositories);
    app.get("/repository/:id/authors/activity", routesAuthors.repositoryAuthorsActivity);

    app.listen(host, port);

};

module.exports = $this;
