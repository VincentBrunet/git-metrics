
$this = {};

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

module.exports = $this;