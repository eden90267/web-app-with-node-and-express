# chap14. 路由

**路由**是一種機制，它會將請求(以URL及HTTP方法來指定)傳送至處理它們的程式碼。如同我們之前看過的，路由之前是檔案式的，如果你將*foo/about.html*放在你的網站，就可以在瀏覽器用*/foo/about.html*路徑來存取它。簡單，但缺乏彈性。而且，你可能沒有注意，在你的URL裡面使用“HTML”已經非常落伍。

在我們深入Express路由的技術層面之前，應該先討論資訊結構(IA)的概念。IA代表**你的內容在概念上的組織**。在開始規劃路由之前，擁有一個可擴展的IA，將會在接下來的過程中給妳很大的好處。

關於IA，Tim Berbers-Lee在1998 URI一篇短文要求我們肩負起一個崇高的責任：

> 站長的責任，就是指派將會被使用2年、20年，及200年的URI。這需要思考、組織及承諾。

想像你某天走進最喜歡的圖書館，但不能找到任何東西。這就是你重新設計URL結構所發生的情形。

認真地想一下妳的URL：它在20年後，還是有意義的嗎？小心地考慮你的內容細目。請有邏輯地將東西分類，並且不要讓自己陷入困境。它是一門科學，也是一門技術。

以下是一些協助你建構持久的IA的建議：

- **不要在你的URL公開技術細節**
- **避免在你的URL使用毫無意義的資訊**
- **避免沒必要的長URL**
- **字詞分隔符號應保持一致**

    使用連字號來分隔單字是常見的做法，底線比較不普遍，而且大部分的SEO專家都推薦它們。

- **不要使用空格或沒辦法打字的字元**

    不要使用英數字元、數字、虛線及底線之外的字元

- **使用小寫的URL**

    使用小寫的優點是，程式碼一定可以自動地產生它。個人覺得小寫的URL比較美觀。
    
## 路由與SEO

如果有些關鍵字很重要——而且有意義——請考慮讓它成為URL的一部分。標題、標頭、內文及中繼說明使用關鍵字，且URL以關鍵字開頭。如果為了縮短URL，就會喪失寶貴的SEO。

但漫不經心地將關鍵字塞到URL是失敗的做法。

## 子網域

除了路徑外，子網域是URL的另一個部分，通常會被用在路由請求上。子網域最好保留給明顯不同的應用程式，例如REST API(*api.meadowlarktravel.com*)或管理介面(*admin.meadowlarktravel.com*)。有時你會因為技術因素使用子網域。例如，使用WorkPress建構部落格，使用blog.meadowlarktravel.com會比較容易(較佳做法是使用代理伺服器，例如Nginx)。通常SEO會使用子網域來將內容分區，因此你應該要保存對SEO而言不重要的網站區域，例如管理區域及API。

Express的路由機制在預設情況下並未考慮子網域：app.get(/about)會處理*http://meadowlarktravel.com/about*、*http://www.meadoowlarktravel.com*與*http://admin.meadowlarktravel.com/about*的請求。如果你想要個別處理子網域，可使用一種稱為vhost的套件(代表virtual host，來自Apache機制，通常處理子網域使用)。首先，安裝套件(`npm install --save vhost`)，接著編輯你的應用程式檔案來建立子網域：

```
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
```

express.Router()基本上會建立一個Express路由的新實例。你可將這個實例當成你的原始實例(app)：你可以對app增加路由與中介軟體。但，在你將它將到app之前，它不會做任何事。我們透過vhost來將它加入，它會將那一個路由實例綁到那一個子網域。

## 路由處理程式都是中介軟體

基本路由：只要匹配一個給定的路徑。但app.get('/foo',...)實際**做什麼**事情？它只是一段專門的中介軟體，會被傳入一個next方法。我們來看一個更複雜的範例：

```
app.get('/foo', function(req, res, next) {
    if (Math.random() < 0.5) return next();
    res.send('sometimes this');
});

app.get('/foo', function(req, res) {
    res.send('and sometime that');
})
```

你可針對一個app.get呼叫使用任何數量的處理程式。

