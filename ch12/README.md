# chap12. 生產考量

這章，會學習Express對不同的執行環境的支援、擴展網站的方法，及如何監視網站的健康。我們會看到如何在測試及開發的時候模擬產品環境，以及如何壓測，讓你可在產品發生問題前先將它找出來。

## 執行環境

Express支援執行環境的概念：這是一種讓你應用程式在產品、開發或測試模式下執行的方法。其實可使用許多不同環境。但請記得，產品、開發及測試都是“標準”環境：Express、Connect及第三方中介軟體都是基於這些環境來做決定的。換句話說，如果你有個“預備”環境，就無法讓它自動繼承產品環境的特性。因此，建議繼續使用產品、開發及測試這些標準。

雖你也可呼叫app.set('env', 'production')來指定執行環境，但我不建議這種做法：代表你的app無論在任何情況下都一定會在那個環境下執行。更糟的是，它可能一開始在某個環境執行，接下來切換到另一個。

比較好作法是使用環境變數NODE_ENV指定執行環境。

```
app.listen(app.get('port'), function () {
    console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + ';' +
        ' press Ctrl-C to terminate.');
});
```

啟動伺服器後，預設是在開發模式。我們來將它放到產品模式：

```
$ export NODE_ENV=production
$ node meadowlark.js
```

如果你使用Unix/BSD系統或Cygwin，有一個好用的語法可讓你修改該指令執行期間的環境：

```
$ NODE_ENV=production node meadowlark.js
```

這會讓伺服器在產品模式下執行，但一旦伺服器終止了，NODE_ENV環境變數就不會被修改。

Top：Express在產品模式下啟動：

```
Warning: connect.session() MemoryStore is not
designed for a production environment, as it will leak
memory, and will not scale past a single process.
```

之後換成資料庫時，這個警告就會消失了。

## 環境專用設定

只改變執行環境還不夠，雖Express會在產品模式下的主控台顯示更多警告。同樣的，在產品模式下，視圖緩存預設情況下是啟用的。

執行環境是一種工具，可讓你輕鬆地決定應用程式在不同環境下該有哪些行為。你應該要減少開發、測試與產品環境之間的差異。一些不可避免的是資料庫設定、日誌紀錄在不同環境的詳細程度。

我們在應用程式中加入一些日誌紀錄。開發中，使用Morgan(npm install --save morgan)，它使用彩色的輸出。產品中，使用express-logger(npm install --save express-logger)，它支援日誌輪換(每24小時就會被複製，並開始新的日誌，來避免日誌檔案無限制地成長)。接著在日誌檔案中添加日誌支援:

```
// logging
switch(app.get('env')) {
    case 'development':
        // 緊湊、彩色的開發日誌
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // 'express-logger'模組支援每日日誌切換
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}
```