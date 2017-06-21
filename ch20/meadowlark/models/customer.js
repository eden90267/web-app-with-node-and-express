/**
 * Created by eden_liu on 2017/6/14.
 */
var mongoose = require('mongoose');
var Orders = require('./orders.js');

var customerSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
    salesNodes: [{
        date: Date,
        salespersonId: Number,
        notes: String
    }],
});

customerSchema.method.getOrders = function (cb) {
    return Orders.find({customerId: this._id}, cb);
};

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;