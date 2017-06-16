/**
 * Created by eden_liu on 2017/6/16.
 */
var User = require('../models/user'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err || !user) return done(err, null);
        done(null, user);
    });
});

module.exports = function (app, options) {

    // 如果沒有指定重新導向成功或失敗，設定一些合理的預設值
    if (!options.sucessRedirect)
        options.sucessRedirect = '/account';
    if (!options.failureRedirect)
        options.failureRedirect = '/login';

    return {
        init: function () {
            var env = app.get('env');
            var config = options.providers;

            // 設定Facebook策略
            passport.use(new FacebookStrategy({
                clientID: config.facebook[env].appId,
                clientSecret: config.facebook[env].appSecret,
                callbackURL: (options.baseUrl || '') + '/auth/facebook/callback',
            }, function (accessToken, refreshToken, profile, done) {
                var authId = 'facebook:' + profile.id;
                User.findOne({authId: authId}, function (err, user) {
                    if (err) return done(err, null);
                    if (user) return done(null, user);
                    user = new User({
                        authId: authId,
                        name: profile.displayName,
                        created: Date.now(),
                        role: 'customer',
                    });
                    user.save(function (err) {
                        if (err) return done(err, null);
                        done(null, user);
                    });
                });
            }));

            app.use(passport.initialize());
            app.use(passport.session());
        },
        registerRoutes: function () {
            // 註冊Facebook路由
            app.get('/auth/facebook', function (req, res, next) {
                passport.authenticate('facebook', {
                    callbackURL: '/auth/facebook/callback?redirect=' + encodeURIComponent(req.query.redirect)
                })(req, res, next);
            });
            app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: options.failureRedirect}, function (req, res) {
                // 只有在成功驗證時才會到這裡
                res.redirect(303, req.query.redirect || options.successRedirect);
            }));
        }
    };
};