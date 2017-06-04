# chap06. 請求與回應物件

先討論一些背景，包括用戶端如何請求來自伺服器的網頁，以及網頁如何將它回傳。

## URL的各個部分

http://localhost:3000/about?test=1#history

| http:// | localhost | :3000  | /about | ?test=1  | #history |
|---------|-----------|--------|--------|----------|----------|
| 協定    | 主機名稱  | 連接埠 | 路徑   | 查詢字串 | 片段     |

- 協定

    負責決定請求的**傳輸方式**，我們會專門處理http與https。其他常見的協定包括file與ftp。

- 主機

    主機負責識別伺服器，本機或區域網路的伺服器可能只是一個單字，也可能是一個數值的IP位址。在網際網路上，主機會以頂級網域名稱(TLD)結尾，如.com或.net。此外，主機名稱前面可能也會有子網域。www是很常見的子網域，不過子網域可以是任何東西，它是選用的。

- 連接埠

    每個伺服器都有一群以數字代表的連接埠。省略連接埠，會有假定的埠號，e.g. http：80、https：443，若不使用這些特殊連接埠，就應使用大於1023的連接埠。
    
- 路徑

    路徑通常是app第一個在乎的URL部分。你應該用路徑來獨一無二地識別網頁或app的其他資源。
    
- 查詢字串

    是一種選用的名稱/值配對集合。以問號開始，名稱/值配對以&號分隔。名稱與值都應該是URL編碼。JavaScript提供一種內建的功能可為你做這件事：**encodeURIComponent**。
    
- 片段

    片段(fragment)(或雜湊(hash))不會被傳至伺服器，他完全是供瀏覽器使用的。SPA或重度的AJAX應用程式已經越來越喜歡使用片段來控制應用程式了。最初，片段唯一的目的是以錨點標籤(`<a id=chapter06>`)來讓瀏覽器顯示文件的特定部分。
    
## HTTP請求方法

HTTP協定定義了一群請求方法(通常稱為HTTP動詞)，讓用戶端用它來與伺服器通訊。最常見是GET與POST。

app就是使用方法、路徑及查詢字串的組合來判斷如何回應。

POST請求的工作通常是將資訊傳回伺服器(ex：表單處理)。伺服器處理請求裡面的所有資訊後，POST請求回應的HTML與對應的GET請求經常是一樣的。

瀏覽器與伺服器通訊，會使用GET與POST方法之一。

## 請求標頭

當你造訪網頁，瀏覽器都會傳送許多“隱形”的資訊。

- 比較喜歡接收的網頁語言
- 使用者代理程式(瀏覽器、作業系統及硬體)及一些其他資訊

這些資訊都會以請求標頭的形式來傳遞，可透過headers特性來取得。

## 回應標頭

如同瀏覽器以請求標頭格式傳送隱形資訊，當伺服器回應時，它也會回傳不會被瀏覽器轉譯或顯示的資訊。回應標頭裡面的資訊通常是中繼資料及伺服器資訊。

- Content-Type標頭，它讓瀏覽器知道要傳送的是哪一種內容(HTML、圖像、CSS、JavaScript等等)。無論URL路徑為何，瀏覽器都會尊重Content-Type標頭(路徑是抽象，瀏覽器使用Content-Type來判斷如何呈現內容)。
- 標頭也可指示回應是否被壓縮，以及使用的編碼種類。
- 回應標頭的內容也可以提示瀏覽器，告訴它需要多少時間來緩存資源。
- 回應標頭也經常含有一些伺服器的資訊，說明伺服器類型，甚至會有OS的詳細資料。回傳伺服器資訊的缺點是，它會給駭客一個可以入侵網站的地方。具安全意識的伺服器通常會省略這個資訊，甚至提供錯誤的資訊。取消Express的預設標頭X-Prowere-By很容易：

    ```
    app.disable('x-powered-by');
    ```
    
## 網際網路媒體類型

Content-Type格式是一種網際網路媒體類型、副類型及選用參數。

例如：

- `text/html; charset=UTF-8`：指定一種“文字”類型，一種“html”的副類型，及一種UTF-8的字元編碼。

“內容類型”、“網際網路類型”及“MIME類型”。在大多數情況下，它們是相同的。

## 請求內文

