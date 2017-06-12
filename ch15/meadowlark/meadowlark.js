/**
 * Created by eden90267 on 2017/6/2.
 */
var http = require('http'),
    connect = require('connect'),
    express = require('express'),
    mongoose = require('mongoose'),
    vhost = require('vhost'),
    jqupload = require('jquery-file-upload-middleware') ;

var credentials = require('./credentials'),
    Vacation = require('./models/vacation');

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

// add routes
require('./routes')(app);

// add api

var Attraction = require('./models/attraction');

// api配置
var apiOptions = {
    context: '',
    domain: require('domain').create(),
};

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
        if (err) return cb({ error: 'Unable to add attraction.'});
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

var autoViews = {};
var fs = require('fs');

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