
var core = require("../../core");

var serviceRepository = require("../services/repository");

var $this = {};

$this.listRepositories = function (req, next) {
    serviceRepository.listRepositories(function (success, repositories, error) {
        return next(success, repositories, error);
    });
};

module.exports = $this;
