
module.exports = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "./database/dev.sqlite3",
    },
});
