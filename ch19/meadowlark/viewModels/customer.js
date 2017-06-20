/**
 * Created by eden90267 on 2017/6/14.
 */
// 將欄位結合在一起的函式
function smartJoin(arr, separator) {
    if (!separator) separator = ' ';
    return arr.filter(function (elt) {
        return elt !== undefined && elt !== null && elt.toString().trim() !== '';
    }).join(separator);
}

var _ = require('underscore');

module.exports = function (customer, orders) {
    var vm = _.omit(customer, 'salesNotes');
    return _.extend(vm, {
        name: smartJoin([vm.firstName, vm.lastName]),
        fullAddress: smartJoin([
            customer.address1,
            customer.address2,
            customer.city + ', ' + customer.state + ' ' + customer.zip,
        ], '<br>'),
        orders: orders.map(function (order) {
            return {
                orderNumber: order.orderNumber,
                date: order.date,
                status: order.status,
                url: '/orders/' + order.orderNumber
            };
        }),
    });
};