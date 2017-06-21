/**
 * Created by eden90267 on 2017/6/22.
 */
var credentials = require('../credentials');

exports.home = function (req, res) {
    res.render('dealers', {googleApiKey: credentials.googleApiKey});
};