除了請求標頭之外，一個請求可以擁有一個**內文**(如同回應的內文就是所回傳的實際內容)。一般GET請求沒有內文，但POST請求通常會有。POST內文最常見的媒體類型是`application/x-www-form-urlencoded`，這是以&號分隔，被編碼成名稱/值。如果POST需要支援檔案上傳，媒體類型是`multipart/form-data`，這是比較複雜的格式，最後，AJAX的請求可使用`application/json`。

## 參數

“參數”可代表許多東西，對於所有請求，參數可能是：

- 查詢字串
- 期程(session，需要cookie)
- 請求內文
- 具備名稱的路由參數

Node中，請求物件的param方法會自行轉換這所有參數。我建議不要使用它，這通常會產生問題。如果有一個參數被設為查詢字串某個東西，以及另一個在POST內文或期程中的東西時，哪個值勝出？

我們將會看到負責保存各種參數類型的專用特性。

## 請求物件

請求物件一開始是http.IncomingMessage的實例，Node的核心物件。Express加入額外的功能。我們來看請求物件最好用的特性及方法(這些都是Express添加的，除了req.headers與req.url之外，它們來自Node)：

- req.params

    含有**具有名稱的路由參數**的陣列。

- req.param(name)

    回傳具有名稱的路由參數，或GET或POST參數。建議不要使用這種方法。

- req.query

    含有查詢字串參數的物件(有時稱為GET參數)，為名稱/值配對。

- req.body

    物件包含POST參數。它如此命名，是因為POST參數會被傳入REQUEST的內文，不是像查詢字串參數一樣的URL。要使用req.body，你需要中介軟體來解析內文的內容類型。

- req.route

    目前匹配的路由資訊，主要用途是路由除錯。

- req.cookies/req.signedCookies

    含有用戶端傳送的cookie值的物件。
    
- req.headers

    接收自用戶端的請求標頭。
    
- req.accepts([types])

    這是一種方便的方法，可用來判斷用戶端是否已接收所給的類型(選用的types可以是一個MIME類型，例如application/json、以逗號分隔的清單，或陣列)。主要讓編寫公用API的人使用，它會假設瀏覽器一定會在預設情況下接收HTML。
    
- req.ip
- req.path

    請求路徑(沒有協定、主機、連接埠或查詢字串)

- req.host

    這個資訊可能是偽造，不要用在安全用途上。

- req.xhr

    如果請求是來自AJAX呼叫，這個方便的特性會回傳true。
    
- req.protocol
- req.secure

    如果連結是受到安全防護的，這個方便的特性會回傳true。它相當`req.protocol === 'https'`。
    
- req.url/req.originalUrl

    他有點用詞不當，這些特性會回傳路徑及查詢字串(不包含協定、主機或連接埠)。可以重寫req.url，但是req.originalUrl目的是為了保持原始的請求及查詢字串。
    
- req.acceptedLanguages

    這個方便的方法會按造順序回傳用戶端喜歡的語言陣列。這個資訊是從請求標頭解析而來。
    
## 回應物件

源於http.ServerResponse的實例的回應物件，是核心的Node物件。Express為它添加了額外的功能。我們來看回應物件好用的特性及方法(都是Express添加的)：

- res.status(code)

    設定HTTP狀態碼。Express預設值是200，你會使用這方法來回傳404、500或其他想要用的狀態碼。對於重新導向轉接(301、302、303及307)有一個較好方法：redirect。
    
- res.set(name, value)

    設定回應標頭。你通常不會手動改變它。
    
- res.cookie(name, value, [options]), res.clearCookie(name, [options])

    設定或清除用戶端儲存的cookie。這需要一些中介軟體的支援。

- res.redirect([status], url)

    將瀏覽器重新導向轉接。預設的重新轉向碼是302(找到)。一般而言，你應該盡量少用重新導向，除非要永遠移除一個網頁，此時你應該使用301碼(永久移除)。

- res.send(body), res.send(status, body)

    傳送回應給用戶端，可選擇加上狀態碼。Express預設的內容類型是text/html，所以如果你想調整為text/plain(例如)，就必須在呼叫res.send之前呼叫res.set('Content-Type', 'text/plain')。如果body是一個物件或陣列，會改用JSON來傳送回應(正確地設定內容類型)，就算你想要傳送JSON，也建議你明確地呼叫res.json。

- res.json(json), res.json(status, json)

    傳送JSON至用戶端，內容可選用狀態碼。

