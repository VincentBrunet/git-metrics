
var _ = require("lodash");

var $this = {};

$this.moment = require("moment");
$this.moment.suppressDeprecationWarnings = true;

$this.types = require("./types");

$this.isArray = _.isArray;

$this.count = function (collection) {
    if ($this.isArray(collection)) {
        return collection.length;
    }
    var c = 0;
    $this.for(collection, function (key, value) {
        c++;
    });
    return c;
};

$this.for = function (collection, elem, done) {
    if ($this.isArray(collection)) {
        for (var i = 0; i < collection.length; i++) {
            if (elem) {
                var value = collection[i];
                elem(i, value);
            }
        }
    } else {
        for (var key in collection) {
            if (collection.hasOwnProperty(key)) {
                if (elem) {
                    var value = collection[key];
                    elem(key, value);
                }
            }
        }
    }
    if (done) {
        done();
    }
};

$this.seq = function (iterable, callback, done) {
    var params = [];
    $this.for(iterable, function (key, value) {
        params.push([key, value]);
    });
    function doRecurse(idx, depth) {
        if (idx >= params.length) {
            if (done) {
                done();
            }
            return;
        }
        var param = params[idx];
        var next = function () {
            if (depth > 1000) {
                setTimeout(function () {
                    doRecurse(idx + 1, 0);
                }, 0);
            }
            else {
                doRecurse(idx + 1, depth + 1);
            }
        };
        callback(param[0], param[1], next);
    }
    doRecurse(0, 0);
};

$this.repeat = function (times, elem, done) {
    for (var i = 0; i < times; i++) {
        if (elem) {
            elem(i);
        }
    }
    if (done) {
        done();
    }
};

$this.chunks = function (iterable, chunkSize) {
    if (!chunkSize) {
        chunkSize = 100;
    }
    var isArray = $this.isArray(iterable);
    var chunks = [];
    var currentChunk = {};
    if (isArray) {
        currentChunk = [];
    }
    var currentNb = 0;
    $this.for(iterable, function (key, elem) {
        currentNb++;
        if (isArray) {
            currentChunk.push(elem);
        }
        else {
            currentChunk[key] = elem;
        }
        if (currentNb % chunkSize == 0) {
            chunks.push(currentChunk);
            currentChunk = {};
            if (isArray) {
                currentChunk = [];
            }
        }
    });
    if (currentNb % chunkSize != 0) {
        chunks.push(currentChunk);
    }
    return chunks;
};

$this.path = function (path) {
    path = path.replace("\\", "/");
    while (path.includes("//")) {
        path = path.replace("//", "/");
    }
    return path;
};

$this.sub = function (collection, idx, length) {
    var isArray = $this.isArray(collection);
    var results = {};
    if (isArray) {
        results = [];
    }
    var minIdx = idx;
    var maxIdx = idx + length;
    var i = 0;
    $this.for(collection, function (key, value) {
        if (i >= minIdx && i < maxIdx) {
            if (isArray) {
                results.push(value);
            }
            else {
                results[key] = value;
            }
        }
        i++;
    });
    return results;
};

$this.functions = _.functions;
$this.values = _.values;
$this.keys = _.keys;

$this.sortBy = _.sortBy;

module.exports = $this;
