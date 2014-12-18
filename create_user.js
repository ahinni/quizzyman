var session = require('./lib/user-management');
var db = require('./lib/db');
var util = require('util');

session.createUser('admin', '1admin', ['admin'], {}, function (err, user) {
  if (err) console.log(util.inspect(err));
  else console.log(util.inspect(user));
  db.shutdown();
});