- res.jsonp(json), res.jsonp(status, json)

    傳送JSONP至用戶端，內容可選用狀態碼

- res.type(type)

    這是一種方便的方法，可設定Content-Type標頭。它實質上等同res.set('Content-Type', type)，但如果你提供一個沒有斜線的字串，它也會試著將副檔名對應至網際網路的媒體類型。例如，res.type('txt')的結果是text/plain。這些功能在某些領域會發揮很好的用途(例如，自動傳送完全不同的多媒體檔案)。

- res.format(object)

    這方法可讓你根據Accept請求標頭來傳送不同內容。這是API主要用途。例如：
    
    ```
    res.format({'text/plain': 'hi there', 'text/html': '<b>hi there</b>'})
    ```

- res.attachment([filename]), res.download(path, [filename], [callback])

    這兩個方法都會對attachment設定一個回應標頭，稱為Content-Disposition，這會讓瀏覽器彈出提示來下載內容，而不是將它顯示在瀏覽器上。你可指定filename，來提示瀏覽器。你可使用res.download來指定要下載的檔案，而res.attachment只設定標頭，你仍然要將內容傳送給用戶端。

- res.sendFile(path, [options], [callback])

    這個方法會讀取path指定的檔案，並將它的內容傳送給用戶端。這方法應該不常用到，因為使用static中介軟體，並將想要提供給用戶端的檔案放在public目錄比較簡單。但是，如果你想要使用同一個URL，根據不同情況來傳送不同的資源，這種方法很方便。
    
- res.links(links)

    設定Links回應標頭。這是一個專用的標頭，對大部分的應用程式而言沒多大的用途。
    
- res.locals, res.render(view, [locals], callback)

    res.locals是一種物件，裡面有**預設**的內容，用來呈現視圖。res.render會使用所設置的模板引擎來呈現視圖。(請勿將res.render的locals參數與res.locals弄混了：它會改寫res.locals裡面的內容，但未被改寫的內容仍然可用)。預設res.render會回應200這個代碼。
    
## 取得更多資訊

如果你在尋找某種功能，先去查閱Express API文件。

如果你需要未被放入文件的資訊，有時你必須查看Express資源。以下是讓你快速在Express資源找到東西的指南：

- *lib/application.js*

    主要的Express介面。如果想了解中介軟體如何被連結進來，以及視圖如何被呈現，這就是你要找的地方。

- *lib/express.js*

    這是簡短的殼層，它會擴充Connect，讓它具備*lib/application.js*裡面的功能，並回傳一個函式，這個函式可以與`http.createServer`一起使用，以實際執行Express app。

- *lib/request.js*

    擴充Node的http.IncomingMessage物件來提供強健的請求物件。

- *lib/response.js*

    擴充Node的http.ServerResponse物件來提供回應物件。

- *lib/router/route.js*

    提供基本的路由支援。
    
## 開始烹調

## 顯示內容

呈現內容，通常會使用`res.render`，他會顯示視圖與版面配置，提供最大的價值。

只想測試網頁，可能會使用`res.send`。

或許你會使用`req.query`取得查詢字串值。

用`req.session`取得期程值

`req.cookie`/`req.signedCookies`取得cookie。

- 範例1. 基本用法

    ```
    app.get('/about', function (req, res) {
	    res.render('about');
	});
    ```

- 範例2. 除了200之外的回應碼

    ```
    app.get('/error', function(req, res) {
        res.status(500);
        res.render('error');
    });
    // 或是單行方式
    app.get('/error', function(req, res) {
        res.status(500).render('error');
    });
    ```

- 範例3. 傳遞內容之視圖，包括查詢字串、cookie及期程值

    ```
    app.get('/about', function (req, res) {
	    res.render('about', {
	        message: 'Welcome',
	        style: req.query.style,
	        userid: req.cookie.userid,
	        username: req.session.username
	    });
	});
    ```

- 範例4. 顯示沒有版面配置的視圖

    ```
    app.get('/no-layout', function (req, res) {
	    res.render('no-layout', {layout: null});
	});
    ```

- 範例5. 呈現具有自訂版面配置的視圖

    ```
    // 這裡會使用版面配置檔案的視圖 views/layouts/custom.handlebars
	app.get('/custom-layout', function (req, res) {
	    res.render('custom-layout', {layout: 'custom'});
	});
    ```

