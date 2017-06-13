/**
 * Created by eden90267 on 2017/6/12.
 */
var Vacation = require('../models/vacation'),
    credentials = require('../credentials'),
    emailService = require('../lib/email')(credentials);

exports.addProcess = function (req, res, next) {
    var cart = req.session.cart || (req.session.cart = {items: []});
    Vacation.findOne({sku: req.query.sku}, function (err, vacation) {
        if (err) return next(err);
        if (!vacation) return next(new Error('Unknown vacation SKU: ' + req.query.sku));
        cart.items.push({
            vacation: vacation,
            guests: req.body.guests || 1,
        });
        res.redirect(303, '/cart');
    });
};
exports.home = function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) next();
    res.render('cart', {cart: cart});
};
exports.checkout = function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) next();
    res.render('cart-checkout');
};
exports.thankYou = function (req, res) {
    res.render('cart-thank-you', {cart: req.session.cart});
};
exports.emailThankYou = function (req, res) {
    res.render('email/cart-thank-you', {cart: req.session.cart, layout: null});
};
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
exports.checkoutProcessPost = function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) return next(new Error('Cart does not exist'));
    var name = req.body.name || '', email = req.body.email || '';
    // 輸入驗證
    if (!email.match(VALID_EMAIL_REGEX)) {
        return next(new Error('Invalid email address.'));
    }
    // 指定隨機的購物車ID，通常我們會在這裡使用資料庫ID
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
        name: name,
        email: email,
    };
    res.render('email/cart-thank-you', {
        layout: null,
        cart: cart
    }, function (err, html) {
        if (err) console.log('error in email template');
        emailService.send(cart.billing.email,
            'Thank you for booking your trip with Meadowlark Travel!',
            html);
    });
    res.render('cart-thank-you', {cart: cart});
};