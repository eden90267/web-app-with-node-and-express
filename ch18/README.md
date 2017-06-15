# chap18. 安全

如果你可讓人登入，或如果你要儲存一些個人資料(PII)，就需要在網站上實作一些安全機制。

本章會討論HTTP Secure(HTTPS)，它奠定了一個基礎，可讓你在上面構建一個安全網站、驗證機制，並使用第三方認證機制。

本章目的是利用既有的驗證模組。此外，你有很好的理由使用第三方登入方法。

## HTTPS

Internet的特性，讓它可以用第三方工具來攔截在用戶端與伺服器端之間傳輸的封包。HTTPS會加密這些封包。讓攻擊者難以存取被傳輸的資料。

HTTPS是一種保護你的網站的基礎。它未提供驗證，但為驗證奠定基礎。系統的安全強健程度，第一個環節就是網路通訊協定。

HTTPS協定立基於具有**公共金鑰憑證**的伺服器，有時它被稱為**SSL**憑證。目前SSL憑證的標準格式稱為**X.509**。在憑證的背後，有一個**憑證授權**(**CA**)負責發出憑證。憑證授權會製作**受信任的根憑證**給瀏覽器供應商使用。當你安裝瀏覽器時，瀏覽器會加入這些受信任的根憑證，這就是在CA與瀏覽器之間建立信任鏈結的東西。為了讓這個鏈結工作，伺服器必須使用CA發出的憑證。

因此，為了提供HTTPS，你需要一個來自CA的憑證。那麼，要如何取得？廣義來說，你可以自己做、從免費的CA取得，或從商業CA購買。

### 製作你自己的憑證

製作你自己的憑證很簡單，但只適合開發與測試用(內部網路部署)。因為驗證授權的階層結構特性，瀏覽器只會信任已知的CA所產生的憑證。其他不認識的CA產生的憑證，瀏覽器會用非常嚴重的語氣提出行為上的警告，這會讓用戶端嚇得落荒而逃。

要產生你自己的憑證，你需要一個OpenSSL實作：

OS X：

```
brew install openssl
```

Windows：

