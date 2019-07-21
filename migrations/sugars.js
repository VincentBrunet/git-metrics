
/**
 * Sugar function for cleared, thinner
 * and easily debuggable migration scripts
 */
var $sugars = {};

// Migration object, list all actions to be done
// Also give nice shortcuts for most basic actions
$sugars.Operations = function (knex, Promise) {

  var self = this;

  // List of actions to be done by the migratio
  self._operations = [];

  // Simply create a table
  self.createTable = function (tableName, optionalNext) {
    self._operations.push(knex.schema.createTable(tableName, function (table) {
      table.increments("id");
      if (optionalNext) {
        optionalNext(table);
      }
      table.timestamp("created_time").defaultTo(knex.fn.now()).notNullable();
    }));
  };

  // Simply drop a table (CAREFULL MAN)
  self.dropTable = function (tableName) {
    self._operations.push(knex.schema.dropTable(tableName));
  };

  // Edit a table (pass a callback for actions to be done)
  self.editTable = function (tableName, next) {
    if (typeof tableName === "string") {
      self._operations.push(knex.schema.table(tableName, function (table) {
        return next(table);
      }));
    } else {
      var table = tableName;
      return next(table);
    }
  };

  // Add a column to a table
  self.addColumn = function (tableName, columnName, columnType, defaultValue, nullable) {
    self.editTable(tableName, function (table) {
      var columnTypeParam1 = undefined;
      var columnTypeParam2 = undefined;
      var columnTypeParam3 = undefined;
      if (Array.isArray(columnType)) {
        columnTypeParam1 = columnType[1];
        columnTypeParam2 = columnType[2];
        columnTypeParam3 = columnType[3];
        columnType = columnType[0];
      }
      var nc = table[columnType](columnName, columnTypeParam1, columnTypeParam2, columnTypeParam3);
      if (defaultValue !== undefined) {
        nc.defaultTo(defaultValue);
      }
      if (!nullable) {
        nc.notNullable();
      }
    });
  };

  // Drop a column from a table
  self.dropColumn = function (tableName, columnName) {
    self.editTable(tableName, function (table) {
      table.dropColumn(columnName);
    });
  };

  // Add an index on a table columns (optional indexname)
  self.addIndex = function (tableName, columns, indexName) {
    self.editTable(tableName, function (table) {
      table.index(columns, indexName);
    });
  };
  // Drop an index on a table columns
  self.dropIndex = function (tableName, columns, indexName) {
    self.editTable(tableName, function (table) {
      table.dropIndex(columns, indexName);
    });
  };

  // Add a unique tag
  self.addUnique = function (tableName, columns, indexName) {
    self.editTable(tableName, function (table) {
      table.unique(columns, indexName);
    });
  };

  // Remove unique tag
  self.dropUnique = function (tableName, columns, indexName) {
    self.editTable(tableName, function (table) {
      table.dropUnique(columns, indexName);
    });
  }

  // Add a cross-table column relation
  self.addForeignLink = function (tableName, columnName, destination) {
    self.editTable(tableName, function (table) {
      table.foreign(columnName).references(destination);
    });
  };

  // Custom script to execute on migration
  self.script = function (next) {
    var promise = new Promise(function (resolve, reject) {
      return next(knex, resolve, reject);
    });
    return self._operations.push(promise);
  };

  // Make a promise out of all previous actions
  self.done = function () {
    return Promise.all(self._operations);
  };
};

// Wrap migration callback with an Operation object as first parameter
// usefull for simple and easy migration
$sugars.migration = function (next) {
  return function (knex, Promise) {
    var m = new $sugars.Operations(knex, Promise);
    next(m, knex, Promise);
    return m.done();
  }
};

$sugars.up = function () {};
$sugars.down = function () {};

module.exports = $sugars;

