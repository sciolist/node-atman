module.exports = exports = function login(config) {
  if(!config.serializeUser) config.serializeUser = function (id, done) { done(null, id); };
  if(!config.deserializeUser) config.deserializeUser = function (id, done) { done(null, { id: id, email: id }); };
  if(config.password) {
    config.test = function (username, password, done) {
      if(password === config.password && (username === (config.username || config.email))) {
        return done(null, username);
      }
      return done(null, false, 'invalid details');
    }
  }
  if(!config.test) throw new Error('missing test(username, password, done) function.');
  return loginModule;

  function loginModule(atman) {
    var app = atman.app;
    var passport = app.get('passport');
    var Strategy = require('passport-local').Strategy;
    passport.serializeUser(config.serializeUser);
    passport.deserializeUser(config.deserializeUser);
    passport.use('atman', config.strategy || new Strategy(config.test));

    app.post('/auth/login', function (req, res, next) {
      res.redirect('/');
    });

    app.public.post('/auth/login', function (req, res, next) {
      passport.authenticate('atman', function (err, user, info) {
        if(err) return next(err);
        if(!user) return res.redirect(app.resolve('/?failed=' + (info||'')));
        req.login(user, function (err) {
          if(err) return next(err);
          return res.redirect(app.path());
        });
      })(req, res, next);
    });

    app.public.get('/', function (req, res) {
      res.render(__dirname + '/views/login', {
        failed: req.query.failed,
        config: {
          root: app.path(),
          title: app.get('title'),
        }
      });
    });
  }
}

