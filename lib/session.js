var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./user-management');


module.exports = {
  initialize: function (app) {
    passport.serializeUser(function (user, done) {
      done(null, {type: 'user', id: user.id});
    });

    passport.deserializeUser(function (obj, done) {
      users.findById(obj.id, function (err, user) {
        done(err, user);
      });
    });

    passport.use(new LocalStrategy(
      function (username, password, done) {
        users.login(username, password, function (user) {
          return user ? done(null, user) : done(null, false, { message: "Invalid username or password" });
        });
      }
    ));

    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
  },

  initializeRoutes: function (app, redirectTo) {
    app.get('/login', function (req, res) {
      res.render('login', { user: req.user, message: req.flash('error') });
    });

    app.post('/login',
      passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
      function (req, res) {
        req.user.is_admin ? res.redirect('/admin') : res.redirect('/');
      });

    // admin routes
    app.get('/admin/login', function (req, res) {
      res.render('admin/login', { user: req.user, message: req.flash('error') });
    });

    app.post('/admin/login',
      passport.authenticate('local', { failureRedirect: '/admin/login', failureFlash: true }),
      function (req, res) {
        res.redirect('/admin');
      });

    app.get('/admin/logout', function(req, res){
      req.logout();
      res.redirect('/admin/login');
    });
  }
};

