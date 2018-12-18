// Update with your config settings.

module.exports = {

  /*
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },
  //*/

  ///*
  development: {
    client: 'pg',
    version: '7.2',
    connection: {
        host: '127.0.0.1',
        user: 'vincent',
        port: 5432, 
        password: '',
        database: 'git-metrics'
    },
  },
  //*/

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
