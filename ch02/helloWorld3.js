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