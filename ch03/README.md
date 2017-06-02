# chap03. 使用Express來節省時間

## 鷹架

借用了Ruby on Rails的做法，也就是所謂的“樣板”程式。自動產生初步的專案骨架。

Express提供一個公用程式，可產生鷹架來開始你的Express專案。

以下兩點不足以推薦：

1. 無法支援個人選擇的樣板化語言(Handlebars)
2. 無法遵循個人喜歡的名稱格式

這裡不會使用鷹架公用程式。

這裡推薦傑出的HTML5 Boilerplate，它會為HTML5網站製作一個巨大的空白版面。可產生自訂的組建版本。自訂組建的選項包括Twitter Bootstrap。

## 初始步驟

```
var express = require('express');

var app = express();

// 可藉由設定環境值(PORT)來改寫連接埠
app.set('port', process.env.PORT || 3000);

app.get('/', function (req, res) {
    res.type('text/plain');
    res.send('Meadowlark Travel');
});
app.get('/about', function (req, res) {
    res.type('text/plain');
    res.send('About Meadowlark Travel');
});

// 自訂404網頁
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// 自訂500網頁
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
```

`app.get`是添加路由的方法。這個方法有兩個參數：

- 路徑
- 函式

`app.VERB`：它是一個預留位置，供你的(小寫)HTTP指令使用(“get”與“post”是最常見的)。

路徑是定義路由的地方。注意app.VERB幫你做很多事：default情況下，忽略大小寫及結尾斜線，執行匹配時，也不會考慮查詢字串。

路由符合，提供的函式會被呼叫，收到的參數是請求與回應物件。

Express預設的狀態碼是200，你不需要特別指定。

Express的擴充：

- `res.send`，而不是Node的低階`res.end`。
- Node的`res.writeHead`換成`res.set`與`res.status`
- Express的`res.type`，它會設定Content-Type標頭

`app.use`：是Express添加**中介軟體**的方法。現在先想像成是一種處理程式，會抓取所有不符合路由的東西。

這裡有個重點：在Express，**路由與中介軟體的添加順序很清楚**。

路由也支援萬用字元。

```
app.get('/about*', function(req, res) {
    // 傳送內容
});
```

Express會透過回呼函式使用的引數的數字來分辨404與500處理程式。

到目前為止，Express已經提供了一些不那麼明顯的功能，前一章節中，我們必須：

1. req.url正規化，才能判斷要請求的資源
2. 必須手動剝開查詢字串及尾端的斜線，並換成小寫

現在Express的路由程式可自動為我們處理這些小地方。

## View與版面配置

Express的偏好設定：_Jade_。一種抽象化的HTML的引擎。但我建議使用另一種較不抽象畫的*Handlebars*。

Handlebars並不是要幫你將HTML抽象化：你會以特殊的標籤來編寫HTML，讓Handlebars來注入內容。

```
var app = express();

// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
```

這會建立一個view引擎，並預設使用Express。

每一個網頁上，都會有一定數量的HTML是一樣或非常類似的。版面配置提供一個共用框架，讓網站的所有網頁使用。

建立網站模板，`views/layouts/main.handlebars`：

```
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Meadowlark Travel</title>
</head>
<body>
{{{body}}}
</body>
</html>
```

`{{{body}}}`這個表達式會被換成每一個view的HTML。

注意當我們建立Handlebars實例時，我們指定預設的配置(defaultLayout:'main')。這代表除非你指定其他東西，否則這個配置會被套用在所有view。

建立首頁view網頁，`views/home.handlebars`：

```
<h1>Welcome to Meadowlark Travel</h1>
```

About網頁：

```
<h1>About Meadowlark Travel</h1>
```

404網頁：

```
<h1>404 - Server Error</h1>
```

500網頁：

```
<h1>500 - Server Error</h1>
```

再來將舊的路由換成這些view的新路由：

```
app.get('/', function (req, res) {
    res.render('home');
});
app.get('/about', function (req, res) {
    res.render('about');
});

// 404全部抓取處理程式(中介軟體)
app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

// 500錯誤處理程式(中介軟體)
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});
```

不需再指定內容類型或狀態碼了：在預設情況下，view引擎會回傳text/html的內容類型及狀態碼200。

在全部抓取處理程式中，我們必須明確地設定狀態碼。

## 靜態檔案與View

Express依賴**中介軟體**來處理靜態檔案與view。中介軟體是一種概念。它提供模組化的功能，讓請求的處理更加輕鬆。

static中介軟體可讓你指定一或多個目錄，來容納不需要任何處理就可傳送到用戶端的靜態資源。這是你可以放置諸如圖像、CSS檔及用戶端JavaScript檔案的地方。

建立public子目錄。然後在宣告任何路由之前，添加static中介軟體：

```
app.use(express.static(__dirname + '/public'));
```

static中介軟體的效果，是為每一個要傳送的靜態檔案建立路由，這個靜態檔案可以轉譯檔案並將它回傳給用戶端。

現在可直接參考`/img/logo.png`(public目錄對用戶端而言是隱形的)。static中介軟體會傳送該檔案，適當地設定內容類型。以下修改版面配置：

```
<body>
<header><img src="/img/logo.png" alt="Meadowlark Travel Logo"></header>
{{{body}}}
</body>
```

## View裡面的動態內容

View真正威力在於容納動態資訊。

About網頁中，傳送一個“虛擬的運勢餅乾”。meadowlark.js：

```
var fortunes = [
    "Conquer your fears or they will conquer you.",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple.",
];
```

修改view(/views/about.handlebars)：

```
<h1>About Meadowlark Travel</h1>

<p>Your fortune for the day:</p>
<blockquote>{{fortune}}</blockquote>
```

修改about路由：

```
app.get('/about', function (req, res) {
    var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    res.render('about', {fortune: randomFortune});
});
```