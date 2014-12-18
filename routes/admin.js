var _ = require('underscore-more');
var async = require('async');
var Users = require('../lib/user-management');
var Questions = require('../lib/questions');
var util = require('util');

var PER_PAGE = 100;

function pagination(options) {
  var pages = _.map(_.range(1,options.totalPages+1), function (n) {
    return {
      label: n,
      page: n,
      state: n === options.currentPage ? 'active' : ''
    }
  });

  return _.flatten([
    { label: '&laquo;', state: options.currentPage === 1 ? 'disabled' : '', page: options.currentPage-1 },
    pages,
    { label: '&raquo;', state: options.currentPage === options.totalPages ? 'disabled' : '', page: options.currentPage+1 }
  ]);
}

function lookupName(user_id, users) {
  if ( !user_id ) return '';

  var user = _.find(users, function (u) { return u.id == user_id; });
  return user ? user.name : '';
}

exports.index = function (req, res) {
  res.redirect('/admin/questions');
};

exports.users = function (req, res) {
  var currentPage = +(req.query.page || 1);
  var offset = (currentPage-1)*PER_PAGE;
  async.auto({
    total: Users.userCount,
    users: _.bind(Users.all, null, PER_PAGE, offset)
  }, function (err, results) {
    var ops = {
      total: results.total,
      currentPage: currentPage,
      totalPages: Math.ceil(results.total/PER_PAGE) || 1
    };
    res.render('admin/users', {
      title: "Admin - Users",
      user: req.user,
      users: results.users,
      raw_users: JSON.stringify(results.users),
      pages: pagination(ops),
      paginationOps: ops
    });
  });
}

exports.save_user = function (req, res, next) {
  var callback = function (err, result) {
    if (err) {
      return res.json(422, err.message);
    }
    else {
      res.json(result);
    }
  };
  var roles = [];
  if ( req.body.is_admin ) roles.push('admin');
  req.body.roles = roles;

  if ( req.params.id ) Users.updateUser(req.body, callback);
  else Users.createUser(req.body.username, req.body.password, roles, req.body, callback);
};

exports.delete_user = function (req, res) {
  Users.deleteUser(req.params.id, function (err, results) {
    if (err) res.json({ success: false, error: err });
    else res.json({success: true});
  });
};

exports.change_password = function (req, res) {
  var callback = function (err, result) {
    if (err) console.log(err);
    res.redirect('/dashboard');
  };

  Users.updatePassword(req.params.id, req.body.password, function (err, result) {
    if (err) return res.json(422, err.message);
    res.json({ success: true });
  });
};

exports.questions = function (req, res) {
  Questions.all( function (err, questions) {
    console.log(questions);
    res.render('admin/questions', {
      title: "Questions",
      raw_questions: JSON.stringify(questions)
    });
  });
}

exports.save_question = function (req, res) {
  var callback = function (err, result) {
    if (err) console.log(err);
    res.json({ success: true });
  };
  if ( req.body.id ) Questions.save(req.body, callback);
  else Questions.create(req.body, callback);
}

exports.delete_question = function (req, res) {
  Questions.destroy(req.params.id, function (err, results) {
    if (err) res.send(err.message);
    else res.json({success: true});
  });
};
