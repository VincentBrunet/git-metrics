
var typeIsArray = require("../type/isArray");
var dictValues = require("../dict/values");
var errorMake = require("../error/make");

module.exports = async function __(query) {
    try {
        // If its a batch
        if (typeIsArray(query)) {
            var datasCombined = [];
            for (var i = 0; i < query.length; i++) {
                var datas = await __(query[i]);
                for (var j = 0; j < datas.length; j++) {
                    datasCombined.push(datas[j]);
                }
            }
            return datasCombined;
        }
        // If its a single query
        else {
            var datas = await query._internal;
            if (!typeIsArray(datas)) {
                datas = dictValues(datas);
            }
            return datas;
        }
    } catch (e) {
        throw errorMake("DatabaseError", "failed to combine", e);
    }
};
