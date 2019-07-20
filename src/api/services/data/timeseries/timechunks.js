var bb = require("../../../../bb");

function chunk(query, column, tz, timechunks, prefix, code) {
    var found = timechunks && timechunks.includes(prefix);
    if (found) {
        var created = column.replace(".", "_") + "_" + prefix;
        var obj = {};
        obj[created] = bb.database.raw("extract(" + code + " from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
        query.groupBy(created);
        query.orderBy(created);
    }
    for (var i = 1; i < 50; i++) {
        var nprefix = prefix + "(" + i + ")";
        var created = column.replace(".", "_") + "_" + nprefix;
        var found = timechunks && timechunks.includes(nprefix);
        if (found) {
            var obj = {};
            obj[created] = bb.database.raw("ROUND(extract(" + code + " from timezone('" + tz + "', " + column + "))/" + i + ")*" + i);
            query.columns(obj);
            query.groupBy(created);
            query.orderBy(created);
        }
    }
}

module.exports = function (query, column, timezone, timechunks) {
    // Timezone specific
    var tz = (timezone && bb.moment.tz.zone(timezone).name) || "UTC";
    // Time possible chunks
    chunk(query, column, tz, timechunks, "qoy", "quarter");
    chunk(query, column, tz, timechunks, "moy", "month");
    chunk(query, column, tz, timechunks, "woy", "week");
    chunk(query, column, tz, timechunks, "doy", "doy");
    chunk(query, column, tz, timechunks, "dom", "day");
    chunk(query, column, tz, timechunks, "dow", "dow");
    chunk(query, column, tz, timechunks, "isodow", "isodow");
    chunk(query, column, tz, timechunks, "hod", "hour");
};
