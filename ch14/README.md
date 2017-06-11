# chap14. 路由

**路由**是一種機制，它會將請求(以URL及HTTP方法來指定)傳送至處理它們的程式碼。如同我們之前看過的，路由之前是檔案式的，如果你將*foo/about.html*放在你的網站，就可以在瀏覽器用*/foo/about.html*路徑來存取它。簡單，但缺乏彈性。而且，你可能沒有注意，在你的URL裡面使用“HTML”已經非常落伍。

在我們深入Express路由的技術層面之前，應該先討論資訊結構(IA)的概念。IA代表**你的內容在概念上的組織**。在開始規劃路由之前，擁有一個可擴展的IA，將會在接下來的過程中給妳很大的好處。

關於IA，Tim Berbers-Lee在1998 URI一篇短文要求我們肩負起一個崇高的責任：

> 站長的責任，就是指派將會被使用2年、20年，及200年的URI。這需要思考、組織及承諾。

想像你某天走進最喜歡的圖書館，但不能找到任何東西。這就是你重新設計URL結構所發生的情形。

認真地想一下妳的URL：它在20年後，還是有意義的嗎？小心地考慮你的內容細目。請有邏輯地將東西分類，並且不要讓自己陷入困境。它是一門科學，也是一門技術。

以下是一些協助你建構持久的IA的建議：

- **不要在你的URL公開技術細節**
- **避免在你的URL使用毫無意義的資訊**
- **避免沒必要的長URL**
- **字詞分隔符號應保持一致**

    使用連字號來分隔單字是常見的做法，底線比較不普遍，而且大部分的SEO專家都推薦它們。

- **不要使用空格或沒辦法打字的字元**

    不要使用英數字元、數字、虛線及底線之外的字元

- **使用小寫的URL**

    使用小寫的優點是，程式碼一定可以自動地產生它。個人覺得小寫的URL比較美觀。
    
## 路由與SEO

如果有些關鍵字很重要——而且有意義——請考慮讓它成為URL的一部分。標題、標頭、內文及中繼說明使用關鍵字，且URL以關鍵字開頭。如果為了縮短URL，就會喪失寶貴的SEO。

但漫不經心地將關鍵字塞到URL是失敗的做法。

## 子網域

除了路徑外，子網域是URL的另一個部分，通常會被用在路由請求上。子網域最好保留給明顯不同的應用程式，例如REST API(*api.meadowlarktravel.com*)或管理介面(*admin.meadowlarktravel.com*)。有時你會因為技術因素使用子網域。例如，使用WorkPress建構部落格，使用blog.meadowlarktravel.com會比較容易(較佳做法是使用代理伺服器，例如Nginx)。通常SEO會使用子網域來將內容分區，因此你應該要保存對SEO而言不重要的網站區域，例如管理區域及API。

Express的路由機制在預設情況下並未考慮子網域：app.get(/about)會處理*http://meadowlarktravel.com/about*、*http://www.meadoowlarktravel.com*與*http://admin.meadowlarktravel.com/about*的請求。如果你想要個別處理子網域，可使用一種稱為vhost的套件(代表virtual host，來自Apache機制，通常處理子網域使用)。首先，安裝套件(`npm install --save vhost`)，接著編輯你的應用程式檔案來建立子網域：

```
// 建立“admin”子網域...
// 這個應該要在你的所有其他路由之前出現
var admin = express.Router();
app.use(vhost('admin.*', admin));

// 建立管理員路由，這些可在任何地方定義
admin.get('/', function (req, res) {
    res.render('admin/home');
});
admin.get('/users', function (req, res) {
    res.render('admin/users');
});
```

express.Router()基本上會建立一個Express路由的新實例。你可將這個實例當成你的原始實例(app)：你可以對app增加路由與中介軟體。但，在你將它將到app之前，它不會做任何事。我們透過vhost來將它加入，它會將那一個路由實例綁到那一個子網域。

## 路由處理程式都是中介軟體

基本路由：只要匹配一個給定的路徑。但app.get('/foo',...)實際**做什麼**事情？它只是一段專門的中介軟體，會被傳入一個next方法。我們來看一個更複雜的範例：

