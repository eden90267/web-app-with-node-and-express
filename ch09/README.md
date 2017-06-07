# Cookie與期程

HTTP是一種無狀態(stateless)協定。

Web的工作方式是**每一個HTTP請求都含有所有必要資訊**，**讓伺服器可以滿足請求**。

如果故事就在這結束，就沒有**登入**，**串流媒體就不能運作**，**網站就不能記住你的喜好設定**。所以我們需要一種在HTTP儲存狀態的方法，這就是cookie與期程站上舞台的時候。

可惜的是，因為大家用cookie來做些壞事，它的名聲臭掉了。

cookie的概念很簡單：伺服器傳送一些資訊，瀏覽器要在一段期間內把它儲存起來。特定資訊由伺服器決定：通常它只是一個獨特的ID號碼，用來識別特定的瀏覽器，讓人誤以為狀態被保持。

關於cookie，有些重要是要了解：

- cookie無法對使用者保密

    用戶端可查看所有伺服器傳送給用戶端的cookie。可透過Signed cookie來打亂cookie內容，或透過加密技術，但還是無法騙過想要偷窺的雙眼。
    
- 使用者可以刪除停用cookie

    使用者可以完全控制cookie。但鮮少。
    
- 正規的cookie可能會被竄改

    當具有相關的cookie的瀏覽器對你的伺服器發出請求，而你盲目地信任那個cookie的內容，等於門戶洞開，歡迎被攻擊。例如，最高級的笨蛋會去執行cookie裡面的程式碼。所以為確保cookie不被竄改，請使用Signed cookie。

- cookie可用來進行攻擊

    跨站指令碼攻擊(XSS)。XSS攻擊的其中一種技術會用JavaScript惡意修改cookie的內容。這是另一個不要信任回傳至伺服器cookie內容的理由。signed cookie可協助(竄改行為在signed cookie中會很明顯)，也有一種設定可以指定cookie只能由伺服器修改。這些cookie會被限制，當然會比較安全。
    
- 使用者會知道你在濫用cookie
- 愛用期程，而非cookie

    大多數情況下，你可使用期程來保存狀態。他比較簡單，也不浪費使用者儲存空間，也比較安全。當然，期程會依賴cookie，但透過期程，Express會為你承擔繁重的工作。
    
Top：cookie不是神奇的魔法：當伺服器希望用戶儲存cookie時，他會傳送一個標頭，稱為Set-Cookie，裡面含有成對的名稱/值，當具有cookie的用戶端傳送請求至伺服器時，他會傳送多個cookie請求標頭，裡面含有cookie的值。

## 外部認證

要讓cookie具備安全性，cookie保密是必要的動作。cookie保密是一個伺服器知道的字串，當cookie被傳送到用戶端時，會被用來對它們加密。它不是需要記得的密碼，所以可以用隨機的字串。我通常會用xkcd發明的機密碼產生器來製作cookie保密。

使用外部的第三方認證機制也是常見的做法，例如cookie加密、資料庫密件及API權杖(Twitter、Facebook等)。這不但容易維護，也讓你的版控系統忽略憑證檔案。

將憑證放到外部的JavaScript檔案。建立一個名為credentials.js的檔案。

```
module.exports = {
    cookieSecret: 'your cookie secret goes here',
};
```

在.gitignore添加credentials.js。為了將憑證匯入應用程式：

```
var credentials = require('./credentials');
```

## Express裡的Cookie

必須先加入**cookie-parser**中介軟體。`npm install --save cookie-parser`，接下來：

```
app.use(require('cookie-parser')(credentials.cookieSecret));
```

做完之後，你可以在可以存取請求物件的任何地方設置一個cookie或一個signed cookie：

```
res.cookie('monster', 'nom nom');
res.cookie('signed_monster', 'nom nom', { signed:true });
```

Top：signed cookie優先權大於非signed cookie。signed cookie命名與非signed cookie不能相同(它會回傳undefined)。

要取回用戶端回傳的cookie值，只要存取請求物件的cookie或signedCookie屬性：

```
var monster = req.cookie.monster;
var signedMonster = req.signedCookies.monster;
```

刪除cookie，請使用req.clearCookie：

```
res.clearCookie('monster');
```

當你設定一個cookie之後，就可以指定下列的項目：

- domain

    控制cookie相關的網域，這可讓你將cookie指派給特定的子網域。注意你不能將cookie的網域設定為非伺服器運行的網域：它將不做任何事情。

