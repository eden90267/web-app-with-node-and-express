/**
 * Created by eden90267 on 2017/6/2.
 */
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