# chap19. 整合第三方API

為拉攏既有的使用者與尋找新的使用者，整合社群網站是必要策略。

要提供商店位置及其他定位服務，使用地理定位與對應服務是必要的。

提供API可協助擴展服務，也可以提供更多功能。

## 社群媒體

要促銷你的產品，社群媒體是一種很棒的方式：讓你的使用者可以輕鬆地在社群網站上分享你的內容非常重要。

### 社群媒體外掛與網站效能

大部分的社群媒體整合都是在前端進行。在網頁中參考合適的JavaScript檔，它可拉近來內容(Fb網頁上最前面三個記事)，丟出去內容(所在網頁放到推文)。雖這是最簡單的媒體整合方式，但它要付出代價：拜額外的HTTP請求所賜，網頁載入速度達兩倍甚至三倍之多。

可以讓Fb的“讚”按鈕或“推特”按鈕使用瀏覽器內的cookie，以使用者名義張貼文章的程式碼。

### 搜尋推文

如果我們要提及最新的十個內含#meadowlarktravel標籤的文件，使用前端元件，會涉及額外的HTTP請求。此外，如果我們在後端做這件事，就可將推文緩存來提升效能。此外，如果我們在後端做這種搜尋，我們就可以將惡意批評的推文放入“黑名單”，這在前端更難做到。

前往http://dev.twitter.com建立Twitter app。取得消費者金鑰與消費者密件。就可與Twitter REST API通訊了。

*lib/twitter.js*：

```
var http = require('http');

module.exports = function (twitterOptions) {

    return {
        search: function (query, count, cb) {
            // TODO
        }
    };

};
```

使用程式庫的方式：

```
var twitter = require('./lib/twitter')({
    consumerKey: credentials.twitter.consumerKey,
    consumerSecret: credentials.twitter.consumerSecret,
});

twitter.search('#meadowlarktravel', 10, function (result) {
    // 推文會在result.statuses裡面
});
```

實作search方法之前，必須提供一些功能讓twitter驗證我們的身份。以消費這金鑰與密件為基礎，使用HTTPS請求一個使用金鑰。該訪問權杖不會過期，我們也不希望每次都請求一個訪問權杖，我們會將訪問權杖緩存，方便重使用。

```
var http = require('http');

module.exports = function (twitterOptions) {

    // 模組外看不到這個變數
    var accessToken;

    // 模組外看不到這個函式
    function getAccessToken(cb) {
        if (accessToken) return cb(accessToken);
        // TODO: 取得訪問權杖
    }

    return {
        search: function (query, count, cb) {
            // TODO
        }
    };

};
```

接下來實作getAccessToken：

```
function getAccessToken(cb) {
    if (accessToken) return cb(accessToken);

    var bearerToken = Buffer(
        encodeURIComponent(twitterOptions.consumerKey) + ':' + encodeURIComponent(twitterOptions.consumerSecret)
    ).toString('base64');

    var options = {
        hostname: 'api.twitter.com',
        port: 443,
        method: 'POST',
        path: '/oauth2/token?grant_type=client_credentials',
        headers: {
            'Authorization': 'Basic ' + bearerToken,
        },
    };

    https.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var auth = JSON.parse(data);
            if (auth.token_type !== 'bearer') {
                console.log('Twitter auth failed.');
                return;
            }
            accessToken = auth.access_token;
            cb(accessToken);
        });
    }).end();
}
```

接著我們實作**搜尋**方法：

```
search: function (query, count, cb) {
    getAccessToken(function (accessToken) {
        var options = {
            hostname: 'api.twitter.com',
            port: 443,
            method: 'GET',
            path: '/1.1/search/tweets.json?q=' + encodeURIComponent(query) + '&count=' + (count || 10),
            headers: {
                'Authorization': 'Basic ' + accessToken,
            }
        };
        https.request(options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                cb(JSON.parse(data));
            });
        }).end();
    });
}
```

### 呈現推文

