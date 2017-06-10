/**
 * Created by eden_liu on 2017/6/7.
 */
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

// result:
//
// a:
//
//     ALLWAYS
//     /a: route terminated
//
// web page: a
//
//
// b:
//
//     ALLWAYS
//     /b: route not terminated
// SOMETIMES
// /b (part 2): error throw
// /b error detected and passed on
// unhandked error detected: b failed
//
// web page: 500 - server error
//
//
// c:
//
//     ALLWAYS
// SOMETIMES
// /c: error thrown
// /c: error detected but not passed on
// route not handled
//
// web page: 404 - not found