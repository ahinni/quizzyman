var _ = require('underscore-more');
var mysql = require('mysql');

var Context = {
  settings: {},
  defaultSettings: {
    host: 'localhost'
  },
  pool: undefined
};

function initialize(options) {
  _.extend(Context.settings, options, Context.defaultSettings);
  Context.pool = mysql.createPool(Context.settings);
}


function query(sql, callback) {
  Context.pool.query(sql, callback);
}

function escape(s) {
  return Context.pool.escape(s);
}

function shutdown() {
  Context.pool.end();
}

function dbify(value) {
  var preProcessed = (_.isArray(value) || (_.isObject(value) && !_.isDate(value))) ? JSON.stringify(value) : value;
  return escape(preProcessed);
}

function dbifyValues(values) {
  return _.map(values, dbify).join(',');
}

function dbifyKeyValues(data) {
  return _.chain(data)
          .pairs()
          .reject( function (pair) { return pair[1] === undefined; } )
          .map( function(pair) { return pair[0] +'=' + dbify(pair[1]); })
          .value()
          .join(',');
}

module.exports = {
  initialize: initialize,
  query: query,
  escape: escape,
  dbifyValues: dbifyValues,
  dbifyKeyValues: dbifyKeyValues,
  shutdown: shutdown
};
