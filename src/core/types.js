
var $this = {};

$this.enforceInt = function (value, label) {
    var value = parseInt(value);
    if (isNaN(value)) {
        throw new Error("" + label + ": is not a valid integer (" + value + ")");
    }
    return value;
};

$this.enforceFloat = function (value, label) {
    var value = parseFloat(value);
    if (isNaN(value)) {
        throw new Error("" + label + ": is not a valid integer (" + value + ")");
    }
    return value;
};

$this.isError = function (value) {
    return value instanceof Error;
};

$this.enforceErrorMessage = function (value) {
    if ($this.isError(value)) {
        return value.message;
    }
    return value;
};

module.exports = $this;
