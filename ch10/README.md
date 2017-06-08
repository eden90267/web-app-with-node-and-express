# chap.10 中介軟體

已用過既有的中介軟體(body-parser、cookie-parser、static及connect-session，僅舉數例)。也有自行編寫一些(查詢字串中察看&test=1的存在與否，404處理程式)。

什麼是中介軟體?

中介軟體是一種封裝功能：操作"被發送到應用程式的HTTP請求"的功能。實際上，中介軟體只是一個使用三個引數的函式：

- 請求物件
- 回應物件
- 下一個函式

(也有一種使用四個引數的格式，用於錯誤處理)。

中介軟體是在所謂的**管道**中執行的。有順序性介入執行。在Express app，你會藉由呼叫app.use將中介軟體插入管道中。

Express 4.0之前，你必須自行連結**路由程式**(router)。因連結路由程式的地方不一樣，路由有可能以不符合順序的方式連結，當你混著使用中介軟體與路由處理程式時，會讓管道的順序不清楚。Express 4.0會依照中介軟體與路由處理程式的連結順序呼叫它們，可以很清楚知道順序為何。

常見做法是管道中最後一個中介軟體作為"一網打盡"處理程式。來抓取所有不符合其他路由的請求。中介軟體通常會回傳404的狀態碼。

請求如何在管道中終止? 如果你不呼叫next()，請求與中介軟體會同時終止。

了解Express如何動作的關鍵，在於了解如何靈活運用中介軟體與路由處理程式。以下是必須銘記在心的事情：

- 你可將路由處理程式(app.get、app.post等，通常被統稱為app.VERB)想像為中介軟體，只處理特定的HTTP動詞(GET、POST等)。相反地，你可將中介軟體想成一個路由處理程式，負責處理所有的HTTP動詞(基本上等於app.all，除了異國動詞有微小差異，例如PURGE，但對於常見的動詞，效果是一致的)。
- 路由處理程式需要一個路徑來作為他的第一個參數。如果你想讓那個路徑匹配所有的路由，只要使用`/*`即可。中介軟體也可採用路徑作為它的第一個參數，但這是可選的(忽略將匹配所有路徑，如同你指定`/*`)。
- 路由處理程式及中介軟體會取用一個回呼函式，這個函式會取用兩個、三個或四個參數。三個的參數是req物件、res物件與next函式，若是四個參數，它會變成錯誤處理中介軟體，第一個參數會變成一個錯誤物件，之後是req物件、res物件及next函式。
- 如果你不呼叫next()，管道會被終止，而且不會再處理任何路由處理程式或中介軟體。如果你不呼叫next()，就必須傳送一個回應給用戶端(res.send、res.json、res.render等等)，如果不這麼做，事件會停住，最後逾時。
- 如果你有呼叫next()，一般不建議傳送回應給用戶端。如果你這麼做，管道之後的中介軟體或路由處理程式都會被執行，但是它們傳送的所有用戶端回應都會被忽略。

```
app.use(function (req, res, next) {
    console.log('processing request for "' + req.url + '"');
    next();
});
app.use(function (req, res, next) {
    console.log('terminating request');
    res.send('thanks for playing!');
    // 沒呼叫next()，這會終止請求
});
app.use(function (req, res, next) {
    console.log('whoop, i\'ll never get called!');
});
```

考慮一個更複雜、完整的範例：

```
var app = require('express')();

app.use(function (req, res, next) {
    console.log('\n\nALLWAYS');
    next();
});

app.get('/a', function (req, res) {
    console.log('/a: route terminated');
    res.send('a');
});
app.get('/a', function (req, res) {
    console.log('/a: never called');
});
app.get('/b', function (req, res, next) {
    console.log('/b: route not terminated');
    next();
});
app.use(function (req, res, next) {
    console.log('SOMETIMES');
    next();
});
app.get('/b', function (req, res, next) {
    console.log('/b (part 2): error throw');
    throw new Error('b failed');
});
app.use('/b', function (err, req, res, next) {
    console.log('/b error detected and passed on');
    next(err);
});
app.get('/c', function (err, req) {
    console.log('/c: error thrown');
    throw new Error('c failed');
});
app.use('/c', function (err, req, res, next) {
    console.log('/c: error detected but not passed on');
    next();
});

app.use(function (err, req, res, next) {
    console.log('unhandked error detected: ' + err.message);
    res.send('500 - server error');
});

app.use(function (req, res) {
    console.log('route not handled');
    res.send('404 - not found');
});

app.listen(3000, function () {
    console.log('listening on 3000');
});
```

