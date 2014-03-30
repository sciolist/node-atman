var express = require('express');
var connect = require('connect');

module.exports = exports = Atman;
exports.login = require('./modules/login');

function Atman(config) {
  if(!config) config = {};
  if(!config.title) config.title = 'Administration';

  var passport = new (require('passport').Authenticator)();
  function atman(req, res, next) { app(req, res, next); }
  atman.config = config;
  atman.modules = [];
  atman.use = function (module) {
    module(this, module);
  }

  var app = atman.modules['admin'] = express();
  atman.app = app;
  app.public = express();
  app.public.parent = app;

  var static = connect();
  app.static = function(path) {
    static.use(connect.static(path));
  }

  function shared(app) {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('passport', passport);
    app.set('title', config.title);

    app.resolve = app.locals.resolve = function (path) {
      return (app.path()||'/') + (path||'').replace(/^\//, '');
    }

    app.use(express.cookieParser());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.cookieSession({ key: 'rwa-session', secret: config.sessionSecret }));
    app.use(passport.initialize());
    app.use(passport.session());
  }

  app.configure(function () {
    app.use(static);
    shared(app);
    app.use(function (req, res, next) {
      if(req.isAuthenticated()) return next();
      app.public(req, res, function() { res.send(401); });
    });
    app.use(app.router);
  });

  app.public.configure(function () {
    shared(app.public);
    app.public.use(app.public.router);
  });

  app.static(__dirname + '/static');
  app.public.get('/auth/logout', function (req, res)  { res.redirect(app.path()) });
  app.get('/auth/logout', function (req, res) { req.logout(); res.redirect(app.path()); });

  app.get('/', function (req, res) {
    var config = {
      root: app.path(),
      title: app.get('title'),
    };

    var locals = { user: req.user, config: config, required: [], head: [] }
    app.emit('require', locals.required);
    app.emit('head', locals.head);
    res.render('index', locals);
  });

  return atman;
}

