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