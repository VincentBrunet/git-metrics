var bb = require("../../../bb");

module.exports = function (query, column, timezone, timechunks) {
    // Timezone specific
    var tz = (timezone && bb.moment.tz.zone(timezone).name) || "UTC";
    // Month of Year
    var moy = timechunks && timechunks.includes("moy");
    // Week of Year
    var woy = timechunks && timechunks.includes("woy");
    // Day of Year
    var doy = timechunks && timechunks.includes("doy");
    // Day of Month
    var dom = timechunks && timechunks.includes("dom");
    // Day of Week
    var dow = timechunks && timechunks.includes("dow");
    // ISO Day of Week
    var isodow = timechunks && timechunks.includes("isodow");
    // Hour of Day
    var hod = timechunks && timechunks.includes("hod");
    // Month of Year
    if (moy) {
        var obj = {};
        obj[column + "_moy"] = bb.database.raw("extract(month from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Week of Year
    if (woy) {
        var obj = {};
        obj[column + "_woy"] = bb.database.raw("extract(week from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Day of Year
    if (doy) {
        var obj = {};
        obj[column + "_doy"] = bb.database.raw("extract(doy from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Day of Month
    if (dom) {
        var obj = {};
        obj[column + "_dom"] = bb.database.raw("extract(day from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Day of Week
    if (dow) {
        var obj = {};
        obj[column + "_dow"] = bb.database.raw("extract(dow from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // ISO Day of Week
    if (isodow) {
        var obj = {};
        obj[column + "_isodow"] = bb.database.raw("extract(isodow from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Hour of Day
    if (hod) {
        var obj = {};
        obj[column + "_hod"] = bb.database.raw("extract(hour from timezone('" + tz + "', " + column + "))");
        query.columns(obj);
    }
    // Month of Year
    if (moy) {
        query.groupBy(column + "_moy");
    }
    // Week of Year
    if (woy) {
        query.groupBy(column + "_woy");
    }
    // Day of Year
    if (doy) {
        query.groupBy(column + "_doy");
    }
    // Day of Month
    if (dom) {
        query.groupBy(column + "_dom");
    }
    // Day of Week
    if (dow) {
        query.groupBy(column + "_dow");
    }
    // ISO Day of Week
    if (isodow) {
        query.groupBy(column + "_isodow");
    }
    // Hour of Day
    if (hod) {
        query.groupBy(column + "_hod");
    }
    // Month of Year
    if (moy) {
        query.orderBy(column + "_moy");
    }
    // Week of Year
    if (woy) {
        query.orderBy(column + "_woy");
    }
    // Day of Year
    if (doy) {
        query.orderBy(column + "_doy");
    }
    // Day of Month
    if (dom) {
        query.orderBy(column + "_dom");
    }
    // Day of Week
    if (dow) {
        query.orderBy(column + "_dow");
    }
    // ISO Day of Week
    if (isodow) {
        query.orderBy(column + "_isodow");
    }
    // Hour of Day
    if (hod) {
        query.orderBy(column + "_hod");
    }
};