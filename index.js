var express = require('express');
var connect = require('connect');
var EventEmitter = require('events').EventEmitter;
var cookieParser = require('cookie-parser');

module.exports = exports = Atman;
exports.login = require('./modules/login');

function Atman(config) {
  if(!config) config = {};
  if(!config.title) config.title = 'Administration';
  if(!config.sessionSecret) throw new Error('missing sessionSecret');

  var passport = new (require('passport').Authenticator)();
  var app = express();
  app.register = function (fn) { fn(app); }

  app.public = new express.Router();

  var static = express.Router();
  app.static = function(path) {
    static.use(require('serve-static')(path));
  }

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('passport', passport);
  app.set('title', config.title);
  app.use(static);

  app.resolve = app.locals.resolve = function (path) {
    return (app.path()||'/') + (path||'').replace(/^\//, '');
  }

  app.use(require('cookie-parser')());
  app.use(require('body-parser')());
  app.use(require('express-session')({
    key: 'rwa-session',
    secret: config.sessionSecret
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(function (req, res, next) {
    if(req.isAuthenticated()) return next();
    app.public(req, res, function() { res.send(401); });
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

  return app;
}

