/**
 * Created by eden_liu on 2017/6/15.
 */
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    authId: String,
    name: String,
    email: String,
    role: String,
    created: Date,
});

var user = mongoose.model('User', userSchema);
module.exports = user;