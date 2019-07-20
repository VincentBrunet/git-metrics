var bb = require("../../../../bb");

module.exports = function (query, column, timezone, timelimits) {
    // Sanitize
    timelimits = timelimits || {};
    timelimits["min"] = timelimits["min"] || timelimits[0];
    timelimits["max"] = timelimits["max"] || timelimits[1];
    // Timezone specific
    var tz = (timezone && bb.moment.tz.zone(timezone).name) || "UTC";
    // Time limits
    if (timelimits.min) {
        query.where(column, ">=", bb.moment(timelimits.min).format());
    }
    if (timelimits.max) {
        query.where(column, "<=", bb.moment(timelimits.max).format());
    }
};
