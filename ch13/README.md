# chap13. 持久保存

此章，會將焦點放在文件資料庫

## 檔案系統持久保存

“平面檔案”(平面代表檔案沒有內在結構，它只是一個位元組序列)。

無法處理擴展的問題，除非所有伺服器都可以存取同一個共用的檔案系統。

沒有內在結構，定位、搜尋、篩選資料的重擔將會由你的應用程式來承擔。

所以你應該使用資料庫來儲存資料，而不是檔案系統。除非你要存二進位檔案：圖片、音訊檔或視訊檔。資料庫也可以處理這類型檔案，但它們的效率不太可能會比檔案系統還要好。

如果需儲存二進位資料，記得檔案系統存儲仍有擴展上的問題，如果主機不能處理共用的檔案系統，就必須考慮將二進位檔案存在資料庫裡面，或雲端式存儲服務(AWS S3或Microsoft Azure Storage)。

來看Node的檔案系統支援。填寫處理表單的處理程式：

```
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
```

Formidable的IncomingForm，並呼叫它的parse方法，傳入req物件。這個回呼提供所有上傳的欄位及檔案。因為我們呼叫上傳欄位photo，所以會有一個files.photo物件，裡面含有上傳檔案的資訊。

透過時戳建立獨一無二的目錄，來避免衝突。

將上傳檔案重新命名(移動)(Formidable會給它一個暫時的名稱，我們可以從path特性取得)為我們建構的名稱。

最後，我們需要一些方法來將使用者上傳的檔案與他們的email地址相結合(以及提交的年份與月份)。我們可將這項資訊編進檔案或目錄名稱，但我們比較傾向將這個資訊存在資料庫裡面。

## 雲端持久保存

以下範例示範將一個檔案存到Amazon S3帳號是多簡單：

```
var filename = 'customerUpload.jpg';

aws.putObject({
    ACL: 'private',
    Bucket: 'uploads',
    Key: filename,
    Body: fs.readFileSync(__dirname + '/tmp/' + filename)
});
```

以下是Microsoft Azure：

```
var filename = 'customerUpload.jpg';

var blobService = azure.createBlobService();
blobService.pubBlockBlobFromFile('uploads', filename, __dirname + '/tmp/' + filename);
```

## 資料庫持久保存

傳統上，“資料庫”這個字眼是“關聯式資料管理系統”(RDBMS)，是經過幾十年的研究與根據正式資料庫理論發展而成的。“NoSQL”資料庫最近越來越成氣候，它們正挑戰Internet資料儲存的現況。

笨蛋才會宣稱NoSQL資料庫比關聯式資料庫還要好，但它們確實有一些優點(反之亦然)。雖然你可以輕鬆將關聯式資料庫與Node app整合，但目前有一些NoSQL資料庫看起來幾乎是為了Node量身訂做的。

**文件資料庫**與**鍵 - 值資料庫**是最受歡迎的兩種NoSQL資料庫。文件資料庫擅長儲存物件，讓它們很自然就適合在Node與JavaScript使用。鍵 - 值資料庫，顧名思義，非常簡單，而且對於非常容易將資料對應至鍵 - 值對的應用程式而言，是個很棒的選擇。

文件資料庫：在關聯式資料庫的約束與鍵 - 值資料庫的簡單之間取得最佳的平衡點。

MongoDB是文件資料庫的領先者，此時它已經非常強健且具公信力。

### 關於效能

NoSQL的簡單特性是一把兩面刃。仔細地規劃關聯式資料庫事件非常複雜的任務，但仔細規劃的好處，是讓資料庫可以提供傑出的效能。不要愚蠢認為，NoSQL資料庫比較簡單，所以它並非被調整成最佳效能的技術。

關聯式資料庫在傳統上依賴它們的剛性資料結構，以及十幾年來的最佳化研究，才能取得高效能。另一方面，NoSQL資料庫擁抱Internet的離散特性，而且已經將焦點放在並行處理來提升效能，如Node(關聯式資料庫也支援並行處理，但通常最嚴苛的應用程式才會用到)。

規劃資料庫效能與擴展性是一項大型、複雜的主題。

### 設定MongoDB

