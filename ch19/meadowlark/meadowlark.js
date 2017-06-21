/**
 * Created by eden90267 on 2017/6/2.
 */
var https = require('https'),
    connect = require('connect'),
    express = require('express'),
    mongoose = require('mongoose'),
    vhost = require('vhost'),
    jqupload = require('jquery-file-upload-middleware'),
    fs = require('fs'),
    Q = require('q');

var credentials = require('./credentials'),
    Vacation = require('./models/vacation'),
    Dealer = require('./models/dealer');

var twitter = require('./lib/twitter')({
    consumerKey: credentials.twitter.consumerKey,
    consumerSecret: credentials.twitter.consumerSecret,
});

var app = express();

// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        static: function (name) {
            return require('./lib/static').map(name);
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// set up css/js bundling
var bundler = require('connect-bundle')(require('./config'));
app.use(bundler);

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

app.use(require('body-parser')());
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

// 這必須在cookie解析器與連結期程之後
app.use(require('csurf')());
app.use(function (req, res, next) {
    res.locals._csrfToken = req.csrfToken();
    next();
});

app.use(express.static(__dirname + '/public'));

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

var getWeatherData = (function () {
    // 我們的氣象快取
    var c = {
        refreshed: 0,
        refreshing: false,
        updateFrequency: 360000, // 一小時
        locations: [
            {name: 'Portland'},
            {name: 'Bend'},
            {name: 'Manzanita'},
        ]
    };
    return function () {
        if (!c.refreshing && Date.now() > c.refreshed + c.updateFrequency) {
            c.refreshed = true;
            var promises = [];
            c.locations.forEach(function (loc) {
                var deferred = Q.defer();
                var url = 'https://api.wunderground.com/api/' + credentials.WeatherUnderground.ApiKey +
                    '/conditions/q/OR/' + loc.name + '.json';
                https.get(url, function (res) {
                    var body = '';
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function () {
                        body = JSON.parse(body);
                        loc.forecastUrl = body.current_observation.forecast_url;
                        loc.iconUrl = body.current_observation.icon_url;
                        loc.weather = body.current_observation.weather;
                        loc.temp = body.current_observation.temperature_string;
                        deferred.resolve();
                    });
                });
                promises.push(deferred);
            });
            Q.all(promises).then(function () {
                c.refreshing = false;
                c.refreshed = Date.now();
            });
        }
        return {locations: c.locations};
    };
})();
// 初始化氣象快取
getWeatherData();

app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData();
    next();
});

var topTweets = {
    count: 10,
    lastRefreshed: 0,
    refreshInterval: 15 * 60 * 1000,
    tweets: [],
};

function getTopTweets(cb) {
    if (Date.now() < topTweets.lastRefreshed + topTweets.refreshInterval)
        return cb(topTweets.tweets);

    twitter.search('#meadowlarktravel', topTweets.count, function (result) {
        var formattedTweets = [];
        var embedOpts = {omit_script: 1};
        var promises = result.statuses.map(function (status) {
            return Q.Promise(function (resolve) {
                twitter.embed(status.id_str, embedOpts, function (embed) {
                    formattedTweets.push(embed.html);
                    resolve();
                });
            });
        });
        Q.all(promises).then(function () {
            topTweets.lastRefreshed = Date.now();
            cb(topTweets.tweets = formattedTweets);
        });
    });
}
// mmiddleware to add top tweets to context
// app.use(function(req, res, next) {
//     getTopTweets(function(tweets) {
//         res.locals.topTweets = tweets;
//         next();
//     });
// });

// initialize dealers
Dealer.find({}, function (err, dealers) {
    if (dealers.length) return;

    new Dealer({
        name: 'Oregon Novelties',
        address1: '912 NW Davis St',
        city: 'Portland',
        state: 'OR',
        zip: '97209',
        country: 'US',
        phone: '503-555-1212',
        active: true,
    }).save();

    new Dealer({
        name: 'Bruce\'s Bric-a-Brac',
        address1: '159 Beeswax Ln',
        city: 'Manzanita',
        state: 'OR',
        zip: '97209',
        country: 'US',
        phone: '503-555-1212',
        active: true,
    }).save();

    new Dealer({
        name: 'Aunt Beru\'s Oregon Souveniers',
        address1: '544 NE Emerson Ave',
        city: 'Bend',
        state: 'OR',
        zip: '97701',
        country: 'US',
        phone: '503-555-1212',
        active: true,
    }).save();

    new Dealer({
        name: 'Oregon Goodies',
        address1: '1353 NW Beca Ave',
        city: 'Corvallis',
        state: 'OR',
        zip: '97330',
        country: 'US',
        phone: '503-555-1212',
        active: true,
    }).save();

    new Dealer({
        name: 'Oregon Grab-n-Fly',
        address1: '7000 NE Airport Way',
        city: 'Portland',
        state: 'OR',
        zip: '97219',
        country: 'US',
        phone: '503-555-1212',
        active: true,
    }).save();
});

