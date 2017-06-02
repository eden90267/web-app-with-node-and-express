# 開始使用Node

## 使用Node來建立一個簡單的Web伺服器

Node提供的模式與傳統Web伺服器不一樣：**你編寫的app是Web伺服器**。Node只提供一個框架來讓你建構Web伺服器。

```
/**
 * Created by eden90267 on 2017/6/2.
 */
var http = require('http');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-type': 'text/plain'});
    res.end('Hello World!');
}).listen(3000);

console.log('Server started on localhost:3000; press Ctrl-C to terminate...');
```

## 事件驅動編程

Node背後的核心理念是**事件驅動編程**。

意思是：你必須瞭解有哪些事件可供你使用，及如何回應它們。

## 路由

路由(Routing)意思是將用戶端所要求的內容傳給它。對於Web式的用戶端/伺服器應用程式，用戶端會在URL中指定想要的內容，具體來說，就是**路徑**及**查詢字串**。

```
/**
 * Created by eden90267 on 2017/6/2.
 */
var http = require('http');

http.createServer(function (req, res) {
    // 移除查詢字串、可選的結尾斜線來正規化，並讓它變成小寫
    var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
    res.writeHead(200, {'Content-Type': 'text/plain'});
    switch(path) {
        case '':
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Homepage');
            break;
        case '/about':
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('About');
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
            break;
    }
}).listen(3000);

console.log('Server started on localhost:3000; press Ctrl-C to terminate...');
```

## 傳送靜態資源

Node的工作方式與Apache或IIS不同：我們需要開啟檔案，讀取它，接著將他的內容傳送至瀏覽器。

```
/**
 * Created by eden90267 on 2017/6/2.
 */
var http = require('http'),
    fs = require('fs');

function serveStaticFile(res, path, contentType, responseCode) {
    if (!responseCode) responseCode = 200;
    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('500 - Internal Error');
        } else {
            res.writeHead(responseCode, {'Content-Type': contentType});
            res.end(data);
        }
    })
}

http.createServer(function (req, res) {
    // 移除查詢字串、可選的結尾斜線來正規化，並讓它變成小寫
    var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
    res.writeHead(200, {'Content-Type': 'text/plain'});
    switch(path) {
        case '':
            serveStaticFile(res, '/public/home.html', 'text/html');
            break;
        case '/about':
            serveStaticFile(res, '/public/about.html', 'text/html');
            res.end('About');
            break;
        case '/img/logo.svg':
            serveStaticFile(res, '/public/img/logo.svg', 'image/svg+xml');
            break;
        default:
            serveStaticFile(res, '/public/notfound.html', 'text/html', 404);
            break;
    }
}).listen(3000);

console.log('Server started on localhost:3000; press Ctrl-C to terminate...');
```