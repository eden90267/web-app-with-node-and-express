# chap17. 用Express實作MVC

model-view-controller(MVC)，最大的優點之一，我認為是減少專案的斜升時間(ramp-up time)。熟悉PHP MVC的人可以很容易投入.NET MVC專案。程式領域中，**知道該去哪裡尋找想要的東西**並沒有那麼困難。MVC將功能分解成定義明確的領域，讓我們有一個共同框架可以開發軟體。

- model是你的資料與邏輯的"純"視圖。它完全不用理會來自使用者的互動。
- view會將model傳達給使用者。
- controller會接收使用者的輸入，操作model，並選擇要顯示哪一個view("coordinator(協調者)"比"controller(控制者)"更好的名詞:畢竟，controller聽起來不像是會接收使用者輸入的東西，而這是controller在MVC專案中的主要任務)。

MVVM，MVC的演化版本，引入一個有價值的概念：view model。view model是一種model的變形。一個簡單的view model可能會結合一個以上的model，或許多model之中的一部分，或單一model之中的一部分。它有一個非常有價值的概念：它的價值在"**保護**"model。在MVC中，修改或加強model，加入只有view需要的東西是很吸引人的(甚至是必要的)。Model view提供一個"出路"給你：如果你需要單純的顯示資料，這個view屬於view model。

如同任何模式，你必須決定它的嚴格程度為何。

## Model

model是最重要的組件。如果你的model很強健且設計良好，你一定可以拿掉展示層(或添加額外的展示層)。但使用其他的方式比較難，因為model是專案的基礎。

這一點很重要：**不要在model加入任何用來展示**，**或者與使用者互動的程式碼**。就算它看起來很簡單或很適合，我都可以保證你是為你的未來增添麻煩。更複雜的(而且有爭議的)問題是model與展示層之間的關係。

model與展示層可完全地分開，但要付出很大的代價。model的邏輯經常需要重度依賴持久保存，將兩個階層分開所產生的問題可能大於所得到的收穫。

我們這裡採用阻力最小的方式：使用Mongoose(針對MongoDB)來定義model。如果採用特定的持久技術會讓你有壓力，或許可考慮使用原生的MongoDB驅動程式(這不須任何架構或物件對應)，並將你的model從持久層分離出來。

有些人認為model應該是**只含資料**。但我不覺得這是可以提供幫助的限制，而比較喜歡將model當成資料與邏輯的結合。

建議在專案建立一個子目錄，稱為*models*來保存model。當有邏輯需要實作，或有資料需要儲存時，應該在models目錄裡面的檔案中做這件事。例如，客戶資料及邏輯放在一個稱為*models/customer.js*的檔案。

*models/order.js*：

```
var mongoose = require('mongoose');
var orderSchema = mongoose.Schema({
    /* TODO */
});
var Order = mongoose.model('Order', orderSchema);
module.exports = Order;
```

*models/customer.js*

```
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

customerSchema.method.getOrders = function () {
    return Orders.find({customerId: this._id});
};

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
```

## View Model

雖然我比較不喜歡將model直接傳給view，如果你想要修改model的原因，只因為你需要在view顯示一些東西，我當然建議你建立一個view model。view model可讓你抽象地保持你的model，同時提供有意義的資料給view。

以之前內容為例，想建立一個view來顯示客戶資訊以及訂單清單。目前的Customer：

- 不想讓客戶看到的資料(銷售票據)
- 想以不同格式將資料格式化(郵件地址及電話號碼)
- 顯示某些不在Customer model裡面的資料，例如客戶訂單的列表

這就是view model好用的地方。建立*viewModels/customer.js*：

```
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
```

view model的概念，基本上是為了保護model的完整性與範圍。如果你找到所有的複本(例如firstName: customer.firstName)，或許可以用Underscore，它會讓你有能力對物件進行更詳細的組合。例如，你可以複製一個物件，只挑選你要的屬性做其他事情，並複製一個物件，來去除某些特定安裝。(npm install --save underscore安裝)。

客戶清單的匿名view model，若要是很多地方使用，就應該建立一個客戶清單view model物件。

## Controller

controller負責處理使用者互動，並根據使用者互動來選擇適當的view來顯示。聽起來很像請求路由，不是嗎？在現實世界中，controller與路由程式之間的唯一差異，就是controller通常會將相關功能放在同一個群組。我們已經看過一些將相關路由放在一起的方法，現在只是將它稱為controller，讓它比較正式。

想像一個“客戶controller”：他負責檢視及編輯客戶的資訊，包括客戶訂單。controllers/customer.js：

```
/**
 * Created by eden90267 on 2017/6/15.
 */
var Customer = require('../models/customer');
var customerViewModel = require('../viewModels/customer');

module.exports = {

    registerRoutes: function (app) {
        app.get('/customer/register', this.register);
        app.post('/customer/register', this.processRegister);

        app.get('/customer/:id', this.home);
        app.get('/customer/:id/preferences', this.preferences);
        app.get('/orders/:id', this.orders);

        app.post('/customer/:id/update', this.ajaxUpdate);
    },

    register: function (req, res, next) {
        res.render('customer/register');
    },

    processRegister: function (req, res, next) {
        // TODO: back-end validation (safety)
        var c = new Customer({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone,
        });
        c.save(function (err) {
            if (err) return next(err);
            res.redirect(303, '/customer/' + c._id);
        });
    },

    home: function (req, res, next) {
        Customer.findById(req.params.id, function (err, customer) {
            if (err) next(err);
            if (!customer) return next();
            customer.getOrders(function (err, orders) {
                if (err) return next(err);
                res.render('customer/home', customerViewModel(customer, orders));
            });
        });
    },

    preferences: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); 	// pass this on to 404 handler
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/preferences', customerViewModel(customer, orders));
            });
        });
    },

    orders: function (req, res, next) {
        Customer.findById(req.params.id, function (err, customer) {
            if (err) next(err);
            if (!customer) return next();  // pass this on to 404 handler
            customer.getOrders(function (err, orders) {
                if (err) return next(err);
                res.render('customer/preferences', customerViewModel(customer, orders));
            });
        });
    },

    ajaxUpdate: function (req, res, next) {
        Customer.findById(req.params.id, function (err, customer) {
            if (err) return next(err);
            if (!customer) return next();
            if (req.body.firstName) {
                if (typeof req.body.firstName !== 'string' || req.body.firstName.trim() === '') {
                    return res.json({error: 'Invalid name.'});
                }
                customer.firstName = req.body.firstName;
            }
            // and so on...
            customer.save(function (err) {
                return err ? res.json({error: 'Unable to update customer'}) : res.json({success: true});
            });
        });
    }


};
```

在controller中，我們將路由管理與實際的功能分開。

如果你想編寫一個controller，讓它也可以處理各種附加在它上面的UI類型，這是可行的做法(例如原生app)。

## 結論

MVC只是一般概念，不是具體技術。我們這章只是將路由處理程式稱為“controller”來讓他聽起來比較正式一點，並且將路由與功能分開。我們也介紹view model的概念，我認為它對於保持model的完整性很重要。