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

驗證指的是確認使用者的身份。

註冊是使用者在你的網站上取得帳號的程序。

第三方混亂(不知用哪個第三方服務註冊登入)：是用戶體驗要考慮的課題。

### Passport

護照是一種非常受歡迎且強健的Node/Express驗證模組。它不依賴任何驗證機制，而是立基於可插拔驗證**策略**的概念(不想使用第三方驗證，可使用在地策略)。

我們先從驗證機制開始，之後再增加。

如果使用第三方驗證，你的app**永遠不會收到密碼**。它是完全由第三方處理的。安全處理與儲存密碼的負擔移到第三方身上。

整個流程需要依賴重新導向轉接(302/307)。

在詳細說明實作方法前，先詳細考慮這些步驟：

1. **登入網頁**

    使用者選擇登入方法的地方。若選擇第三方驗證，它通常只是一個按鈕或連結。如果是在地驗證，它會有帳號與密碼欄位。

2. **建構驗證請求**

    你將建構一個將會被用來傳送給第三方的請求(透過重新導向)。這個請求細節很複雜，而且是這種驗證策略專用的。Passport(及策略外掛)會在這裡承擔所有工作。驗證請求包含“中間人”攻擊的防護措施，以及其他攻擊者可能會利用的載體。通常身分驗證請求是短命的，所以你不能將它儲存以供未來使用：這可限制攻擊者的攻擊時間。

    我們經常會請求使用者名稱，或許還有email地址。請記得，詢問越多資訊，他們就越不想要授權給你的應用程式。

3. **確認驗證回應**

    使用者授權你的應用程式，第三方會給你一個有效的驗證回應，它就是使用者的身份證明。在驗證回應裡面的東西是一個**供特定第三方使用的**使用者專屬ID。第2步驟到第4步驟，我們必須記得使用者是被授權的。常見的做法是設定一個session變數，裡面包含使用者ID，指示這個session已經被授權。

4. **驗證授權**

    session的使用者ID，從我們資料庫取出物件。也就不用每次請求都要跟第三方驗證。如果物件不能使用，會指示“請求未獲授權”，可重導向到登入或“未獲授權”的網頁。

### 設定Passport

單一驗證提供者。設定Passport與Facebook策略，需要Facebook app，最好Facebook帳號用該網站的帳號連建立Facebook app(產品環境)，例如Meadowlark Travel Facebook帳號。

