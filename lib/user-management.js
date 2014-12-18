var _ = require('underscore-more');
var async = require('async');
var crypto = require('crypto');
var util = require('util');
var db = require('./db');

var ROLES = ['admin'];

function login(username, password, callback) {
  findByUsername(username, function (err, user) {
    if (err || !user) callback(null);
    else {
      callback(validatePassword(password, user.password_hash) ? user : null );
    }
  });
}

function insert(params, callback) {
  createUser(params.username, params.password, params.roles, params, callback);
}

function createUser(username, password, roles, params, callback) {
  findByUsername(username, function (err, user) {
    if (err) callback(err);
    else {
      if (user) callback(new Error('username address already in use'));
      else {
        var now = new Date();
        var sql = "insert into users (username, password_hash, roles, name, created_at, modified_at)" +
          "VALUES("+db.dbifyValues([username, saltAndHash(password), roles || [], params.name, now, now])+')';

        db.query(sql, function (err, results) {
          if (err) callback(err);
          else findByUsername(username, callback);
        });
      }
    }
  });
}

function updateUser(user, callback) {
  var data = _.extend({
    modified_at: new Date()
  }, _.pick(user, ['name', 'username', 'roles']));

  if ( user.password )
    data.password = saltAndHash(user.password);

  var sql = "update users SET " + db.dbifyKeyValues(data) +
    " WHERE username=" + db.escape(user.username);

  db.query(sql, function (err, results) {
    if (err) callback(err);
    else findByUsername(user.username, callback);
  });
}

function updatePassword(user_id, password, callback) {
  var data = {
    modified_at: new Date(),
    password_hash: saltAndHash(password)
  };

  var sql = "update users SET " + db.dbifyKeyValues(data) +
    " WHERE id=" + db.escape(user_id);
  db.query(sql, function (err, results) {
    if (err) callback(err);
    else findById(user_id, callback);
  });
}


function deleteUser(user_id, callback) {
  db.query("DELETE FROM users WHERE id="+db.escape(user_id), function (err, results) {
    callback(err, results);
  });
}

function findByUsername(username, callback) {
  db.query("select * from users where username="+db.escape(username), function (err, results) {
    if (err) callback(err);
    else callback(null, normalize(results[0]) || null);
  });
}

function findById(id, callback) {
  db.query("select * from users where id="+db.escape(id), function (err, results) {
    if (err) callback(err);
    else callback(null, normalize(results[0]) || null);
  });
}

function all(limit, offset, callback) {
  db.query("select * from users order by username ASC LIMIT " + db.escape(limit) + " OFFSET " + db.escape(offset), function( err, results) {
    callback(err, _.map(results, normalize));
  });
}

function userCount(callback) {
  db.query("select count(*) existing from users", function (err, results) {
    if (err) callback(err);
    else callback(null, results[0].existing);
  });
}

function normalize(user) {
  if (!user) return undefined;
  user.roles = JSON.parse(user.roles || '[]');

  _.each(ROLES, function (r) {
    user['is_'+r] = isRole(user, r);
  });

  return user;
}

function validatePassword(plain, storedHashed) {
  var salt = storedHashed.substr(0,10);
  var hasherized = salt +  md5(plain+salt);
  return hasherized === storedHashed;
}

function generateSalt() {
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

function saltAndHash(pass) {
	var salt = generateSalt();
  return salt + md5(pass + salt);
}

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}


function isRole(user, role) {
    return _.include(user.roles || [], role);
}

module.exports = {
  login: login,
  createUser: createUser,
  updateUser: updateUser,
  updatePassword: updatePassword,
  deleteUser: deleteUser,
  all: all,
  userCount: userCount,
  findById: findById,
  findByUsername: findByUsername
};
