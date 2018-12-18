
var serviceRepository = require("../services/repository");

var $this = {};

$this.listRepositories = async function (req, next) {
    return await serviceRepository.listRepositories();
};

module.exports = $this;