[http://gnuwin32.sourceforge.net/packages/openssl.htm](http://gnuwin32.sourceforge.net/packages/openssl.htm)下載


安裝OpenSSL，可產生一個私用金鑰及一個公用憑證：

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout meadowlark.pem -out meadowlark.crt
```

通用名稱FQDN是瀏覽器用來識別網域的東西。如果你在使用localhost，就可以將它當成FQDN，你也可使用伺服器的IP位址或伺服器名稱。如果通用名稱與你在URL中使用的網域不相符，加密仍可動作，但你的瀏覽器會給你額外的警告。

PEM(Privacy-enhanced Electronic Mail，保密加強電子郵件)是你的私用金鑰，因此不能讓用戶端使用。CRT檔是自我簽署憑證，它會被送到瀏覽器，以建立安全連結。

### 取得免費的憑證授權

HTTPS以信任為基礎，在Internet中，取得信任最簡單方式是購買它。

CACert，不普及，主流瀏覽器都不支援。

主要認證供應商(Comodo與Symantec)都提供免費的試用憑證(30-90天存留)。

### 購買憑證

90%是由四間公司提供：Symantec、Comodo Group、Go Daddy及GlobalSign。直接從CA購買的價格很貴：通常每年$300起跳，比較便宜是透過仲介，從那邊購買，SSL憑證每年只要$10以下。

選擇購買憑證供應商，我有四個考慮要素：

- 客戶支援
- 避免鏈結起來的根憑證

    多憑證建立安全連結，會產生額外的安裝負擔。寧願多花錢來購買依賴單一根憑證的憑證。

- 單網域、多子網域、多網域，及萬用憑證

    一年內會添加不同的子網域，最好使用萬用憑證。多網域憑證支援多個全網域。

- 網域、組織與擴充過的驗證憑證

    憑證有三種：網域、組織，與擴充驗證。網域憑證只是為了保證你正在與你所認為你代表的網域做生意。組織憑證會為你正在交涉的實際機構提供一些保證。它們較難取得：通常需文書作業(詢問憑證供應商需要哪些東西)。最後是擴充驗證，它是SSL的勞斯萊斯。它們就像組織憑證，會驗證組織是否存在，但它需要更高標準的證明。我推薦較不貴的網域驗證或擴充的驗證憑證。組織憑證在瀏覽器畫面上沒有任何不同，除非使用者真的檢查驗證，否則他與網域憑證沒什麼不同。擴充的驗證憑證通常會顯示一些線索給使用者，告知他們正在與合法的業務交涉(例如顯示綠色的URL欄，且組織名稱會被顯示在SSL圖示旁邊)。

憑證保障的部分不用考慮，原因來自加密不足的可能性幾乎是零。

購買憑證後，就可以前往一個安全區域下載你的私用金鑰與憑證(檢查下載連結是否為HTTPS)。不要向使用email來傳遞私用金鑰的憑證供應商購買：email不是一個安全的管道。

### 啟用HTTPS供Express App使用

當你擁有自己的私用金鑰及憑證，在app中使用它們很簡單。

建議將私用金鑰與SSL憑證放在一個名為ssl的子目錄底下。接著你只要將http換成https模組，並將一個options物件傳至createServer。

```
var https = require('https');

function startServer() {
    var options = {
        key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
        cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
    };

    server = https.createServer(options, app).listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + ';' +
            ' press Ctrl-C to terminate.');
    });
}
```

### 連接埠備註

如果你想要在80埠執行HTTP app，或443埠的HTTPS app，不想明確指定連接埠，兩件事要考慮：

1. 許多系統都已經在80埠運行預設的web伺服器
2. 1-1024埠需要較高權限才能打開

主機供應商有一種較高權限的代理服務，會將請求傳遞到無權限的連接埠運行的app。下一節會進一步討論。

### HTTPS與代理伺服器

Express使用HTTPS很簡單，而且在開發過程中，它也可以良好地運行。但當你想要擴充網站來處理更多流量，就會使用諸如Nginx的代理伺服器。如果你的網站在共用主機環境下執行，幾乎可以確定它會有一個代理伺服器，會將請求路由到你的應用程式上。

如果你在使用代理伺服器，用戶端(使用者的瀏覽)會與**代理伺服器**通訊。而不是你的伺服器。代理伺服器大多會透過正規的HTTP與你的app通訊。你經常會聽到有人說HTTPS在代理伺服器**終結**。

大多數情況下，一旦你與主機供應商正確地設置代理伺服器來處理HTTPS請求，就不需要做任何額外的事情。這條規則有個例外，就是如果你的應用程式需要同時處理安全與不安全的請求的時候。

這個問題有三個解決方案。

- 設定你的代理伺服器，將所有的HTTP流量重新導向連結至HTTPS，在本質上強制讓應用程式的所有通訊都在HTTPS上進行。這種方法變得很常見，它當然是一種非常簡單的問題解決方式。

- 使用用戶端與代理伺服器之間通訊的協定，來與伺服器通訊。常見的方法是透過X-Forwarded-Proto標頭來通訊。例如，要在Nginx設定這個標頭：

    ```
    proxy_set_header X-Forwarded-Proto $schema;
    ```

    接下來，在你的app，你可以測試看看這個協定是否為HTTPS：

    ```
    app.get('/', function (req, res) {
        // 以下基本上等於
        // if (req.secure)
        if (req.headers['x-forwarded-proto'] === 'https') {
            res.send('line is secure');
        } else {
            res.send('you are insecure!');
        }
    });
    ```

Express提供一些方便的特性可讓你在使用代理伺服器時改變行為。不要忘記告知Express相信代理伺服器：使用`app.enable('trust proxy')`。一旦你那麼做，req.protocol、req.secure與req.ip會是用戶端到代理伺服器的連結。

## 跨網站請求偽造

跨網站請求偽造(CSRF)是利用使用者通常都會相信他們瀏覽器，並且在同一個期程之中造訪多個網站這個弱點來進行攻擊。在CSRF攻擊中，惡意網站上的指令碼會發出另一個網站的請求：如果你在其他的網站上登錄，惡意網站就可以成功從其他網站存取安全資料。

要避免CSRF攻擊，你必須想辦法確保某個請求合法來自你的網站。我們做法是傳遞一個獨一無二的權杖給瀏覽器。當瀏覽器提交表單，伺服器會檢查並確保權杖相符。csurf中介軟體會幫你建造及驗證權杖，你只需確保被傳到伺服器的請求中有權杖即可。

```
npm install --save csurf
```

接著將它連結起來，並添加一個權杖至res.locals：

```
// 這必須在cookie解析器與連結期程之後
app.use(require('csurf')());
app.use(function (req, res, next) {
    res.locals._csrfToken = req.csrfToken();
    next();
});
```

csurf中介軟體會在請求物件中添加csurfToken方法。我們不一定要將它指派給res.locals，也可以直接明確地將req.csurfToken()傳遞至每一個需要它的視圖，這通常比較不費工。

現在你必須在你的所有表單(及AJAX呼叫)中提供一個名為_csrf的欄位，它必須符合生成的權杖。

```
<div class="formContainer">
    <form class="form-horizontal newsletterForm" role="form"
          action="/newsletter" method="POST">
        <input type="hidden" name="_csrf" value="{{_csrfToken}}">
        <div class="form-group">
            <label for="fieldName" class="col-sm-2 control-label">Name</label>
            <div class="col-sm-4">
                <input type="text" class="form-control"
                       id="fieldName" name="name">
            </div>
        </div>
        <div class="form-group">
            <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
            <div class="col-sm-4">
                <input type="email" class="form-control" required
                       id="fieldEmail" name="email">
            </div>
        </div>
        <div class="form-group">
            <div class="col-sm-offset-2 col-sm-4">
                <button type="submit" class="btn btn-default">Register</button>
            </div>
        </div>
    </form>