設定MongoDB所涉及的困難程度，取決於你的作業系統。因此，我們使用傑出的MongoDB免費主機服務：MongoLab。

### Mongoose

MongoDB有低階的驅動程式可以使用，或許你想要“使用物件文件對應程式”(ODM)。MongoDB官方是以Mongoose支援ODM。

JavaScript優點之一是，它的物件模型非常有彈性，如果你想在物件中添加特性或方法，就儘管做，你不需擔心需要修改類別。不幸的是，這樣寬鬆的彈性會對你的資料庫造成負面的影響，它們會變成支離破碎，而且難以最佳化。

Mongoose試著取得一個平衡：它引入**架構**(*schemas*)與**模型**(*models*)(結合兩者，架構與模型類似傳統物件導向程式設計中的類別)。架構具彈性，但也會為你的資料庫提供必要的結構。

```
npm install --save mongoose
```

將資料庫憑證加到credentials.js

```
mongo: {
        development: {
            connectionString: 'your_dev_connection_string'
        },
        production: {
            connectionString: 'your_prod_connection_string'
        }
    }
```

### 使用Mongoose連結資料庫

```
var mongoose = require('mongoose');

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
```

options物件是選用的，但我們想指定keepAlive選項，它會避免長時間執行的應用程式發生資料庫連結錯誤。

### 建立架構與模型

建立Meadowlark Travel假期套裝資料庫。一開始先定義一個架構，並用它來建立模型。建立models/vacation.js：

```
/**
 * Created by eden90267 on 2017/6/10.
 */
var mongoose = require('mongoose');

var vacationSchema = mongoose.Schema({
    name: String,
    slug: String,
    category: String,
    sku: String,
    description: String,
    priceInCents: Number,
    tags: [String],
    inSeason: Boolean,
    available: Boolean,
    requiresWaiver: Boolean,
    maximumGuests: Number,
    notes: String,
    packagesSold: Number,
});
vacationSchema.methods.getDisplayPrice = function () {
    return '$' + (this.priceInCents / 100).toFixed(2);
};
var Vacation = mongoose.model('Vacation', vacationSchema);
module.exports = Vacation;
```

以美分為單位來儲存產品價格，以避免小數點四捨五入的麻煩，但要以美元為單位來顯示產品。添加getDisplayPrice方法來取得適合顯示的價格。

sku：庫存單位。

使用mongoose.model來建構一個模型。Vacation非常類似傳統物件導向程式設計中的類別。注意在**建立模型之前，必須先定義方法**。

匯入模型：

```
var Vacation = require('./model/vacation.js');
```

### 播下初始資料

```
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
```

這裡使用兩個Mongoose方法。第一個是find，它所做的事就跟它的名稱一樣。它會在資料庫中尋找Vacation的所有實例，並用那個清單來呼叫回呼。我們做這件事原因是不想要一直讀取種子假期：如果在資料庫中已經有假期，它已經被成為種子，我們就可以開始快樂的旅程。但當它第一次執行，find會回傳一個空的清單，所以我們繼續建立兩個假期，接著呼叫save，將這些新的物件儲存到資料庫中。

### 取回資料

find：就是用來顯示假期清單的方法。但這次我們要將一個項目傳至find來篩選資料。具體來說，我們只想要顯示目前可供選擇的假期：

建立一個產品網頁的視圖*views/vacations.handlebars*：

```
<h1>Vacations</h1>
{{#each vacations}}
    <div class="vacation">
        <h3>{{name}}</h3>
        <p>{{description}}</p>
        {{#if inSeason}}
            <span class="price">{{price}}</span>
            <a href="/cart/add?sku={{sku}}" class="btn btn-default">Buy Now!</a>
        {{else}}
            <span class="outOfSeason">We're sorry, this vacation is currently not in season.</span>
            {{! The "notify me when this vacation is in season" page will be our next task.}}
            <a href="/notify-me-when-in-season?sku={{sku}}">Notify me when this vacation is in season.</a>
        {{/if}}
    </div>
{{/each}}
```

現在建立路由處理程式來將它們掛上：

