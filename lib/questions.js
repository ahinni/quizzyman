var _ = require('underscore-more');
var util = require('util');
var db = require('./db');

var mainKeys = [
  'question',
  'correct_answer'
];

function create( params, callback ) {
  var sql = "insert into questions ("+mainKeys.join(',')+") VALUES("+db.dbifyValues(_.pickValues(params, mainKeys))+")";
  db.query(sql, callback);
}

function save( params, callback ) {
  var data = _.extend({
    modified_at: new Date()
  }, _.pick(params, mainKeys));
  var sql = "update questions set "+db.dbifyKeyValues(params)+" where id="+db.escape(params.id);
  db.query(sql, callback);
}

function all(callback) {
  var sql = "select * from questions";
  db.query(sql, function(err, results) {
    if (err) console.log(err);
    else callback(err, _.map(results, normalize));
  });
}

function destroy( id, callback ) {
  var sql = "delete from questions where id="+db.escape(id);
  db.query(sql, callback);
}

function normalize(question) {
  if ( !question ) return undefined;

  question.choices = JSON.parse(question.choices || '[]');

  return question;
}

module.exports = {
  all: all,
  create: create,
  save: save,
  destroy: destroy,
};
