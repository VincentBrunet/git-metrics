
var typeIsArray = require("../type/isArray");
var dictValues = require("../dict/values");

module.exports = async function __(query) {
    // If its a batch
    if (typeIsArray(query)) {
        var datas = [];
        for (var i = 0; i < query.length; i++) {
            datas.push(await __(query[i]));
        }
        return datas;
    }
    // If its a single query
    else {
        var datas = await query._internal;
        if (!typeIsArray(datas)) {
            datas = dictValues(datas);
        }
        return datas;
    }
};
