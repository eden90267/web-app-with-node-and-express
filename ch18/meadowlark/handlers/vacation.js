/**
 * Created by eden90267 on 2017/6/12.
 */
var Vacation = require('../models/vacation'),
    VacationInSeasonListener = require('../models/vacationInSeasonListener');

exports.setCurrency = function (req, res) {
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
};

function convertFromUSD(value, currency) {
    switch (currency) {
        case 'USD':
            return value * 1;
        case 'GBP':
            return value * 0.6;
        case 'BTC':
            return value * 0.0023707918444761;
        default:
            return NaN;
    }
}

exports.list = function (req, res) {
    Vacation.find({available: true}, function (err, vacations) {
        var currency = req.session.currency || 'USD';
        var context = {
            currency: currency,
            vacations: vacations.map(function (vacation) {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.priceInCents / 100, currency),
                    qty: vacation.qty,
                };
            })
        };
        switch (currency) {
            case 'USD':
                context.currencyUSD = 'selected';
                break;
            case 'GBP':
                context.currencyGBP = 'selected';
                break;
            case 'BTC':
                context.currencyBTC = 'selected';
                break;
        }
        res.render('vacations', context);
    });
};

exports.notifyWhenInSeason = function (req, res) {
    res.render('notify-me-when-in-season', {sku: req.query.sku});
};
exports.notifyWhenInSeasonProcessPost = function (req, res) {
    VacationInSeasonListener.update(
        {email: req.body.email},
        {$push: {skus: req.body.sku}},
        {upsert: true},
        function (err) {
            if (err) {
                console.error(err.stack);
                req.session.flash = {
                    type: 'danger',
                    intro: 'Oops!',
                    message: 'There was an error processing your request.',
                };
                return res.redirect(303, '/vacations');
            }
            req.session.flash = {
                type: 'success',
                intro: 'Thank you',
                message: 'You will be notified when this vacation is in season.'
            };
            return res.redirect(303, '/vacations');
        });
};