```
app.get('/foo',
        function(req, res, next){
            if(Math.random() < 0.33) return next();
            res.send('red');
        },
        function(req, res, next){
            if(Math.random() < 0.5) return next();
            res.send('green');
        },
        function(req, res) {
            res.send('blue');
        },
);
```

它可讓你建立通用函式，可在你的所有路由中使用。例如，假設我們有一個機制可在某網頁上顯示特別優惠活動。特別優惠的變更很頻繁，而且它們不會在每頁顯示。我們可建立一個函式將特別優惠注入至res.locals特性：

```
function specials(req, res, next) {
    res.locals.specials = getSpecialsFromDatabase();
    next();
}
app.get('/page-with-specials', specials, function (req, res) {
    res.render('page-with-specials');
});
```

我們也可用這種方法實作一個授權機制。假如我們的使用者授權碼會設定一個名為req.session.authorized的期程變數。我們可以使用以下的程式來製作一個可重複使用的授權過濾器：

```
function authorize(req, res, next) {
    if (req.session.authorized) return next();
    res.render('not-authorized');
}
app.get('/secret', authorize, function (req, res) {
    res.render('secret');
});
app.get('/sub-rosa', authorize, function (req, res) {
    res.render('sub-rosa');
});
```

## 路由路徑與正規表達式

當你在路由裡面指定路徑時(像/foo)，它最後會被Express轉換成正規表達式。有一些正規表達式的特殊字元可以在路由路徑中使用：+、?、*、(與)。來看一些範例：

假設你想要用同樣路徑來處理/user與/username URL：

```
app.get('/user(name)', function(req, res) {
    res.render('user');
});
```

khaaaaaaaan網頁，不希望讓使用者記得他有幾個A：

```
app.get('/khaa+n', function(req, res) {
    res.render('khaaan');
})
```

並非所有regex特殊字元在路由路徑都有意義，上面有列出的才能用。這點很重要，因為句點在regex特殊字元中通常代表“任何字元”，可在路由中使用，不需要轉義。

最後，如果你真的需要在路由中讓正規表達式發揮威力：

```
app.get(/crazy|mad(ness)?|lunacy/,function(req, res){
    res.render('madness');
});
```

路由路徑使用regex特殊字元，目前沒找到理由，但知道有這功能是好事。

## 路由參數

它是個可讓路由的一部分變成可改變的參數的方式。

```
var staff = {
    mitch: {bio: 'Mitch is the man to have at your back in a bar fight'},
    madeline: {bio: 'madeline is our Oregon expert.'},
    walt: {bio: 'Walt is our Oregon Coast expert.'}
};
app.get('/staff/:name', function (req, res, next) {
    var info = staff[req.params.name];
    if (!info) return next();        // 最終會產生404失敗
    res.render('staffer', info);
});
```

注意我們在路由中使用:param的方式。它會匹配所有字串(不含斜線)，並使用namer鍵將它放入req.params物件。這是之後會經常用到的功能。特別是建立REST API時。你可在路由中使用多個參數。例如，我們想以城市來區分工作人員：

```
var staff = {
    portland: {
        mitch: {bio: 'Mitch is the man to have at your back in a bar fight'},
        madeline: {bio: 'madeline is our Oregon expert.'}
    },
    bend: {
        {bio: 'Walt is our Oregon Coast expert.'}
    },
};

app.get('/staff/:city/:name', function(req, res) {
    var info = staff[req.params.city][req.params.name];
    if (!info) return next();        // 最終會產生404失敗
    res.render('staffer', info);
});
```

## 組織路由

推薦四條決定路由組成方式的指導原則：

- **使用有名稱的函式處理路由**

    目前為止，我們已在行內編寫路由處理程式，方法是定義一個函式，在適當時機與地點處理路由。

- **路由不應該是神秘的東西**

頻譜的一端是簡單地將網站**所有**的路由放在一個檔案裡面，讓你知道它們的地方。大型網站，會將路由按照功能來區分。

- **路由組織必須是可擴充的**

    無論你選擇什麼方法，都必須確保你有成長的空間

