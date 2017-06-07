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

```