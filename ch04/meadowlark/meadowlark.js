/**
 * Created by eden90267 on 2017/6/2.
 */
var express = require('express');

var fortune = require('./lib/fortune');

var app = express();

// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// 可藉由設定環境值(PORT)來改寫連接埠
app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('home');
});
app.get('/about', function (req, res) {
    res.render('about', {fortune: fortune.getFortune()});
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

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});