twitter喜歡確保它的資料的使用方式與品牌相符。因此，它有一些顯示上的需求([https://about.twitter.com/en-gb/company/display-requirements](https://about.twitter.com/en-gb/company/display-requirements))，你必須加入一些功能來顯示推文。

你最終仍要讓結果看起來很像內嵌的tweet。這很費工，而且也有方法可以跳過它，但它需要連結Twitter的Widget程式庫，它大量的HTTP請求是我們極力想要避免的。

如果你需要顯示推文，最佳選擇是使用Twitter Wdiget程式庫，即使它會產生額外的HTTP請求(因為Twitter的無處不在，瀏覽器或許已經緩存這個資源，因此效能衝擊可以忽略不計)。對於更複雜的API使用方式，你還是需要在後端使用REST API，因此最後你可能會用REST API與前端的指令碼搭配。

我們想要顯示前十個談到#meadowlarktravel標籤的推文。我們會使用REST API來搜尋推文，以及Twitter Widget程式庫來顯示它們。因我們不想要耗盡使用限制(或減緩伺服器)，我們會將推文及HTML緩存，並顯示它們15分鐘。

我們會先修改Twitter程式庫來加入一個方法embed，它會讓HTML顯示推文：

```
embed: function (statusId, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    options.id = statusId;
    getAccessToken(function (accessToken) {
        var requestOptions = {
            hostname: 'api.twitter.com',
            port: 443,
            method: 'GET',
            path: '/1.1/statuses/oembed.json?' + querystring.stringify(options),
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        };
        https.request(requestOptions, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                cb(JSON.parse(data));
            }).end();
        });
    });
},
```

現在我們已準備好搜尋並緩存推文。在主app檔，建立一個物件來儲存緩存：

```
var topTweets = {
    count: 10,
    lastRefreshed: 0,
    refreshInterval: 15 * 60 * 1000,
    tweets: [],
};
```

接下來建立一個函式來取得前面的推文。如果它們已經被緩存，且快取還沒逾期，我會直接回傳topTweets.tweets。否則，我們會執行搜尋，接下來持續呼叫embed來取得可內嵌的HTML。我們建立一個**承諾**(promises)。promise是一種管理非同步功能的技術。非同步函式會立即回傳，但我們可建立一個承認，它會在非同步部分完成的時候**實現**(resolve)。使用Q承諾程式庫：`npm install --save q`並執行`var Q = require(q);`：

```
function getTopTweets(cb) {
    if (Date.now() < topTweets.lastRefreshed + topTweets.refreshInterval)
        return cb(topTweets.tweets);

    twitter.search('#meadowlarktravel', topTweets.count, function (result) {
        var formattedTweets = [];
        var embedOpts = {omit_script: 1};
        var promises = result.statuses.map(function (status) {
            return Q.Promise(function (resolve) {
                twitter.embed(status.id_str, embedOpts, function (embed) {
                    formattedTweets.push(embed.html);
                    resolve();
                });
            });
        });
        Q.all(promises).then(function () {
            topTweets.lastRefreshed = Date.now();
            cb(topTweets.tweets = formattedTweets);
        });
    });
}
```

Q.all(promises)是有順序性的。

## 地理編碼

如果你的應用程式會使用某種地理計算(距離或方向)，或顯示地圖，你就需要地理座標。

### 使用Google地理編碼

Google與Bing都提供傑出的地理編碼REST服務，我們使用Google來示範：

```
var http = require('http');

module.exports = function (query, cb) {
    var options = {
        hostname: 'map.googleapis.com',
        path: '/maps/api/geocode/json?address=' + encodeURIComponent(query) + '&sensor=false',
    };
    http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            data = JSON.parse(data);
            if (data.results.length) {
                cb(null, data.results[0].geometry.location);
            } else {
                cb("No results found.", null);
            }
        });
    }).end();
};
```

現在我們有一個函式可聯繫Google API來將地址做地理編碼。如果它無法找到地址(或失敗)，就會回傳錯誤訊息。這個API可以回傳多個地址。可參考Google geocoding API文件：[https://developers.google.com/maps/documentation/geocoding/start](https://developers.google.com/maps/documentation/geocoding/start)。注意我們在API請求中加入&sensor=false：擁有定位感應器的設備，例如行動電話，必須將這個必要的欄位設為true。你的伺服器可能無法感測位置，所以應該將它設為false。

#### 使用限制

Google限制是24小時2,500請求。Google API也要求你在網站使用Google Maps。不能不違反服務條款的情況下，轉頭在Bing地圖上使用那筆資訊。

### 將你的資料地理編碼

Meadowlark加入“尋找經銷商”的功能，但沒有座標資訊，只有街道地址。這就是使用地理編碼API的時機。

要考慮使用限制、改變地址以及使用者等待過久的問題。`models/dealer.js`：

```
var mongoose = require('mongoose');

var dealerSchema = mongoose.Schema({
    name: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
    website: String,
    active: Boolean,
    geocodedAddress: String,
    lat: Number,
    lng: Number,
});

dealerSchema.methods.getAddress = function (lineDelim) {
    if (!lineDelim) lineDelim = '<br>';
    var addr = this.address1;
    if (this.address2 && this.address2.match(/\S/))
        addr += lineDelim + this.address2;
    addr += lineDelim + this.city + ', ' + this.state + this.zip;
    addr += lineDelim + (this.country || 'US');
    return addr;
};

var Dealer = mongoose.model('Dealer', dealerSchema);
module.exports = Dealer;
```

再來，我們希望它在用戶端的速度很快，所以我們要用這些資料建立一個JSON檔。

建立快取：

```
var dealerCache = {
    lastRefreshed: 0,
    refreshInterval: 60 * 60 * 1000,
    jsonUrl: '/dealers.json',
    geocodeLimit: 2000,
    geocodeCount: 0,
    geocodeBegin: 0,
};
dealerCache.jsonFile = __dirname + '/public' + dealerCache.jsonUrl;
```

建立一個協助函式，將給定的Dealer模型地理編碼，並將結果存到資料庫。注意，如果目前的經銷商地址符合最後被地裡編碼的那一筆，我們就不會在任何事情並返回。因此，如果經銷商的座標是最新狀態，這個編碼會非常快速：

```

```