- path

    控制cookie套用的路徑。注意路徑的後面有個隱形的萬用字元，預設為/，它會套用至你網站所有網頁。如果使用/foo，它會套用/foo、/foo/bar等等。

- maxAge

    指定用戶端要保留多久之後將它刪除，以毫秒為單位。如果省略它，cookie會在關閉瀏覽器之後刪除(也可使用expires指定逾時日期，這種語法不是很好用)。

- secure

    指定cookie只透過https連結來傳送

- httpOnly

    設為true，cookie只能被伺服器修改。用戶端JavaScript不能修改它，可防XSS攻擊。

- signed

    設定true會簽署這個cookie，讓他可在req.signedCookies使用，而非req.cookies。伺服器會拒絕被竄改的signed cookie，且cookie的值會被重置為原本的值。

## 檢查Cookie

Chrome，開啟開發人員工具，並選擇Resource標籤，左邊樹狀結構中，你會看到cookies。

## 期程

期程是一種比較方便的狀態維持手段。要實作期程，用戶端需要儲存**一些東西**。方法通常是使用一個內含獨一無二的識別碼的cookie。伺服器會用那個識別碼取回適當的期程資訊。

廣義來說，期程有兩種實作方式：

- 在cookie中儲存所有東西
- 只在cookie中儲存獨一無二的識別碼，其他東西放在伺服器

前者稱為“cookie式期程”，但是是不建議的方式，除非儲存少量資訊，而且不在乎使用者存取那些資訊。可參考**cookie-session**中介軟體。

### 記憶儲存

想要按照建議，在伺服器上儲存期程，就必須要有一個地方可以儲存。入門級選擇是memory session。容易設定，但有很大缺點，重啟伺服器即消失。更糟的是，若擴充版圖，每次由不同伺服器服務一個請求，期程時有時無，會無法讓使用者接受的體驗。現在先用memory session，之後會看到如何永久地儲存期程資訊。

首先安裝express-session(`npm install --save express-session`)，接下來，連結cookie解析器之後，連結express-session：

```
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());
```

express-session中介軟體會按照下列的選項來接收一個設定物件：

- key

    儲存獨一無二的期程識別碼的cookie名稱。預設值是connect.sid。

- store

    期程存儲的實例。預設為MemoryStore的實例，這很適合目前目的。之後會看到使用資料庫存儲。

- cookie

    期程cookie的設定(path、domain、secure)。正規的cookie預設會套用
    
### 使用期程

只要使用請求物件的session變數特性：

```
req.session.userName = 'Anonymous';
var colorSchema = req.session.colorScheme || 'dark';
```

注意，透過期程，我們不需使用請求物件來取回值以及設定值的回應物件：請求物件上面全部都會執行(回應物件沒有session特性)。要刪除期程，可使用JavaScript的delete：

```
req.session.userName = null; // 不會移除，僅設為null

delete req.session.colorSchema;
```

## 使用期程來實作閃爍訊息

在你的模板檔案中，某個明顯的地方(通常在你網站的標題下面)添加下列程式：

```
{{#if flash}}
    <div class="alert alert-dismissible" alert-{{flash.type}}>
        <button class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
        <strong>{{flash.intro}}</strong> {{{flash.message}}}
    </div>
{{/if}}
```

flash.message：使用三個大括號，讓我們在訊息中提供一些簡單HTML。

現在來添加中介軟體，將閃爍內容加到內容(如果期程有的話)，在你路由之前添加這段程式碼：

```
app.use(function (req, res, next) {
    // 如果有閃爍訊息，將它轉換至內容，接著移除它
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});
```

實際運用：

```
// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;


app.post('/newsletter', function (req, res) {
    var name = req.body.name || '',
        email = req.body.email || '';
    // 輸入驗證
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) return res.json({error: 'Invalid name email address'});
        req.session.flash = {
            type: 'danger',
            intro: 'validation error!',
            message: 'The email address you entered was not valid.',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({name: name, email: email}).save(function (err) {
        if (err) {
            if (req.xhr) return res.json({error: 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if (req.xhr) return res.json({success: true});
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/newsletter/archive');
    });
});
app.get('/newsletter/archive', function(req, res){
	res.render('newsletter/archive');
});
```

閃爍訊息會被中介軟體從期程傳送到res.locals.flash，你必須要對顯示的閃爍訊息執行重新導向。如果你想要在沒有重新導向的情況下顯示閃爍訊息，可以設定res.locals.flash，而不是req.session.flash。