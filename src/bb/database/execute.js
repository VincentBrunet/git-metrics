
var _ = require("lodash");

module.exports = async function __(query) {
    // If its a batch
    if (_.isArray(query)) {
        var datas = [];
        for (var i = 0; i < query.length; i++) {
            var tempDatas = await __(query[i]);
            for (var j = 0; j < tempDatas.length; j++) {
                datas.push(tempDatas[j]);
            }
        }
        return datas;
    }
    // If its a single query
    else {
        var datas = await query._internal;
        if (!_.isArray(datas)) {
            datas = _.values(datas);
        }
        return datas;
    }
};