```
// 見配套儲存庫的/cart/add路由...

app.get('/vacations', function (req, res) {
    Vacation.find({available: true}, function (err, vacations) {
        var context = {
            vacations: vacations.map(function (vacation) {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    price: vacation.getDisplayPrice(),
                    isSeason: vacation.inSeason,
                };
            })
        };
        res.render('vacations', context);
    });
});
```

沒有任何內建的方式可讓Handlebars視圖在表達式中使用函式的輸出。所以為了整齊格式化的方式來顯示價格，我們必須將它轉換成簡單的字串特性。

不要直接傳送未對應的資料庫物件至視圖。視圖可能會得到許多不需要的特性，或許格式是不相容的。也可能不小心公開保密資訊，或洩漏網站安全的資訊。因此，我建議對應資料庫回傳的資料，並且只傳遞視圖需要的東西(view model的概念：view model基本上會提煉並轉換一個model(或多個)，所以它更適合在視圖中顯示)。

### 添加資料

當某個假期已經不適合目前的假期，我們會顯示一個連結來邀請客戶在適合該假期的季節再度到來時接收通知。我們來加入這個功能。首先，建立架構與模型(*models/vacationInSeasonListener.js*)：

```
var mongoose = require('mongoose');

var vacationInSeasonListenerSchema = mongoose.Schema({
    email: String,
    skus: [String]
});
var VacationInSeasonListener = mongoose.model('VacationInSeasonListener', vacationInSeasonListenerSchema);

module.exports = VacationInSeasonListener;
```

建立視圖*views/notify-me-when-in-season.handlebars*：

```
<div class="formContainer">
    <form action="/notify-me-when-in-season" role="form" method="POST"
          class="form-horizontal newsletterForm">
        <input type="hidden" name="sku" value="{{sku}}">
        <div class="form-group">
            <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
            <div class="col-sm-4">
                <input type="email" class="form-control" required id="fieldEmail" name="email">
            </div>
        </div>
        <div class="form-group">
            <div class="col-sm-offset-2 col-sm-4">
                <button type="submit" class="btn btn-default">Submit</button>
            </div>
        </div>
    </form>
</div>
```

最後，是路由處理程式：

```
var VacationInSeasonListener = require('./models/vacationInSeasonListener');

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
```

我們如何在VacationInSeasonListener集合中“更新”一筆紀錄，甚至在它存在之前？Mongoose一個很方便的功能，稱為upsert(“update”與“insert”的混合詞)。基本上，如果目前沒有具備給定的email的紀錄，它會被建立。如果紀錄存在，它會被更新。接下來使用神奇的變數$push來代表我們想要在陣列中添加一個值。

## 使用MongoDB來做期程存儲

將MongoDB設定為期程存儲非常容易。

我們使用一個稱為session-mongoose的套件來提供MongoDB期程存儲。當你安裝它後(npm install --save session-mongoose)，就可以在主應用程式檔裡面設定它：

```
var MongoSessionStore = require('session-mongoose')(require('connect'));

var sessionStore = new MongoSessionStore({url: credentials.mongo.connectionString});

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({store: sessionStore}));
```

想像我們想要用不同的貨幣來顯示假期價格。此外，我們想要讓網站記得使用者的貨幣偏好。

在假期網頁底部添加一個貨幣選擇器：

```
<hr>
<p>
    Currency:
    <a href="/set-currency/USD" class="currency {{currencyUSD}}">USD</a> |
    <a href="/set-currency/GBP" class="currency {{currencyGBP}}">GBP</a> |
    <a href="/set-currency/BTC" class="currency {{currencyBTC}}">BTC</a>
</p>
```

一些CSS：

```
a.currency {
    text-decoration: none;
}
.currency.selected{
    font-weight: bold;
    font-size: 150%;
}
```

最後，添加一個路由處理程式來設定幣種：

```
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
```

Top：MongoDB不一定是期程存儲的最佳選擇。另一個受歡迎且容易上手的期程持久保存工具是Redis。請參考connect-redis套件來設定以Redis來儲存的期程。

採用redislabs作為範例redis資料庫

```
npm install --save connect-redis
```

更新credientials.js：

```
redis: {
    development: {
        host: 'your_dev_host',
        port: your_dev_port
    },
    production: {
        host: 'your_prod_host',
        port: your_prod_port
    }
}
```

```
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
```