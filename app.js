var _ = require('underscore-more');
var express = require('express');
var routes = require('./routes');
var admin = require('./routes/admin');
var http = require('http');
var path = require('path');
var hogan = require('hogan-express');
var passport = require('passport');

var settings = require('./config/settings');
var db = require('./lib/db');
db.initialize(settings.db);

var RedisStore = require('connect-redis')(express);

var session = require('./lib/session');
var users = require('./lib/user-management');

var app = express();

// all environments
app.set('port', process.env.PORT || 3333);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.set('layout', 'layout');

app.set('partials', {
  nav: 'nav.part.hjs'
});
app.set('lambdas', {
  lowercase: function (s) {
    return s.toLowerCase()
  }
});

app.engine('hjs', hogan);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(express.session({
  secret: settings.session.secret,
  store: new RedisStore()
}));
session.initialize(app);

app.use(addLocals);
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/admin', ensureAdmin, admin.index);
app.get('/admin/users', ensureAdmin, admin.users);
app.post('/admin/users', ensureAdmin, admin.save_user);
app.post('/admin/change_password/:id', ensureAdmin, admin.change_password);
app.put('/admin/users/:id', ensureAdmin, admin.save_user);
app.del('/admin/users/:id', ensureAdmin, admin.delete_user);

app.get('/admin/questions', ensureAdmin, admin.questions);
app.post('/admin/questions', ensureAdmin, admin.save_question);
app.put('/admin/questions/:id', ensureAdmin, admin.save_question);
app.del('/admin/questions/:id', ensureAdmin, admin.delete_question);

session.initializeRoutes(app, '/');

function ensureAdmin(req, res, next) {
  if ( req.isAuthenticated() && req.user.is_admin ) { return next(); }

  req.session.redirect_to = req.path;
  res.redirect('/admin/login');
}

function ensureLogin(req, res, next) {
  if ( req.isAuthenticated() ) { return next(); }
  req.session.redirect_to = req.path;
  res.redirect('/login');
}

function addLocals(req, res, next) {
  res.locals = (res.locals || {});
  res.locals.user = req.user;
  return next();
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