- 範例6. 顯示純文字輸出

    ```
    app.get('/test', function (req, res) {
	    res.type('text/plain');
	    res.send('this is a test');
	});
    ```

- 範例7. 添加錯誤處理程式

    ```
    // 就算你不需要next函式，也必須將它加入，讓Express可以認出這是一個錯誤處理函式
    app.use(function (err, req, res, next) {
	    console.error(err.stack);
	    res.status(500);
	    res.render('500');
	});
    ```

- 範例8. 添加一個404錯誤處理函式

    ```
    app.use(function (req, res) {
	    res.status(404).render('not-found');
	});
    ```

### 處理表單

表單資訊通常會在req.body裡面(有時在req.query裡面)。你可使用req.xhr判斷該請求是否是AJAX請求或瀏覽器請求。

- 範例9. 基本表單處理

    ```
    // 必須連結內文解析中介軟體
	app.post('/process-contact', function (req, res) {
	    console.log('Received contact from ' + req.body.name + ' <' + req.body.email + '>');
	    // 存到資料庫
	    res.redirect('303', '/thank-you');
	});
    ```

- 範例10. 更強大的表單處理

    ```
    app.post('/process-contact', function (req, res) {
	    console.log('Received contact from ' + req.body.name + ' <' + req.body.email + '>');
	    try {
	        // 存到資料庫...
	
	        return req.xhr ? res.render({success: true}) : res.redirect(303, '/thank-you');
	    } catch (ex) {
	        return res.xhr ? res.json({error: 'Database error.'}) : res.redirect(303, '/database-error');
	    }
	});
    ```

### 提供API

提供API與處理表單很像，參數通常會在req.query裡面，但你也可以使用req.body。差異之處在於你通常會回傳JSON、XML、甚至純文字，而不是HTML，而且你通常會使用較不常用的HTTP方法，例如PUT、POST與DELETE。

範例11與12使用下列“產品”陣列：

```
var tours = [
    {id: 0, name: 'Hood River', price: 99.99},
    {id: 1, name: 'Oregon Coast', price: 149.95}
];
```

Top：endpoint這個字眼通常用來說明API之中的函式。

- 範例11. 一個簡單的GET端點，只回傳JSON

    ```
    app.get('/api/tours', function (req, res) {
	    res.json(tours);
	});
    ```

- 範例12. 使用Express的res.format方法，根據用戶端的喜好設定來回應

    ```
    app.get('/api/tours', function (req, res) {
	    var toursXml = '<?xml version="1.0"?><tours>' +
	        tours.map(function (t) {
	            return '<tour price="' + t.price +
	                '" id="' + t.id + '">' + t.name + '</tour>';
	        }).join('') + '</tours>';
	    var toursText = tours.map(function (t) {
	        return t.id + ': ' + t.name + ' (' + t.price + ')';
	    }).join('\n');
	    res.format({
	        'application/json': function () {
	            res.json(tours);
	        },
	        'application/xml': function () {
	            res.type('application/xml');
	            res.send(toursXml);
	        },
	        'text/xml': function () {
	            res.type('text/xml');
	            res.send(toursXml);
	        },
	        'text/plain': function () {
	            res.type('text/plain');
	            res.send(toursText);
	        }
	    });
	});
    ```

範例13，PUT端點會更新產品並回傳JSON。參數是在查詢字串中傳遞(路由字串中的":id"告訴Express在req.params添加一個id特性)

- 範例13. 更新用的PUT端點

    ```
    app.put('/api/tour/:id', function (req, res) {
	    var p = tours.some(function (p) {
	        return p.id === req.params.id;
	    });
	    if (p) {
	        if (req.query.name) p.name = req.query.name;
	        if (req.query.price) p.price = req.query.price;
	        res.json({success: true});
	    } else {
	        res.json({error: 'No such tour exists.'});
	    }
	});
    ```

- 範例14. 刪除用的DEL端點

    ```
    app.del('/api/tour/:id', function (req, res) {
	    var i;
	    for (i = tours.length - 1; i >= 0; i--) {
	        if (tours[i].id === req.params.id) {
	            break;
	        }
	    }
	    if (i >= 0) {
	        tours.splice(i, 1);
	        res.json({success: true});
	    } else {
	        res.json({error: 'No such tour exists.'});
	    }
	});
    ```