</div>
```

csurf會處理剩下的部分，如果內文含有其他欄位，但沒有有效的_csrf欄位，它會發出一個錯誤。

Top：如果你有一個API，或許你不想讓csurf中介軟體干擾它。如果你想要限制其他網站存取你的API，應該參考connect-rest的"API金鑰"功能。要避免csurf干擾你的中介軟體，請在連結csurf之前將它連結進來。

## 驗證

驗證是個龐大、複雜的主題。**不要試著自己做**。

### 驗證 VS. 授權

- 驗證(Authentication)代表驗證使用者的身分。
- 授權是判斷使用者被授權使用、修改，或檢視。

### 密碼的問題

密碼的問題在於，每一個安全系統的強度，取決於它的最弱環節。讓使用者想出一個密碼，就是最弱的環節。

身為app設計者的你將無法做太多事情來修正這種結果，但是，你可以做一些事情來促進更安全的密碼。其中之一就是卸下責任，依賴第三方驗證。另一個是讓密碼管理服務可輕鬆地使用你的登錄系統，**例如LastPass**、RoboForm與PasswordBox。

### 第三方驗證

Google、Facebook、Twitter或LinkedIn，這些服務都有提供一個機制，可透過它們的服務來驗證並識別你的使用者。

Top：第三方驗證通常被稱為**聯合驗證**或**委派驗證**。聯合驗證通常與SAML與OpenID有關，而委派驗證通常與OAuth有關。

一般情況下，當使用者看到他們必須建立另一個帳號與密碼時，他們會選擇離開。

### 在你的資料庫中儲存使用者

無論你是否使用第三方驗證，都會在自己的資料庫裡面儲存使用者的紀錄。例如，如果需要儲存使用者的設定項目，就不能用Facebook來做這件事：你必須在自己的資料庫中儲存關於使用者的資訊。此外，你或許想要將email與你的使用者結合在一起，但他們不想要使用Facebook上的email地址(或其他第三方驗證服務)。最後，在資料庫儲存使用者資訊可讓你自行執行驗證，如果你想提供這項服務的話。

建立一個模型，*models/user.js*：

```
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
```

我們需要一筆使用者紀錄對應到一個第三方ID，所以我們有自己的ID特性，稱為authId。因為我們會使用多重驗證策略，那個ID會是策略類型及第三方ID的結合，以避免牴觸。例如：facebook:525764102、twitter:376841763。

我們會在範例中使用兩種角色："客戶"與"員工"。

### 驗證 VS. 註冊，使用者體驗