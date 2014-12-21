var _ = require('underscore-more');
var async = require('async');
var util = require('util');
var Questions = require('../lib/questions');

exports.index = function (req, res) {
  res.render('index', {});
};

exports.question = function (req, res) {
  Questions.lookupByOffset(req.params.index, function (err, question) {
    if (err) console.log(err);
    else console.log(util.inspect(question));
    res.render('question', {
      question: question
    });
  });
}
