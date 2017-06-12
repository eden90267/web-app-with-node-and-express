# chap15. REST API與JSON

現在我們將焦點轉移到，讓資料與功能可供其他程式使用。

本章中，我們會在app加入一個Web服務。“**Web服務**”這個名詞是一個通用名詞。代表**所有可以透過HTTP操作的API**。Web服務概念到最近，這個技術仍然很古板、難懂且過度複雜。目前還有一些系統在使用這些技術(例如SOAP與WSDL)，而且也有Node套件可協助你與這些系統連接。但我們不討論它，而是將焦點放在提供所謂的“RESTful”服務，這容易連接多了。

REST的縮寫“representational state transfer”，**RESTful代表滿足REST原則的Web服務**。REST的正式定義很複雜，但REST基本上是一個介於用戶端與伺服器之間的**無狀態連結**。REST的正式定義也指定**服務要能被緩存**，而且該**服務可以層次化**(也就是說，當你使用REST API時，在它下面可能有其他的REST API)。

從實際的角度來看，HTTP的限制確實讓人難以建立非RESTful的API。

## JSON與XML

提供API的目的，在於讓你有一個共用的語言可以溝通。通訊的一部分跟我們有關：我們必須使用HTTP方法來與伺服器溝通。除此之外，我們就可以自由地使用任何想要用的資料語言。傳統上，XML已成為受歡迎的選擇。雖XML並沒有特別複雜，但Douglas Crockford看到他有輕量化的空間，因而造成JavaScript物件標示法(JSON)的誕生。它除了非常JavaScript友善之外，它的另一個優點是比XML更容易手動編寫。

## 我們的API

實作API之前，先做好規劃：

- GET /api/attractions

    抓取景點。將lat、lng與radius作為查詢字串參數，並回傳景點清單。

- GET /api/attractions/:id

    回傳景點ID

- POST /api/attraction

    在查詢內文中，取用lat、lng、name、description與email。新加入的景點會進入審核佇列。

- PUT /api/attraction/:id

    更新既有的景點。取用景點ID、lat、lng、name、description與email。更新動作會進入審核佇列。

- DEL /api/attraction/:id

    刪除一個景點。取用景點ID、email與reason。刪除的動作會進入審核佇列。
    
添加景點、取回景點，及列出景點。

## API錯誤回報

HTTP API的錯誤回報通常使用HTTP狀態碼來實作：

- 200(OK)
- 500(內部伺服器錯誤)

但大多數應用程式，並非所有東西都可以(或應該)被粗略分類為“成功”或“失敗”。一般情況下，錯誤可被分成下列的幾類：

- 災難性錯誤

    造成伺服器不穩定或進入未知狀態的錯誤。通常這是未被處理的例外所產生的結果。要從災難性錯誤回覆，最安全方式是重新啟動伺服器。理想情況，等待的請求都會收到500回應碼，如果失敗太嚴重，伺服器可能完全無法回應，請求就會逾時。

- 可回覆的伺服器錯誤

    不需重啟伺服器，或其他的英雄式行動。這種錯誤是因為伺服器意外的錯誤狀況(例如，資料庫連結無法使用)。這問題可能是暫時或永久的。500回應碼適用於這種狀況。

- 用戶端錯誤

    通常是用戶端犯錯造成，通常是缺少參數或參數不正確。這不適合500回應碼。你有幾種選擇：回應200狀態碼，並在回應內文中說明錯誤，或另外使用適當的HTTP狀態碼，試著說明錯誤。建議第二種。最好用回應碼是404(未發現)、400(錯誤的請求)及401(未經授權)。此外，回應內文應明確解釋錯誤，甚至錯誤訊息可含有文件的連結。
    
在我們的應用程式中，會在內文中使用HTTP回應碼與錯誤訊息的結合。這種方法與jQuery相容。

## 跨來源資源共享(CORS)