```
app.get('/foo', function(req, res, next) {
    if (Math.random() < 0.5) return next();
    res.send('sometimes this');
});

app.get('/foo', function(req, res) {
    res.send('and sometime that');
})
```

你可針對一個app.get呼叫使用任何數量的處理程式。

```
app.get('/foo',
        function(req, res, next){
            if(Math.random() < 0.33) return next();
            res.send('red');
        },
        function(req, res, next){
            if(Math.random() < 0.5) return next();
            res.send('green');
        },
        function(req, res) {
            res.send('blue');
        },
);
```

它可讓你建立通用函式，可在你的所有路由中使用。例如，假設我們有一個機制可在某網頁上顯示特別優惠活動。特別優惠的變更很頻繁，而且它們不會在每頁顯示。我們可建立一個函式將特別優惠注入至res.locals特性：

```
function specials(req, res, next) {
    res.locals.specials = getSpecialsFromDatabase();
    next();
}
app.get('/page-with-specials', specials, function (req, res) {
    res.render('page-with-specials');
});
```

我們也可用這種方法實作一個授權機制。假如我們的使用者授權碼會設定一個名為req.session.authorized的期程變數。我們可以使用以下的程式來製作一個可重複使用的授權過濾器：

```
function authorize(req, res, next) {
    if (req.session.authorized) return next();
    res.render('not-authorized');
}
app.get('/secret', authorize, function (req, res) {
    res.render('secret');
});
app.get('/sub-rosa', authorize, function (req, res) {
    res.render('sub-rosa');
});
```

## 路由路徑與正規表達式

當你在路由裡面指定路徑時(像/foo)，它最後會被Express轉換成正規表達式。有一些正規表達式的特殊字元可以在路由路徑中使用：+、?、*、(與)。來看一些範例：

假設你想要用同樣路徑來處理/user與/username URL：

```
app.get('/user(name)', function(req, res) {
    res.render('user');
});
```

khaaaaaaaan網頁，不希望讓使用者記得他有幾個A：

```
app.get('/khaa+n', function(req, res) {
    res.render('khaaan');
})
```

並非所有regex特殊字元在路由路徑都有意義，上面有列出的才能用。這點很重要，因為句點在regex特殊字元中通常代表“任何字元”，可在路由中使用，不需要轉義。

最後，如果你真的需要在路由中讓正規表達式發揮威力：

```
app.get(/crazy|mad(ness)?|lunacy/,function(req, res){
    res.render('madness');
});
```

路由路徑使用regex特殊字元，目前沒找到理由，但知道有這功能是好事。

## 路由參數

它是個可讓路由的一部分變成可改變的參數的方式。

```
var staff = {
    mitch: {bio: 'Mitch is the man to have at your back in a bar fight'},
    madeline: {bio: 'madeline is our Oregon expert.'},
    walt: {bio: 'Walt is our Oregon Coast expert.'}
};
app.get('/staff/:name', function (req, res, next) {
    var info = staff[req.params.name];
    if (!info) return next();        // 最終會產生404失敗
    res.render('staffer', info);
});
```

注意我們在路由中使用:param的方式。它會匹配所有字串(不含斜線)，並使用namer鍵將它放入req.params物件。這是之後會經常用到的功能。特別是建立REST API時。你可在路由中使用多個參數。例如，我們想以城市來區分工作人員：

```
var staff = {
    portland: {
        mitch: {bio: 'Mitch is the man to have at your back in a bar fight'},
        madeline: {bio: 'madeline is our Oregon expert.'}
    },
    bend: {
        {bio: 'Walt is our Oregon Coast expert.'}
    },
};

app.get('/staff/:city/:name', function(req, res) {
    var info = staff[req.params.city][req.params.name];
    if (!info) return next();        // 最終會產生404失敗
    res.render('staffer', info);
});
```

## 組織路由

推薦四條決定路由組成方式的指導原則：

- **使用有名稱的函式處理路由**
- **路由不應該是神秘的東西**
- **路由組織必須是可擴充的**
- **不要忽視視圖式自動路由處理程式**