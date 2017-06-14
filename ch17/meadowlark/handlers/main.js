/**
 * Created by eden90267 on 2017/6/12.
 */
var fortune = require("../lib/fortune.js");

exports.home = function (req, res) {
    res.render('home');
};
exports.about = function (req, res) {
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
};
exports.genericThankYou = function (req, res) {
    res.render('thank-you');
};
exports.newsletter = function (req, res) {
    res.render('newsletter', {csrf: 'CSRF token goes here'});
};
// for now, we're mocking NewsletterSignup:
function NewsletterSignup() {
}

NewsletterSignup.prototype.save = function (cb) {
    cb();
};
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
exports.newsletterProcessPost = function (req, res) {
    var name = req.body.name || '',
        email = req.body.email || '';
    // 輸入驗證
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) return res.json({error: 'Invalid name email address'});
        req.session.flash = {
            type: 'danger',
            intro: 'validation error!',
            message: 'The email address you entered was not valid.',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({name: name, email: email}).save(function (err) {
        if (err) {
            if (req.xhr) return res.json({error: 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if (req.xhr) return res.json({success: true});
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/newsletter/archive');
    });
};
exports.newsletterArchive = function (req, res) {
    res.render('newsletter/archive');
};
exports.processPost = function (req, res) {
    if (req.xhr || req.accepts('json,html') === 'json') {
        // 如果有錯誤的話，我們會傳送{error:'error description'}
        res.send({success: true});
    } else {
        // 如果有錯誤的話，我們會重新導向一個錯誤網頁
        res.redirect(303, '/thank-you');
    }
};