結果：

- http://localhost:3000/a

    - console

        ```
        ALLWAYS
        /a: route terminated
        ```

    - web page: a

- http://localhost:3000/b

    - console

         ```
         ALLWAYS
         /b: route not terminated
         SOMETIMES
         /b (part 2): error throw
         /b error detected and passed on
         unhandked error detected: b failed
         ```

    - web page: 500 - server error

- http://localhost:3000/c

    - console

        ```
        ALLWAYS
        SOMETIMES
        /c: error thrown
        /c: error detected but not passed on
        route not handled
        ```

    - web page: 404 - not found

注意中介軟體**必須**是一個函式。

也請注意，模組可以匯出函式，因此它也可以直接當成中介軟體使用。例如：lib/tourRequiresWaiver.js(Meadowlark Travel攀岩套裝行程責任豁免)：

```
module.exports = function (req, res, next) {
    var cart = req.session.cart;
    if (!cart) return next();
    if (cart.some(function (item) {
            return item.product.requiresWaiver;
        })) {
        if (!cart.warnings) cart.warnings = [];
        cart.warnings.push('One or more of your selected tours requires a waiver.');
    }
    next();
};
```

然後連結這個中介軟體：

```
app.use(require('./lib/tourRequiresWaiver'));
```

更常見的是，你可匯出一個物件，裡面包含中介軟體特性。例如我們將所有的購物車驗證碼放入lib/cartValidation.js：

```
/**
 * Created by eden90267 on 2017/6/8.
 */
module.exports = {
    checkWaivers: function (req, res, next) {
        var cart = req.session.cart;
        if (!cart) return next();
        if (cart.some(function (item) {
                return item.product.requiresWaiver;
            })) {
            if (!cart.warnings) cart.warnings = [];
            cart.warnings.push('One or more of your selected tours requires a waiver.');
        }
        next();
    },

    checkGuestCounts: function (req, res, next) {
        var cart = req.session.cart;
        if (!cart) return next();
        if (cart.some(function (item) {
                return item.guests > item.product.maximumGuests;
            })) {
            if (!cart.errors) cart.errors = [];
            cart.errors.push('One or more of your selected tours cannot accommodate the number of guests you have selected');
        }
        next();
    }
};
```

接下來可連結這個中介軟體：

```
var cartValidation = require('./lib/cartValidation');

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);
```

Top：`return next();`是`next(); return;`的簡寫。

## 常見的中介軟體

Express 4.0之前，Express是與Connect綁在一起的，這是一個含有大部分最常用的中介軟體的元件。因為Express的統合方式，中介軟體看起來就像Express的一部分(例如，你可這樣連結內文解析器：app.use(express.bodyParser))。這會隱瞞中介軟體其實屬於Connect的事實。在Express 4.0，Connect被移出Express了。隨著這個變化，有些Connect中介軟體(body-parser是個例子)從Connect移到自己的專案，Express唯一保留的中介軟體是static。Express移除中介軟體可讓它免於管理眾多的依賴關係，而且可讓各專案與Express之間的獨立性提升。

你幾乎需要Connect，所以建議你一定要與Express一起安裝它(`npm install --save connect`)，並讓你的應用程式可以使用它(`var connect = require('connect');`)

- basicAuth

    ```
    npm install --save basic-auth
    ```

    ```
    var auth = require('basic-auth');
    var user = auth(req);
    // => { name: 'something', pass: 'whatever' }
    ```

    提供基本的授權。這基本的授權只提供最基本的安全性，所以你只能透過HTTPS來使用基本授權(否則帳號與密碼都會被透明地傳遞)。當你需要非常快速且簡單的東西**而且**正在使用HTTPS的時候，才能使用基本授權。
    
- body-parser

    ```
    npm install --save body-parser
    ```
    
    ```
    app.use(require('body-parser')());
    ```
    
    單純地連結json與urlencoded的便利中介軟體。這個中介軟體仍可以在Connect中使用，但是會在3.0被移除，所以建議改用這個套件。除非你有特定的理由使用json或url-encoding，否則建議使用這個套件。
    
