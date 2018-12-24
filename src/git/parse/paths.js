
module.exports = function (filePaths) {
    // Check if path contains renaming pattern
    var renameRegex1 = /({.* => .*})/gi;
    var renameCheck1 = filePaths.match(renameRegex1);
    if (renameCheck1) {
        // If it does, parse and reconstruct before => after paths
        var renameValue = renameCheck1[0];
        var renameParsed = renameValue.replace("{", "").replace("}", "");
        var renamePaths = renameParsed.split(" => ");
        // Format results
        var filePathBefore = filePaths.replace(renameValue, renamePaths[0]);
        var filePathAfter = filePaths.replace(renameValue, renamePaths[1]);
        return [filePathBefore, filePathAfter];
    }
    var renameRegex2 = /^(.* => .*)$/gi;
    var renameCheck2 = filePaths.match(renameRegex2);
    if (renameCheck2) {
        // If it does, parse and reconstruct before => after paths
        var renameValue = renameCheck2[0];
        var renamePaths = renameValue.split(" => ");
        // Format results
        var filePathBefore = filePaths.replace(renameValue, renamePaths[0]);
        var filePathAfter = filePaths.replace(renameValue, renamePaths[1]);
        return [filePathBefore, filePathAfter];
    }
    // If its just a regular file path
    return [filePaths];
};
