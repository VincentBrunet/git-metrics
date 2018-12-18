
module.exports = function (path) {
    path = path.replace("\\", "/");
    while (path.includes("//")) {
        path = path.replace("//", "/");
    }
    return path;
};