- json

    解析JSON編碼的請求內文。如果你要編寫一個會使用JSON編碼的內文的API，就需要這個中介軟體。還不是很普遍(大部分API使用application/x-www-form-urlencoded，它可用urlencoded中介軟體來解析)，但它會讓你應用程式更強健且適應未來。

- urlencoded

    以網際網路媒體類型application/x-www-form-urlencoded解析請求內文。這是最常見的表單及AJAX請求處理方式。

- multipart

    以網際網路媒體類型multipart/form-data解析請求內文。這個中介軟體已被棄用，Connect 3.0會移除它，你應該使用Busboy或Formidable。

- compress

    ```
    npm install --save compression
    ```
    
    ```
    // compress all responses
    app.use(compression());
    ```
    
    以gzip來壓縮回應資料。這是一個好東西，你的使用者會感謝你，特別是使用緩慢或行動網路的使用者。你應該在任何可能會傳送回應的中介軟體之前儘早將它連結進來。我建議唯一在compress之前連結的東西是除錯或日誌記錄中介軟體(它們不會傳送回應)。
    
- cookie-parser

    ```
    npm install --save cookie-parser
    ```
    
    ```
    app.use(require(require('cookie-parser')(保密放這裡)));
    ```
    
    提供cookie支援

- cookie-session

    ```
    npm install --save cookie-session
    ```
    
    ```
    app.use(require(cookie-session)());
    ```

    提供cookie存儲期程支援。它必須在cookie-parser之後連結。不建議推薦在期程使用此方法。

- express-session

    ```
    npm install --save express-session
    ```
    
    ```
    app.use(require('express-session')());
    ```
    
    提供期程ID(存儲在cookie裡面)期程支援。預設為記憶體存儲，這不適合在產品上使用，你可將它設置為使用資料庫。
    
- csurf

    ```
    npm install --save csurf
    ```    
    
    ```
    app.use(require(csurf)());
    ```
    
    提供跨網站偽造要求(CSRF)攻擊的防護。使用期程，所以你要在express-session中介軟體之後將它連結進來。目前它與connect-csrf中介軟體完全相同。可惜的是，只連結這個中介軟體並不能神奇地防護CSRF攻擊。

- directory

    ```
    npm install --save serve-index
    ```
    
    提供靜態檔案的目錄列舉支援。除非你特別需要列出目錄，否則沒有必要加入這個中介軟體。

- errorhandler

    ```
    npm install --save errorhandler
    ```
    
    ```
    app.use(require('errorhandler'));
    ```
    
    提供堆疊追蹤及錯誤訊息給用戶端。我不建議你在產品伺服器連結它，因為它會公開實作資訊，這可能會產生安全或隱私上的問題。
    
- static-favicon

    ```
    npm install --save static-favicon
    ```
    
    ```
    app.use(require('static-favicon')(path_to_favicon));
    ```
    
    傳送“favicon”(在瀏覽器的標題列上的圖示)。這不是必要的，你只要在靜態目錄中放置一個*favicon.ico*就可以了，但這個中介軟體可以提升效能。如果你使用它，必須在中介軟體堆疊非常高的地方將它連結進來。它可以讓你指定除了favicon.ico之外的檔案。
    
- morgan(previously logger)

    ```
    npm install --save morgan
    ```
    
    ```
    app.use(require('morgan')());
    ```
    
    提供自動的紀錄支援：所有請求都會被記錄。

- method-override

    ```
    npm install --save method-override
    ```
    
    ```
    app.use(require('method-override')());
    ```
    
    提供x-http-method-override請求標頭支援，可讓瀏覽器“偽裝”使用除了GET與POST之外的HTTP方法。這可在除錯上使用。當你在編寫API時才需要用到它。

- query

    解析查詢字串，並讓它可以被當成請求物件的query特性。這個中介軟體會被Express私下連結進來，所以不用自行連結。

- response-time

    ```
    npm install --save response-time
    ```
    
    ```
    app.use(require('response-time')());
    ```
    
    在回應添加X-Response-Time標頭，以毫秒為單位來提供回應時間。通常用在調整效能的時候。

- static

    ```
    app.use(express.static(path_to_static_files)());
    ```
    
    提供傳遞靜態(公共)檔案的支援。你可將這個中介軟體連結很多次，指定不同的目錄。

- vhost

    ```
    npm install --save vhost
    ```
    
    ```
    var vhost = require('vhost');
    ```
    
    虛擬主機(vhosts)是一個來自Apache的名詞，讓Express更容易管理子網域。
