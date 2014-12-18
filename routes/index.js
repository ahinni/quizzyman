var _ = require('underscore-more');
var async = require('async');
var util = require('util');

exports.index = function (req, res) {
  res.render('index', {});
};
