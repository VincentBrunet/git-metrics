
var typeIsArray = require("../type/isArray");
var dictValues = require("../dict/values");
var errorMake = require("../error/make");

module.exports = async function __(query) {
    try {
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
    } catch (e) {
        console.log("=============");
        query.debug();
        console.log("=============");
        console.log("FAILED", e);
        console.log("=============");
        throw errorMake("DatabaseError", "failed to execute", e);
    }
};
