/**
 * Created by eden90267 on 2017/6/2.
 */
var http = require('http'),
    fs = require('fs'),
    express = require('express'),
    formidable = require('formidable'),
    jqupload = require('jquery-file-upload-middleware'),
    nodemailer = require('nodemailer'),
    mongoose = require('mongoose');

var fortune = require('./lib/fortune'),
    credentials = require('./credentials'),
    cartValidation = require('./lib/cartValidation'),
    emailService = require('./lib/email')(credentials),
    Vacation = require('./models/vacation'),
    VacationInSeasonListener = require('./models/vacationInSeasonListener');

var app = express();

// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// 可藉由設定環境值(PORT)來改寫連接埠
app.set('port', process.env.PORT || 3000);

app.use(function (req, res, next) {
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
    next();
});

app.use(function (req, res, next) {
    // 為這個請求建立一個領域
    var domain = require('domain').create();
    // 在這個領域中處理錯誤
    domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 在5秒內關機
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // 中斷與叢集的連線
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();

            // 停止取用新的請求
            server.close();

            try {
                // 嘗試使用Express錯誤路由
                next(err);
            } catch (error) {
                // 如果Express錯誤路由失敗，嘗試一般的Node回應
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Server error');
            }
        } catch (error) {
            console.error('Unable to send 500 response.\n', error.stack);
        }
    });

    // 將請求與回應物件加到領域
    domain.add(req);
    domain.add(res);

    // 執行領域中剩餘的請求鏈
    domain.run(next);
});

// logging
switch (app.get('env')) {
    case 'development':
        // 緊湊、彩色的開發日誌
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // 'express-logger'模組支援每日日誌切換
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

var opts = {
    server: {
        socketOptions: {
            keepAlive: 1
        }
    }
};
switch (app.get('env')) {
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

// initialize vacations
Vacation.find(function (err, vacations) {
    if (vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});

app.use(require('cookie-parser')(credentials.cookieSecret));

var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var store;
switch (app.get('env')) {
    case 'development':
        store = new RedisStore({port: credentials.redis.development.port, host: credentials.redis.development.host});
        break;
    case 'production':
        store = new RedisStore({port: credentials.redis.production.port, host: credentials.redis.production.host});
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: store,
}));
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());


app.use(function (req, res, next) {
    // 如果有閃爍訊息，將它轉換至內容，接著移除它
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

app.use('/upload', function (req, res, next) {
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function () {
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function () {
            return '/uploads/' + now;
        },
    })(req, res, next);
});

// mocked weather data
function getWeatherData() {
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}

app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData();
    next();
});

app.get('/', function (req, res) {
    res.render('home');
});
app.get('/about', function (req, res) {
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});
app.get('/tours/hood-river', function (req, res) {
    res.render('tours/hood-river');
});
app.get('/tours/oregon-coast', function (req, res) {
    res.render('tours/oregon-coast');
});
app.get('/tours/request-group-rate', function (req, res) {
    res.render('tours/request-group-rate');
});
app.get('/jquerytest', function (req, res) {
    res.render('jquerytest');
});
app.get('/nursery-rhyme', function (req, res) {
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function (req, res) {
    res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck',
    });
});
app.get('/thank-you', function (req, res) {
    res.render('thank-you');
});
app.get('/newsletter', function (req, res) {
    res.render('newsletter', {csrf: 'CSRF token goes here'});
});
// for now, we're mocking NewsletterSignup:
function NewsletterSignup() {
}
NewsletterSignup.prototype.save = function (cb) {
    cb();
};
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
app.post('/newsletter', function (req, res) {
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
});
app.get('/newsletter/archive', function (req, res) {
    res.render('newsletter/archive');
});
app.post('/process', function (req, res) {
    if (req.xhr || req.accepts('json,html') === 'json') {
        // 如果有錯誤的話，我們會傳送{error:'error description'}
        res.send({success: true});
    } else {
        // 如果有錯誤的話，我們會重新導向一個錯誤網頁
        res.redirect(303, '/thank-you');
    }
});
app.get('/contest/vacation-photo', function (req, res) {
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });
});

var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath) {
    // 待辦...稍後加入
}

app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
        if (err) {
            res.session.flash = {
                type: 'danger',
                intro: 'Oops!',
                message: 'There was an error processing your submission. Please try again.'
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo;
        var dir = vacationPhotoDir + '/' + Date.now();
        var path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Good luck',
            message: 'You have been entered into the contest.'
        };
        return res.redirect(303, '/contest/vacation-photo/entries');
    });
});

app.get('/fail', function (req, res) {
    throw new Error('Nope!');
});
app.get('/epic-fail', function (req, res) {
    process.nextTick(function () {
        throw new Error('Kaboom!');
    });
});

app.get('/set-currency/:currency', function (req, res) {
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
});

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

app.get('/vacations', function (req, res) {
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
                    price: convertFromUSD(vacation.priceInCents/100, currency),
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
});

// app.use(require('./lib/tourRequiresWaiver'));
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

app.get('/cart/add', function (req, res, next) {
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
});
app.get('/cart', function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) next();
    res.render('cart', {cart: cart});
});
app.get('/cart/checkout', function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) next();
    res.render('cart-checkout');
});
app.get('/cart/thank-you', function (req, res) {
    res.render('cart-thank-you', {cart: req.session.cart});
});
app.get('/email/cart/thank-you', function (req, res) {
    res.render('email/cart-thank-you', {cart: req.session.cart, layout: null});
});
app.post('/cart/checkout', function (req, res) {
    var cart = req.session.cart;
    if (!cart) next(new Error('Cart does not exist'));
    var name = req.body.name || '', email = req.body.email || '';
    // 輸入驗證
    if (!email.match(VALID_EMAIL_REGEX)) {
        return res.next(new Error('Invalid email address.'));
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
});
app.get('/notify-me-when-in-season', function (req, res) {
    res.render('notify-me-when-in-season', {sku: req.query.sku});
});
app.post('/notify-me-when-in-season', function (req, res) {
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
});


// 404全部抓取處理程式(中介軟體)
app.use(function (req, res) {
    res.status(404).render('404');
});

// 500錯誤處理程式(中介軟體)
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
});

var server;

function startServer() {
    server = http.createServer(app).listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + ';' +
            ' press Ctrl-C to terminate.');
    });
}

if (require.main === module) {
    // 應用程式直接執行，啟動app伺服器
    startServer();
} else {
    // 應用程式透過“需求”被提升為模組：會出函式至建構伺服器
    module.exports = startServer;
}