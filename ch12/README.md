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

Top：可採取一種類Unix的方法，並將日誌儲存在/var/log的子目錄，如同Apache的預設行為。

決定何時該選擇環境專用設定，需發揮最大的判斷力。當你試著做出開發專用的修改時，應該要先思考它會在產品的QA上產生什麼結果。

## 擴展你的網站

擴展代表兩件事：**向上擴展**或**向外擴展**。

**向上擴展**代表讓伺服器更強大：更快速的CPU、更好的結構、更多核心、更多記憶體等等。

另一方面，**向外擴張**只是代表更多伺服器。

隨著雲端運算及虛擬技術的普及，伺服器的運算能力已經不那麼重要，根據網站的需求來向外擴展是最符合經濟效益的方法。

Node良好地支援向外擴展，而且在編寫應用程式時，將它列入考量不會造成痛苦。

向外擴展設計的網站，最重要的是“**持久保存**”。如果你習慣依賴**檔案式**的存儲來持久保存，**從此停止這種做法**。除非你有一個檔案系統可以存取你的**所有**伺服器，否則不能依賴本地檔案系統來持久保存。唯讀資料例外，如日誌記錄及備份。例如，我經常會備份表單提交資料至本機一般檔案，以免資料庫連結失敗。當資料庫停機時，前往每一個伺服器收集檔案是件麻煩事，但至少不會有所損害。

## 使用App叢集向外擴展

Node本身支援app叢集，這是一種簡單、單一伺服器的向外擴展形式。藉由app叢集，你可在系統上為每一個核心(CPU)建立獨立的伺服器(比核心多的伺服器不能提升你的app的效能)。app叢集有兩項優點：首先，它們可以為給定的伺服器提供最大效能(硬體或虛擬機器)，其次，要測試你的app在平行狀態，這是一種低成本的方式。

我們來為網站添加叢集支援。在主要的應用程式檔案做這件事很正常，但我們接著要建立第二個應用程式檔案，他會在叢集上執行app，並使用之前一直在使用的非叢集應用程式檔。要做到這點，我們必須先對meadowlark.js檔案做一些修改：

```
function startServer() {
    http.createServer(app).listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + ';' +
            ' press Ctrl-C to terminate.');
    });
}

if (require.main === module) {
    // 應用程式直接執行，啟動app伺服器
    startServer();
} else {
    // 應用程式透過“需求”被提升為模組：會出函式至建構伺服器
    module.exports = startServer;
}
```

這項修改可讓meadowlark.js直接執行(node meadowlark.js)，也可讓它透過require陳述式當成模組加入。

Top：當一個指令碼直接執行的時後，require.main === nodule會是true，如果是false，代表你的指令已經被其他的使用碼使用require載入了。

接下來，建立一個新的指令碼，meadowlark_cluster.js：

```
/**
 * Created by eden90267 on 2017/6/9.
 */
var cluster = require('cluster');

function startWorker() {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.id);
}

if (cluster.isMaster) {
    require('os').cpus().forEach(function () {
        startWorker();
    });

    // 記錄所有未連結的worker，如果worker中斷連線，它就應該退出，所以我們會等待退出事件

    // 生出一個新的worker來取代它
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster.', worker.id);
    });

    // 當worker死掉的時候(結束)，建立一個worker來取代它
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.id, code, signal);
        startWorker();
    });
} else {

    // 在worker開始我們的app，見meadowlark.js
    require('./meadowlark')();

}
```

此程式執行，它會在master環境或worker環境，當Node的叢集系統執行它時。特性cluster.isMaster與cluster.isWorker會決定你所運行的環境。當我們執行這個指令碼，它是在master模式下執行，我們會使用cluster.fork來為一個系統中的CPU啟動一個worker。此外，我們會監聽worker的exit事件，
重新生出所有死掉的worker。

最後，在else子句，我們處理worker案例。因為我們將meadowlark.js設定為當成模組使用，我們只要匯入它並馬上呼叫。

若想確實看到不同的worker在處理不同的請求，在你的路由之前添加下列的中介軟體：

```
app.use(function (req, res, next) {
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
    next();
});
```

### 處理未捕獲的例外狀況

在Node的非同步世界中，未捕獲的例外狀況特別讓人注目。先從簡單例子開始：