如果你要發布API，可能想要讓其他人也可以使用API，這會產生**跨站HTTP請求**。跨站HTTP請求一直是受到攻擊的對象，因此被**同源政策**限制，它會限制何處的指令碼可被載入。具體來說，**協定**、**網域**及**連接埠**都必須符合。這可以讓其他的網站使用你的API，這就是CORS的源起。CORS可讓你根據各種情況來解除限制，甚至讓你**具體列出哪些網域可以存取該指令碼**。CORS是透過**Access-Control-Allow-Origin**標頭來實作的。要在Express應用程式實作它，最簡單方式是使用cors套件(`npm install --save cors`)，要在你的應用程式中使用CORS：

```
app.use(require('cors')());
```

會出現同樣來源的API是有原因的(為了避免攻擊)，我建議你在必要時才套用CPRS。在我們的案例中，我們想要公開整個API(但只有API)，所以我們要將CORS的路徑限制為以/api開頭：

```
app.use('/api', require('cors')());
```

要知道更多進階CORS用法：[https://www.npmjs.com/package/cors](https://www.npmjs.com/package/cors)。

## 我們的資料存儲

我們使用Mongoose建立一個資料庫中景點模型的架構。建立檔案models/atraction.js：

```
var mongoose = require('mongoose');

var attractionSchema = mongoose.Schema({
    name: String,
    description: String,
    location: {lat: Number, lng: Number},
    history: {
        event: String,
        notes: String,
        email: String,
        date: Date,
    },
    updateId: String,
    approved: Boolean,
});
var Attraction = mongoose.model('Attraction', attractionSchema);
module.exports = Attraction;
```

因我們想要審核更新，所以不能讓API隨便更新原始紀錄，我們的方法是建立一筆參考原始紀錄的新紀錄(在它的updateId特性)。當紀錄被審核之後，我們可將原始紀錄更新為更新紀錄裡面的資訊，接著刪除更新紀錄。

## 我們的測試

在我們為API編寫測試之前，需要一種方式來實際地**呼叫 REST API**。我們會使用一種Node套件，稱為restler：

```
npm install --save-dev restler
```

我們將之後要實作的API回呼的測試項放在*qa/tests-api.js*裡面：

```
var assert = require('chai').assert;
var http = require('http');
var rest = require('restler');

suite('API tests', function () {

    var attraction = {
        lat: 45.516011,
        lng: -122.682062,
        name: 'Portland Art Museum',
        description: 'Founded in 1892, the Portland Art Museum\'s collection ' +
        'of native art is not to be missed. If modern art is more to your ' +
        'liking, there are siz stories of modern art for your enjoyment.',
        email: 'test@meadowlarktravel.com'
    };

    var base = 'http://localhost:3000';

    test('should be able to add an attraction', function (done) {
        rest.post(base + '/api/attraction', {data: attraction})
            .on('success', function (data) {
                assert.match(data.id, /\w/, 'id must be set');
                done();
            });
    });

    test('Should be able to retrieve an attraction', function (done) {
        rest.post(base + '/api/attraction', {data: attraction})
            .on('success', function (data) {
                rest.get(base + '/api/attraction/' + data.id)
                    .on('success', function (data) {
                        assert(data.name === attraction.name);
                        assert(data.description === attraction.description);
                        done();
                    });
            });
    });

});
```

注意，在取回景點的測試中，我們先加入一個景點。或許你會想，我們並不需要做這件事，因為第一次測試已經做過了，但這個動作有兩個原因。第一個原因很實際：因為JavaScript的非同步性質，API呼叫並不保證會按檔案順序來執行。第二個原因與原則有關：任何測試項必須完全獨立，不能依賴其他測試項。

我們呼叫rest.get或rest.put，將URL以及一個含有data特性的選項物件傳給它，這個物件會被用來作為請求內文。方法會回傳一個發出事件的應允。我們關心的是success事件。當你在應用程式中使用restler時，可能也想監聽其他事件，如fail(伺服器回應4xx狀態碼)或error(連結或解析錯誤)。進一步可參考restler文件：[https://github.com/danwrong/restler](https://github.com/danwrong/restler)。

## 使用Express來提供API

Express非常適合提供API。

```
var Attraction = require('./models/attraction');

app.get('/api/attractions', function (req, res) {
    Attraction.find({approved: true}, function (err, attractions) {
        if (err) return res.send(500, 'Error occurred: database error.');
        res.json(attractions.map(function (a) {
            return {
                name: a.name,
                id: a._id,
                description: a.description,
                location: a.locations
            };
        }));
    });
});

app.post('/api/attraction', function (req, res) {
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
        if (err) return res.send(500, 'Error occurred: database error.');
        res.json({
            id: a._id
        });
    });
});

app.get('/api/attraction/:id', function (req, res) {
    Attraction.findById(req.params.id, function (err, a) {
        res.json({
            name: a.name,
            id: a._id,
            description: a.description,
            location: a.location
        });
    });
});
```

注意，當我們回傳一個景點的時候，不能只回傳資料庫所回傳的模型，那會公開內部的實作資訊。相反地，我們要挑選用來建構要回傳的新物件所需的資訊。

現在我們執行測試，會看到測試項已通過。

## 使用REST外掛程式

如同你所看到，只要使用Express就可以編寫API。但是使用REST外掛程式也有一些優點。我們來使用強健的connect-rest來對API做未來驗證：

```
npm install --save connect-rest
```

匯入meadowlark.js：

```
var Rest = require('connect-rest');
```

建議在網站路由之後添加API路由：connect-rest會檢視每一個請求並將特性添加到請求物件，並做額外紀錄。

```
// 網站路由在這裡

// 在這裡使用rest.VERB定義API路由

// api配置
var apiOptions = {
    context: '/api',
    domain: require('domain').create(),
};

var rest = Rest.create(apiOptions);

// 將API連結到管道
app.use(rest.processRequest());

// 404處理程式這裡開始
```

Top：如果你想要盡量分隔網站與API，考慮使用子網域，例如*api.meadowlark.com*。

connect-rest已經給我們一些方便了：它可以讓我們自動地將所有API呼叫前面加上/api。可減少打字錯誤的機會，如果要的話，也可以讓我們輕鬆地改變基底URL。

來看如何添加API方法：

```
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
```

REST函式並不是使用一般的請求/回應，而是使用三個參數：請求(與一般的一樣)、一個**內容**物件，他是被解析的請求內文、以及一個回呼函式，可在非同步API呼叫使用。因為我們正在使用資料庫，是非同步的，所以必須使用回呼將回應傳送給用戶端(有一個同步API，你可以參考connect-rest文件)。

也請注意，當我們建立API時，會指定一個網域，讓我們隔離API錯誤，並採取適當的動作。在網域偵測錯誤時，connect-rest會自動地傳送500回應碼，所以接下來你要做的，就是紀錄日誌並關閉伺服器。例如：

```
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
```

## 使用子網域

因為API與網站有很大差異，使用子網域來將API與網站其他部分分隔是很常見的做法。這種作法很容易，我們使用api.meadowlarktravel.com，取代meadowlarktravel.com/api來重新建構實例：

在你開發環境中，或許沒有設定自己的網域名稱伺服器，所以我們要欺騙Express，讓它以為你以連結至一個子網域。hosts檔案添加以下幾行

```
127.0.0.1   api.meadowlark
```

現在我們連結新的vhost來建立子網域：

```
app.use(vhost('api.*', rest.processRequest()));
```

你也需要更改環境：

```
var apiOptions = {
    context: '',
    domain: require('domain').create(),
};
```

以上就是所有工作了。在api子網域，你已經可以使用藉由rest.VERB呼叫所定義的所有API工作了。