- **不要忽視視圖式自動路由處理程式**

    如果你的網站含有許多靜態且具有固定URL的網頁：`app.get('/static/thing', function(req, res) { res.render('static/thing') });`。要減少這種沒必要的重複程式，請考慮使用視圖式自動路由處理程式。它可和自訂路由一起使用。
    
## 在模組內宣告路由

組織路由第一步驟就是讓它們進入它們自己的模組。我們的方法是讓你的模組成為一個函式，它會回傳物件的陣列，物件裡面含有“方法”與“處理程式”特性。這樣你就可以在應用程式檔案裡面定義路由了。

```
var routes = require('./routes.js');

routes.forEach(function(route) {
    app[route.method](route.handler);
})
```

這個方法自有其優點，而且**適合動態儲存路由**，例如在資料庫或JSON檔案。但是，如果你不需要那個功能，我建議將app實例傳入模組，並讓它添加路由，這就是我們將要在接下來四個範例中使用的方法。建立一個檔案，取名為routes.js，並將所有路由移到裡面去：

```
var fs = require('fs'),
    formidable = require('formidable'),
    jqupload = require('jquery-file-upload-middleware');

var fortune = require('./lib/fortune'),
    cartValidation = require('./lib/cartValidation'),
    credentials = require('./credentials'),
    emailService = require('./lib/email')(credentials),
    Vacation = require('./models/vacation'),
    VacationInSeasonListener = require('./models/vacationInSeasonListener');

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.render('home');
    });
    app.get('/about', function (req, res) {
        res.render('about', {
            fortune: fortune.getFortune(),
            pageTestScript: '/qa/tests-about.js'
        });
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
    app.post('/cart/checkout', function (req, res, next) {
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

    var staff = {
        mitch: {bio: 'Mitch is the man to have at your back in a bar fight'},
        madeline: {bio: 'madeline is our Oregon expert.'},
        walt: {bio: 'Walt is our Oregon Coast expert.'}
    };
    app.get('/staff/:name', function (req, res, next) {
        var info = staff[req.params.name];
        if (!info) return next();        // 最終會產生404失敗
        res.render('staffer', info);
    });
};
```

會有些匯入動作，但是先停住，接著就會將處理程式移到它們自己的模組。

路由連結進去meadowlark.js：

```
require('./routes')(app);
```

## 以邏輯的方式將處理程式群組化

為了滿足第一個指導原則(使用有名稱的函式處理路由)。將有關聯的功能放在一起。*handlers/main.js*、*handlers/vacations.js*等等。

*handlers/main.js*：

```
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
```

修改routes.js，來使用它：

```
var main = require('./handlers/main');

module.exports = function (app) {

    app.get('/', main.home);
    app.get('/about', main.about);
    // ...
};
```

這可滿足我們的所有指導原則。/routes.js非常簡單明瞭。你一眼就可以看到網站裡面有什麼路由，以及會在哪裡處理它們。將相關功能放在一個群組，幾個檔案都可以。如果routes.js過於沈重，可以再次使用同樣技術，將app傳到其他會一次註冊更多路由的模組。

## 自動轉譯視圖

在404處理程式前，添加下列的中介軟體：

```
var autoViews = {};
var fs = require('fs');

app.use(function (req, res, next) {
    var path = req.path.toLowerCase();
    // 查看快取，如果它在那裡，轉譯視圖
    if (autoViews[path]) return res.render(autoViews[path]);
    // 如果它沒有在快取，
    // 查看是否有一個匹配的.handlebars檔
    if (fs.existsSync(__dirname + '/views' + path + '.handlebars')) {
        autoViews[path] = path.replace('/^\//', '');
        return res.render(autoViews[path]);
    }
    // 沒有發現視圖，傳至404處理程式
    next();
});
```

正規的路由會規避這種機制，它的優先權會比較高。

## 其他的路由組織方法

路由組織最受歡迎的兩種方法是：**命名空間路由**與**資源路由**。如果有許多路由使用同樣開頭，命名空間路由很適合(例如/vacations)。有一種**express-namespace**的Node模組可以讓你輕鬆地使用這種方法。資源路由會根據物件中的方法自動添加路由。如果你的網站邏輯是很自然的物件導向，就很適合使用。**express-resource**套件示範如何時做此種類型的路由組織。