Facebook app的管理不斷在改變，所以這邊不詳細說明，請見：[https://developers.facebook.com/docs](https://developers.facebook.com/docs)

為開發與測試起見，網域名稱的設置必須相同。重點在於，你在瀏覽器輸入，用來測試app的URL(例如：*http://localhost:3000*)是與Facebook app有關聯的。目前你只能將一個網域與你的app連結在一起：如果你需要使用多個網域，就必須建立多個app(例如，Moeadowlark Dev、Meadowlark Test、Meadowlark Staging，你的產品可稱為Meadowlark Travel)。

設定app之後，還需要它的專屬app ID，及它的app密碼，你可在Facebook app管理網頁找到它們。

現在來安裝Passport，及Facebook驗證策略：

```
npm install --save passport passport-facebook
```

再來是寫驗證程式(如果要支援多重策略的話)，建立模組*lib/auth.js*。先從匯入及兩個Passport需要的方法開始：serializeUser與descrializeUser：

```
var User = require('../models/user'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err || !user) return done(err, null);
        done(null, user);
    });
});
```

Passport使用serializeUser與deserializeUser來將請求對應到已驗證的使用者，讓你可以任意地使用儲存方法。在我們案例中。我們只會在期程中儲存MongoDB指派的ID(User._id特性)。

當這兩個方法都完成之後，只要有活著的期程，而且使用者已成功地驗證，req.session.passport.user就會是相應的User模型實例。

接下來，我們要選擇匯出的東西。要啟用Passport功能，我們需要兩個全然不同的動作：初始化Passport，並註冊將會處理驗證的路由，及從我們的第三方驗證服務重新導向回呼。

```
module.exports = function (app, options) {

    // 如果沒有指定重新導向成功或失敗，設定一些合理的預設值
    if (!options.sucessRedirect)
        options.sucessRedirect = '/account';
    if (!options.failureRedirect)
        options.failureRedirect = '/login';

    return {
        init: function () {
            /* TODO */
        },
        registerRoutes: function () {
            /* TODO */
        }
    };
};
```

討論init與registerRoutes方法之前，先來看如何使用這個模組：

```
// authentication
var auth = require('./lib/auth')(app, {
    providers: credentials.authProviders,
    successRedirect: '/account',
    failureRedirect: '/unauthorized',
});
// auth.init()將Passport中介軟體連結起來
auth.init();

// 現在我們可以指定驗證路由
auth.registerRoutes();
```

注意，我們也指定了providers的特性，*credentials.js*：

```
authProviders: {
    facebook: {
        development: {
            appId: 'your_app_id',
            appSecret: 'your_app_secret',
        },
    },
},
```

我們在development特性中放入app資訊，這可讓我們指明開發與產品app。

現在來看init方法：

```
init: function () {
    var env = app.get('env');
    var config = options.providers;

    // 設定Facebook策略
    passport.use(new FacebookStrategy({
        clientID: config.facebook[env].appId,
        clientSecret: config.facebook[env].appSecret,
        callbackURL: (options.baseUrl || '') + '/auth/facebook/callback',
    }, function (accessToken, refreshToken, profile, done) {
        var authId = 'facebook:' + profile.id;
        User.findOne({authId: authId}, function (err, user) {
            if (err) return done(err, null);
            if (user) return done(null, user);
            user = new User({
                authId: authId,
                name: profile.displayName,
                created: Date.now(),
                role: 'customer',
            });
            user.save(function (err) {
                if (err) return done(err, null);
                done(null, user);
            });
        });
    }));

    app.use(passport.initialize());
    app.use(passport.session());
},
```

這是相當密集的程式，其實大部分都只是Passport樣板。最重要的部分在被傳送到FacebookStrategy實例的函式裡面。

當這函式被呼叫時(在使用者被成功地驗證之後)，profile參數裡面會有Facebook使用者的資訊。最重要的是，它裡面有Facebook ID：這就是我們用來將Facebook帳號與我們的User模型連結的東西。注意我們將authId特性前面加上*facebook:*來作為命名空間。雖然機會小，這可避免Facebook ID與twitter或Google ID撞名(也可讓我們查看使用者模型來看使用者使用哪一種驗證方法，這會有很大幫助)。如果資料庫已經有這個命名空間ID的項目，我們會回傳它(這就是呼叫serializeUser的地方，它會將MongoDB ID放入期程)。如果沒有使用者紀錄被回傳，我們會建立一個新User模型，並將它存到資料庫。

最後，建立，registerRoutes方法：

```
registerRoutes: function () {
    // 註冊Facebook路由
    app.get('/auth/facebook', function (req, res, next) {
        if (req.query.redirect) req.session.authRedirect = req.query.redirect;
        passport.authenticate('facebook')(req, res, next);
    });
    app.get('/auth/facebook/callback', passport.authenticate('facebook',
        {failureRedirect: options.failureRedirect}),
        function (req, res) {
            // 只有在成功驗證時才會到這裡
            var redirect = req.session.authRedirect;
            if (redirect) delete req.session.authRedirect;
            res.redirect(303, redirect || options.successRedirect);
        }
    );
}
```

注意我們有*/auth/facebook*路徑，造訪這個路徑的訪客將會被自動重新導向到Facebook的驗證畫面(這是`passport.authenticate('facebook')`做的)。注意我們在這裡改寫預設的回呼URL：因為我們想要加入關於**我們來自何方**的資訊。因為我們將瀏覽器重新導向到Facebook來驗證之後，也會想要回到原本的地方。當使用者用Facebook來驗證之後，瀏覽器會被重新導向回你的網站。具體來說，到*/auth/facebook/callback*路徑(使用選用的redirect查詢字串代表使用者原本的地方)。在查詢字串裡面還有Passport會檢驗的驗證權杖。如果驗證失敗，Passport會將瀏覽器重新導向到options.failureRedirect。如果驗證成功，Passport會呼叫next()，就是你的應用程式回來的地方。注意在*/auth/facebook/callback*的處理程式裡面，中介軟體的鏈結方式：passport.authenticate會先被呼叫。如果它呼叫next()，控制權會被傳到你的函式，接著重新導向到原始位置或options.successRedirect，如果redirect查詢字串參數沒有指定的話。

Top：省略redirect查詢字串參數可以簡化你的驗證路由，如果你只有一個URL需要驗證的話。啟用這功能回到原本需要登入的網頁，而不是預設的網頁，這就是一個讓人滿意的使用者體驗。

在這過程中，Passport施展的"魔法"是將使用者(在我們案例中，只是一個MongoDB資料庫的使用者ID)存到期程。因瀏覽器在重新導向，就是一個不同的HTTP請求：如果期程沒有那個資訊，我們將無法知道使用者已經被驗證!成功驗證使用者之後，設定req.session.passport.user，這就是未來的請求知道使用者已被驗證的地方。

我們來看/account處理程式如何檢查並確保使用者已被驗證：

```
app.get('/account', function (req, res) {
    if (!req.session.passport.user)
        return res.redirect(303, '/unauthorized');
    res.render('account');
});
```
現在不但通過驗證的使用者會看到帳號網頁，其他人也會被重新導向"未獲授權"網頁。

### 角色授權

目前我們還沒在技術上做任何授權，假設我們只想讓客戶看到他們的帳號視圖，員工可看到使用者帳號資訊。

建立一個customerOnly函式，只供客戶使用：

```
function customerOnly(req, res, next) {
    var user = req.session.passport.user;
    if (user && user.role === 'customer') return next();
    res.redirect(303, '/unauthorized');
}
```

再來建立一個employee函式。

```
function employeeOnly(req, res, next) {
    var user = req.session.passport.user;
    if (user && user.role === 'employee') return next();
    next('route');
}
```

呼叫next('route')不會執行路由中的下一個處理程式：它會完全跳過這個路由。假設沒有其他路由會處理/account，它最終會傳遞到404處理程式，讓我們有一個滿意的結果。

```
app.get('/account', customerOnly, function(req, res){
    res.render('account');
});
app.get('/account/order-history', customerOnly, function(req, res){
    res.render('account/order-history');
});
app.get('/account/email-prefs', customerOnly, function(req, res){
    res.render('account/email-prefs');
});

// 員工路由
app.get('/sales', employeeOnly, function(req, res){
    res.render('sales');
});
```

有多角色的話：

```
function allow(roles) {
    return function (req, res, next) {
        var user = req.session.passport.user;
        if (user && roles.split(',').indexOf(user.role) !== -1) return next();
        res.redirect(303, '/unauthorized');
    };
}

app.get('/account', allow('customer,employee'), function(req, res){
    res.render('account');
});
```

### 添加額外的授權提供者

```
passport.use(new GoogleStrategy({
    clientID: config.google[env].clientID,
    clientSecret: config.google[env].clientSecret,
    callbackURL: (options.baseUrl || '') + '/auth/google/callback',
}, function (token, tokenSecret, profile, done) {
    var authId = 'google:' + profile.id;
    User.findOne({authId: authId}, function (err, user) {
        if (err) return done(err, null);
        if (user) return done(null, user);
        user = new User({
            authId: authId,
            name: profile.displayName,
            created: Date.now(),
            role: 'customer',
        });
        user.save(function (err) {
            if (err) return done(err, null);
            done(null, user);
        });
    });
}));
```

```
// 註冊Google路由
app.get('/auth/google', function (req, res, next) {
    if (req.query.redirect) req.session.authRedirect = req.query.redirect;
    passport.authenticate('google', {scope: 'profile'})(req, res, next);
});
app.get('/auth/google/callback', passport.authenticate('google',
    {failureRedirect: options.failureRedirect}),
    function (req, res) {
        // 只有在成功驗證時才會到這裡
        var redirect = req.session.authRedirect;
        if (redirect) delete req.session.authRedirect;
        res.redirect(303, redirect || options.successRedirect);
    }
);
```