```
app.get('/fail', function (req, res) {
    throw new Error('Nope!');
});
```

當Express執行路由處理程式時，它會將它們包裝在一個try/cache區塊，所以這其實不是一個未被捕獲的例外狀況。這不會造成太大的問題：Express會在伺服器端紀錄例外狀況，而且訪客會得到一個醜陋的堆疊dump。但你的伺服器是穩定的，其他的請求會持續地被正確處理。可提供一個“不錯”的錯誤網頁，並在所有的路由之後添加一個錯誤處理程式。

```
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
});
```

提供自製錯誤網頁，必然是良好的做法：對你的使用者而言，它看起來比較專業，你也可在錯誤發生時採取一些動作(寄發email給開發團隊)。

不幸的是，這只會發生在Express可以捕獲的例外情況。讓我們嘗試更糟的事情：

```
app.get('/epic-fail', function (req, res) {
    process.nextTick(function () {
        throw new Error('Kaboom!');
    });
});
```

此結果讓你整個伺服器掛了！這是因為setTimeout以非同步方式執行，具有例外的函式會被延遲，直到Node處於空閒狀態才可以執行。問題在於，當Node處於空閒狀態，可以執行函式時，請求的環境已經不再是當時的狀況，所以它已經沒有資源，只能豪不客氣關閉整個伺服器，因現在它正處於未定義的狀態(Node無法知道函式的目的或呼叫它的程式，所以它無法認為任何後續的函式都可以正確地工作)。

Top：process.nextTick非常類似setTimeout，引數使用零，但它比較有效率。

要處理未捕獲的例外狀況，我們可採取一些行動，但**如果Node無法判斷你的應用程式的穩定性**，**你也不行**。換句話說，如果有一個未被捕獲的例外，唯一的辦法就是關閉伺服器。我們能做的事，就是盡可能優雅地關閉，並提供一個容錯移轉機制。也就是使用叢集。一個worker掛了，另一個worker就會生出來取代工作。

當遇到異常的例外狀況，如何盡可能優雅關機？Node有兩個機制可以處理：**uncaughtException**事件與**領域**(domain)。

使用領域是最新而且推薦的做法(未來Node版本甚至可能會移除uncaughtException)。**領域**基本上是一個執行環境，它會捕捉在它裡面發生的錯誤。領域可讓你在處理錯誤時更有彈性：你使用的不是一個不能補獲例外狀況的全域處理程式，你可隨你喜歡決定使用多少領域，讓你在使用容易出現錯誤的程式時，可以建立新的領域。

在領域中處理所有的請求是一種很好的做法，這可讓你在那個請求與回應適當地抓到所有未被捕抓的錯誤(見由優雅地關掉伺服器)。可添加一個中介軟體來做到這點。這個中介軟體應該在任何其他的路由與中介軟體之上。

```
app.use(function (req, res, next) {
    // 為這個請求建立一個領域
    var domain = require('domain').create();
    // 在這個領域中處理錯誤
    domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 在5秒內關機
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // 中斷與叢集的連線
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();

            // 停止取用新的請求
            server.close();

            try {
                // 嘗試使用Express錯誤路由
                next(err);
            } catch (err) {
                // 如果Express錯誤路由失敗，嘗試一般的Node回應
                console.error('Express error mechanism failed.\n', err.stack);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Server error');
            }
        } catch (err) {
            console.error('Unable to send 500 response.\n', err.stack);
        }
    });

    // 將請求與回應物件加到領域
    domain.add(req);
    domain.add(res);

    // 執行領域中剩餘的請求鏈
    domain.run(next);
});

// 其他的中介軟體與路由從這開始

var server;

function startServer() {
    server = http.createServer(app).listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + ';' +
            ' press Ctrl-C to terminate.');
    });
}
```

未被捕捉錯誤在領域中出現，該函式都會被呼叫。這裡的方法是適當回應任何進行中的請求，接下來關閉伺服器。因為錯誤的性質，可能無法回應進行中的請求，所以做的第一件事是建立關閉的最後期限(5秒時間回應所有進行中的請求，視情況可拉長)。建立期限後，我們中斷與叢集的連接，這會避免叢集分配更多請求給我們。接下來明確告訴伺服器，我們不再接收新的連結。最後試著回應產生錯誤的請求，傳到錯誤處理路由(next(err))。如果它丟出例外，就用一般的Node API來回應。如果一切都失敗，那就記錄錯誤(用戶端逾時)。

