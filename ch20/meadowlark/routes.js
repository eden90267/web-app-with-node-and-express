/**
 * Created by eden90267 on 2017/6/12.
 */
var main = require('./handlers/main'),
    sample = require('./handlers/sample'),
    contest = require('./handlers/contest'),
    vacation = require('./handlers/vacation'),
    cartValidation = require('./lib/cartValidation'),
    cart = require('./handlers/cart'),
    dealers = require('./handlers/dealers');

module.exports = function (app) {

    app.get('/', main.home);
    app.get('/about', main.about);
    app.get('/thank-you', main.genericThankYou);
    app.get('/newsletter', main.newsletter);
    app.post('/newsletter', main.newsletterProcessPost);
    app.get('/newsletter/archive', main.newsletterArchive);
    app.post('/process', main.processPost);

    app.get('/contest/vacation-photo', contest.vacationPhoto);
    app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoProcessPost);
    app.get('/contest/vacation-photo/entries', contest.vacationPhotoEntries);

    app.get('/set-currency/:currency', vacation.setCurrency);
    app.get('/vacations', vacation.list);
    app.get('/notify-me-when-in-season', vacation.notifyWhenInSeason);
    app.post('/notify-me-when-in-season', vacation.notifyWhenInSeasonProcessPost);

// app.use(require('./lib/tourRequiresWaiver'));
    app.use(cartValidation.checkWaivers);
    app.use(cartValidation.checkGuestCounts);

    app.get('/cart/add', cart.addProcess);
    app.get('/cart', cart.home);
    app.get('/cart/checkout', cart.checkout);
    app.get('/cart/thank-you', cart.thankYou);
    app.get('/email/cart/thank-you', cart.emailThankYou);
    app.post('/cart/checkout', cart.checkoutProcessPost);


    app.get('/fail', sample.fail);
    app.get('/epic-fail', sample.epicFail);
    app.get('/jquerytest', sample.jqueryTest);
    app.get('/nursery-rhyme', sample.nurseryRhyme);
    app.get('/data/nursery-rhyme', sample.nurseryRhymeData);

    // dealers
    app.get('/dealers', dealers.home);
};