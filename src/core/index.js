
var _ = require("lodash");

var $this = {};

$this.for = function (collection, elem, done) {
    if (Array.isArray(collection)) {
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

$this.chunks = function (list, chunkSize) {
    var chunks = [];
    var currentChunk = [];
    var currentNb = 0;
    $this.for(list, function (idx, elem) {
        currentNb++;
        currentChunk.push(elem);
        if (currentNb % chunkSize == 0) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    });
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    return chunks;
};

$this.functions = _.functions;
$this.values = _.values;
$this.keys = _.keys;

$this.isArray = _.isArray;

module.exports = $this;