設定未處理例外的處理程式後，我們添加請求與回應物件到領域中(讓這些物件中丟出錯誤的所有方法都會被領域處理)，最後，我們執行領域的環境的管道中的下一個中介軟體。注意這會有效地執行**所有**在領域的管道中的中介軟體，因為對next()的呼叫都是連結在一起的。

優雅的關機：一個worker就得馬上關機，犧牲所有進行中的期程，而如果你有多個worker，你就不得不讓垂死的worker在關機前處理剩餘的請求。

## 以多個伺服器向外擴展

使用叢集向外擴展，可將各個伺服器的效能最大化，但是當你需要一個以上伺服器時，要達成這種平行處理，你需要一個**代理**伺服器。

Nginx與HAProxy是代理領域的兩顆明日之星。特別是Nginx伺服器。作者公司的競爭分析，80%以上的對手都在使用。可勝任大多數嚴格的應用程式。

目前也有較小型的Node式代理伺服器，例如proxy與node-http-proxy。如果你需求沒那麼大，或只是要用來開發，這些都是不錯的選項。在產品，我建議使用Nginx或HAProxy。

安裝與設置代理伺服器超出這裡要講述的範圍。但目前使用叢集已可稍微讓我們確保網站已經準備好向外擴展了。

如果你會設置代理伺服器，請告訴Express你正在使用代理伺服器，而且應該信任它：

```
app.enable('trust proxy');
```

這麼做會確保req.ip、req.protocol與req.secure反應**用戶端與代理伺服器**之間的連結細節，而不是代理伺服器與你的app。此外，req.ips是一個陣列，說明原始用戶端IP，以及所有中介代理伺服器的名稱或IP位址。

## 監測你的網站

監測網站是最重要的QA評估項目之一。

如果你可以做什麼事情來說服老闆與客戶你已經盡責了，那就是**一定要**在他們知道之前先發現故障。

### 第三方工作時間監控程式

UptimeRobot可免費使用50個監控程式(50個監控程式輪詢)，間隔5分鐘，而且很容易設定。它可將警報發送到email、SMS、Twitter或iphone app。你可監控單一網頁的回傳碼(除200外都會被視為錯誤)，或查看網頁上的關鍵字是否存在。注意，關鍵字監控程式可能會影響你的數據(流量)。

如果你需求比較複雜，也有其他較昂貴的服務：Pingdom與Site24x7(有中文化，5監控，間隔10分鐘)。

### 應用程式故障

優雅地處理故障：讓使用者看到“很抱歉，這個服務目前正在維護中”訊息，以及收到email或文字訊息讓你知道故障的原因。

處理應用程式故障有一種較輕鬆的方式，就是用電子郵件寄送錯誤給你自己。之前ch11有看到如何建立一個錯誤處理機制來通知你發生錯誤。

如果你想要更複雜的通知：AWS的Simple Notification Service(SNS)。

Top：也可參考專用的錯誤監控服務：Sentry或Airbrake，他們提供更友善的體驗，讓你收到錯誤email。

## 壓力測試

壓力測試(or負載測試)的設計，是為了建立你的信心，在伺服器面對上百或上千個同時出現的請求時，可以正常動作。這是個可以用整本書來討論的領域，壓力測試可能很複雜，取決於你的專案的性質。

以下是一個簡單的測試，來確保你的應用程式可以在一秒鐘內處理首頁一百次，在壓力測試中，我們會使用一種Node模組，稱為loadtest：

```
npm install --save loadtest
```

現在來添加一個測試套件，稱為qa/tests-stress.js：

```
var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress test', function () {

    test('Homepage should handle 100 requests in a second', function (done) {
        var options = {
            url: 'http://localhost:3000',
            concurrency: 4,
            maxRequests: 100
        };
        loadtest.loadTest(options, function (err, result) {
            expect(!err);
            expect(result.totalTimeSeconds < 1);
            done();
        });
    });

});
```

可直接執行grunt，並看到新的測試通過。