function dealersToGoogleMaps(dealers) {
    var js = 'function addMarkers(map){\n' +
        'var markers = [];\n' +
        'var Marker = google.maps.Marker;\n' +
        'var LatLng = google.maps.LatLng;\n';
    dealers.forEach(function (d) {
        var name = d.name.replace(/'/, '\\\'')
            .replace(/\\/, '\\\\');
        js += 'markers.push(new Marker({\n' +
            '\tposition: new LatLng(' +
            d.lat + ', ' + d.lng + '),\n' +
            '\tmap: map,\n' +
            '\ttitle: \'' + name.replace(/'/, '\\') + '\',\n' +
            '}));\n';
    });
    js += '}';
    return js;
}

var dealerCache = {
    lastRefreshed: 0,
    refreshInterval: 60 * 60 * 1000,
    jsonUrl: '/dealers.json',
    geocodeLimit: 2000,
    geocodeCount: 0,
    geocodeBegin: 0,
};
dealerCache.jsonFile = __dirname + '/public' + dealerCache.jsonUrl;

function geocodeDealer(dealer, deferred) {
    var addr = dealer.getAddress(' ');
    if (addr === dealer.geocodedAddress) return; // 已經完成地理編碼

    if (dealerCache.geocodeCount >= dealerCache.geocodeLimit) {
        // 最後一次地理編碼是在24小時之前嗎?
        if (Date.now() > dealerCache.geocodeBegin + 24 * 60 * 60 * 1000) {
            dealerCache.geocodeBegin = Date.now();
            dealerCache.geocodeCount = 0;
        } else {
            // 現在我們已經無法將它地理編碼了
            // 我們已經超過使用限制了
            deferred.resolve();
            return;
        }
    }

    require('./lib/geocode')(addr, function (err, coords) {
        if (err) return console.log('Geocoding failure for ' + addr);
        dealer.lat = coords.lat;
        dealer.lng = coords.lng;
        dealer.geocodedAddress = addr;
        dealer.save();
        deferred.resolve();
    });
}

dealerCache.refresh = function (cb) {

    if (Date.now() > dealerCache.lastRefreshed + dealerCache.refreshInterval) {
        // 我們需要重新整理快取
        Dealer.find({active: true}, function (err, dealers) {
            if (err) return console.log('Error fetching dealers: ' + err);

            // 如果座標是最新狀態，geocodeDealer將什麼也不做
            var promises = [];
            dealers.forEach(function(dealer) {
                var deferred = Q.defer();
                geocodeDealer(dealer, deferred);
                promises.push(deferred);
            });
            Q.all(promises).then(function () {
                // 現在將所有經銷商寫到我們緩存的JSON檔
                fs.writeFileSync(dealerCache.jsonFile, JSON.stringify(dealers));

                fs.writeFileSync(__dirname + '/public/js/dealers-googleMapMarkers.js', dealersToGoogleMaps(dealers));

                dealerCache.lastRefreshed = Date.now();

                // 全部完成，呼叫回呼
                cb();
            });
        });
    }

};

function refreshDealerCacheForever() {
    dealerCache.refresh(function () {
        // 在重新整理間隔之後呼叫自己
        setTimeout(refreshDealerCacheForever,
            dealerCache.refreshInterval);
    });
}

// 如果快取不存在，建立一個空的，以防止404錯誤
if (!fs.existsSync(dealerCache.jsonFile)) fs.writeFileSync(JSON.stringify([]));
// 開始重新整理快取
refreshDealerCacheForever();

var static = require('./lib/static').map;
app.use(function (req, res, next) {
    var now = new Date();
    res.locals.logoImage = now.getMonth() === 11 && now.getDate() === 19 ? static('/img/logo_bud_clark.png') : static('/img/logo.png');
    next();
});

// middleware to provide cart data for header
app.use(function (req, res, next) {
    var cart = req.session.cart;
    res.locals.cartItems = cart && cart.items ? cart.items.length : 0;
    next();
});

// 建立“admin”子網域...
// 這個應該要在你的所有其他路由之前出現
var admin = express.Router();
app.use(vhost('admin.*', admin));

// 建立管理員路由，這些可在任何地方定義
admin.get('/', function (req, res) {
    res.render('admin/home');
});
admin.get('/users', function (req, res) {
    res.render('admin/users');
});

// add routes
require('./routes')(app);

// add api

var Attraction = require('./models/attraction');

// api配置
var apiOptions = {
    context: '',
    domain: require('domain').create(),
    // 'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ]
};
// add 'apiKey' options and then access url: 'https://api.localhost:3000/attractions?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'

apiOptions.domain.on('error', function (err) {
    console.log('API domain error.\n', err.stack);
    setTimeout(function () {
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    server.close();
    var worker = require('cluster').worker;
    if (worker) worker.disconnect();
});

var rest = require('connect-rest').create(apiOptions);

rest.get('/attractions', function (req, content, cb) {
    Attraction.find({approved: true}, function (err, attractions) {
        if (err) return cb({error: 'Internal error.'});
        cb(null, attractions.map(function (a) {
            return {
                name: a.name,
                id: a._id,
                description: a.description,
                location: a.locations,
            };
        }));
    });
});

rest.post('/attraction', function (req, content, cb) {
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: {lat: req.body.lat, lng: req.body.lng},
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function (err, a) {
        if (err) return cb({error: 'Unable to add attraction.'});
        cb(null, {id: a._id});
    });
});

rest.get('/attraction/:id', function (req, content, cb) {
    Attraction.findById(req.params.id, function (err, a) {
        if (err) return cb({error: 'Unable to retrieve attraction.'});
        cb(null, {
            name: a.name,
            id: a._id,
            description: a.description,
            location: a.location
        });
    });
});

// 將API連結到管道
app.use(vhost('api.*', rest.processRequest()));


// authentication
var auth = require('./lib/auth')(app, {
    baseUrl: process.env.BASE_URL,
    providers: credentials.authProviders,
    successRedirect: '/account',
    failureRedirect: '/unauthorized',
});
// auth.init()將Passport中介軟體連結起來
auth.init();

// 現在我們可以指定驗證路由
auth.registerRoutes();


function customerOnly(req, res, next) {
    if (req.user && req.user.role === 'customer') return next();
    res.redirect(303, '/unauthorized');
}

function employeeOnly(req, res, next) {
    if (req.user && req.user.role === 'employee') return next();
    next('route');
}

function allow(roles) {
    return function (req, res, next) {
        if (req.user && roles.split(',').indexOf(req.user.role) !== -1) return next();
        res.redirect(303, '/unauthorized');
    };
}

app.get('/unauthorized', function (req, res) {
    res.status(403).render('unauthorized');
});

// 客戶路由
app.get('/account', allow('customer,employee'), function (req, res) {
    res.render('account', {username: req.user.name});
});
app.get('/account/order-history', customerOnly, function (req, res) {
    res.render('account/order-history');
});
app.get('/account/email-prefs', customerOnly, function (req, res) {
    res.render('account/email-prefs');
});

// 員工路由
app.get('/sales', employeeOnly, function (req, res) {
    res.render('sales');
});


var autoViews = {};

app.use(function (req, res, next) {
    var path = req.path.toLowerCase();
    // 查看快取，如果它在那裡，轉譯視圖
    if (autoViews[path]) return res.render(autoViews[path]);
    // 如果它沒有在快取，
    // 查看是否有一個匹配的.handlebars檔
    if (fs.existsSync(__dirname + '/views' + path + '.handlebars')) {
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // 沒有發現視圖，傳至404處理程式
    next();
});


// 404全部抓取處理程式(中介軟體)
app.use(function (req, res) {
    res.status(404).render('404');
});

// 500錯誤處理程式(中介軟體)
app.use(function (err, req, res) {
    console.error(err.stack);
    res.status(500).render('500');
});

var server;

function startServer() {
    var options = {
        key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
        cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
    };

    server = https.createServer(options, app).listen(app.get('port'), function () {
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