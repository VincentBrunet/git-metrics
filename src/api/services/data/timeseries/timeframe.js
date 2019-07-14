var bb = require("../../../../bb");

function frame(query, column, tz, timeframe, code) {
    var found = timeframe && timeframe == code;
    if (found) {
        var obj = {};
        obj[column + "_" + code] = bb.database.raw("date_trunc('" + code + "', timezone('" + tz + "', " + column + "))");
        query.columns(obj);
        query.groupBy(column + "_" + code);
        query.orderBy(column + "_" + code);
    }
};

module.exports = function (query, column, timezone, timeframe) {
    // Timezone specific
    var tz = (timezone && bb.moment.tz.zone(timezone).name) || "UTC";
    // Time possible frames
    frame(query, column, tz, timeframe, "microsecond");
    frame(query, column, tz, timeframe, "millisecond");
    frame(query, column, tz, timeframe, "second");
    frame(query, column, tz, timeframe, "minute");
    frame(query, column, tz, timeframe, "hour");
    frame(query, column, tz, timeframe, "day");
    frame(query, column, tz, timeframe, "week");
    frame(query, column, tz, timeframe, "month");
    frame(query, column, tz, timeframe, "quarter");
    frame(query, column, tz, timeframe, "year");
    frame(query, column, tz, timeframe, "decade");
    frame(query, column, tz, timeframe, "century");
    frame(query, column, tz, timeframe, "millenium");
};
