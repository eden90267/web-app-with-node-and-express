# chap08. 表單處理

要從你的使用者那邊收集資訊，一般你會使用HTML表單。本章中，要討論各種表單處理、表單驗證、及檔案上傳方法。

## 將用戶端資料傳給伺服器

廣義上來講，將用戶端資料傳給伺服器，有兩種選擇：

- 查詢字串

    GET請求

- 請求內文

    POST請求

一般人誤解為POST是安全的，GET不是。事實上，使用HTTPS，兩者都是安全的；如果不使用HTTPS，兩者都不安全。GET請求，會在查詢字串中看到他們輸入所有資料，此外，瀏覽器會限制查詢字串的長度(內文長度沒有這種限制)。基於以上理由，我通常推薦使用POST做表單提交。

## HTML表單

```
<form action="/process" method="post">
    <input type="hidden" name="hush" value="hidden, but not secret!">
    <div>
        <label for="fileColor">Your favorite color: </label>
        <input type="text" id="fieldColor" name="color">
    </div>
    <div>
        <button type="submit">Submit</button>
    </div>
</form>
```

action屬性指名當表單被post，接收它的URL。省略的話，表單會被提交到載入表單的同一個URL。建議一定要提供一個有效的action，就算用AJAX也是如此(防止遺失資料)。

從伺服器觀點來看，input欄位的重要屬性是name屬性，這是伺服器標示欄位的方式。name屬性與id屬性是不同的，這點非常重要，id屬性只能應用在裝飾及前端功能(它不會被傳到伺服器)。

隱藏欄位也是，它不會被顯示在使用者的瀏覽器上。但請不要將它用在安全性或敏感資訊：查看原始碼即可看到。

HTML沒有限制同一網頁上使用多個表單(早期框架會有這限制，我指的是ASP)。建議你的表單維持一致的邏輯：表單要包含所有要提交的欄位。如果同一網頁上有不同動作，就使用兩個不同表單。例如一個表單搜尋網站，另一個表單註冊電子報。你也可使用一個大型表單，根據使用者按下的按鈕來決定要採取的動作，但這是讓人頭痛的設計，並對有障礙的人不友善。

當使用者提交表單，*/process* URL會被呼叫，欄位值會在請求內文中，被傳到伺服器。

## 編碼

當表單被提交，它必須以某種方式編碼。沒指定編碼方式，預設是**application/x-www-urlencoded**(這只是一個冗長的媒體類型，用來“編碼URL”)。這是一種基本、容易使用的編碼方式，由Express支援。

上傳檔案，必須強制使用**multipart/form-data**編碼類型，這是，也不是由Express直接控制(事實上，Express仍支援這種編碼，但下一版的Express會移除它，而且不建議使用它，很快會討論替代方案)。

## 不同的表單處理方式

不使用AJAX，唯一選項是透過瀏覽器來提交表單，這會重新載入網頁。但是網頁載入方式由你決定。在處理表單時，考慮兩件事：

- 使用什麼路徑來處理表單(動作)
- 要傳送哪一個回應給伺服器

如果你的表單使用method="POST"，**使用同樣的路徑來顯示表單並處理表單是很正常的**。如果採取這種做法，action就可省略。

另一選項是使用不同路徑提交表單，例如，表單網頁使用*/contact*路徑，可使用*/process-contact*路徑來處理表單。這樣就可用GET提交表單(不建議，會在URL公開表單欄位)。如果你有多個URL使用同樣的提交機制，這種方法或許是最好選擇(例如，很多張網頁都有一個email註冊方塊)。

無論你用什麼路徑處理表單，都必須決定要傳送哪一個回應給瀏覽器，以下是可選項目：

- 直接HTML回應

    處理表單後，你可直接將HTML傳回伺服器。如果使用者重載網頁，這方法會產生警告，並可能干擾書籤功能及“回上一頁按鈕”，不建議使用。

- 302重新導向轉接

    雖這是常用做法，但它濫用302(找到)回應碼原本含義。HTTP 1.1添加了303回應碼，這是更好選擇。

- 303重新導向轉接

    它的目的是解決302的誤用。HTTP規格明白指出瀏覽器應該在遵循303重新導向時使用GET請求，無論原來方法為何。要回應表單提交請求，建議使用這種方法。
    
重新導向會指向哪裡？答案由你決定，以下是常見做法：

- 重新導向至專用的成功/失敗網頁

    如果使用者同意接收促銷email，但有資料庫錯誤，重導向*/error/database*。如email是不合法，重導向*/error/invalid-email*，如果都成功，重導向*/promo-email/thank-you*。好處是會讓你非常容易進行分析：造訪*/promo-email/thank-you*的網頁人數會與註冊你的促銷email的人數相互關聯。他也非常容易實作。缺點是：針對每一種可能性分配URL，要設計、編寫複本及維護網頁。另一缺點是使用者體驗可能不是那麼好。使用者喜歡被感謝，但接下來必須移往之前待過的地方，或下一個想去的地方。

- 重新導向原本的位置，並使用一個閃爍的訊息

    對於分散在你的網站的小型表單，最佳使用者體驗，是不要干擾使用者的瀏覽流程。採取一種方式，再不離開網頁情況下提交email地址。最好用AJAX，或不想用AJAX(或想讓回退機制提供良好的使用者體驗)，可重導向原本使用者所在的網頁。要做到這點，最簡單方式是在表單中使用已被填入目前URL的隱藏欄位。因為你希望使用者提交之後收到某種回饋，你可使用閃爍訊息。
    
- 重導向至新的位置，並使用閃爍訊息

    聰明猜測使用者接下來可能會去哪裡，並重新導向。但你應該也要使用一個閃爍訊息來通知使用者結果已被提交。
    
如果你使用AJAX，我建議使用一個專用的URL。在AJAX處理程式前面使用前置詞是很迷人的做法(例如*/ajax/enter*)，但不建議：它會將實作資訊附加到URL上。此外，為避免故障，你的AJAX處理程式應該要處理一般瀏覽器提交。

## 使用Express處理表單

GET處理表單，req.query物件也必須可使用你的欄位。

POST處理表單，就必須連結中介軟體來解析以URL編碼的內文。首先，安裝**body-parser**中介軟體(**npm install --save body-parser**)，接下來將它連結：

```
app.use(require('body-parser')());
```

當你連結body-parser，會發現req.body已經可供使用，這就是讓所有表單欄位都可使用的地方。注意req.body不會阻止你使用查詢字串。

添加表單，讓使用者登記一個郵寄清單。/views/newletter.handlebars使用查詢字串、一個隱藏欄位，及可見欄位：

```
<h2>Sign up for our newsletter to receive news and specials!</h2>
<form class="form-horizontal" role="form"
      action="/process?form=newsletter" method="POST">
    <input type="hidden" name="_csrf" value="{{csrf}}">
    <div class="form-group">
        <label for="fieldName" class="col-sm-2 control-label">Name</label>
        <div class="col-sm-4">
            <input type="text" class="form-control" id="fieldName" name="name">
        </div>
    </div>
    <div class="form-group">
        <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
        <div class="col-sm-4">
            <input type="email" class="form-control" required id="fieldEmail" name="email">
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-4">
            <button type="submit" class="btn btn-default">Register</button>
        </div>
    </div>
</form>
```

注意，已開始引入bootstrap樣式。

```
app.get('/thank-you', function(req, res){
    res.render('thank-you');
});
app.get('/newsletter', function (req, res) {
    res.render('newsletter', {csrf: 'CSRF token goes here'});
});
app.post('/process', function (req, res) {
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible from field): ' + req.body.name);
    console.log('Email (from visible from field): ' + req.body.email);
    res.redirect(303, '/thank-you');
});

```

Top：這例子使用303重導向，而不是301。301重新導向是永久的，瀏覽器會緩存住，之後就會跳過/process處理程式了。

## 處理AJAX表單

在Express中處理AJAX表單非常容易，在AJAX與一般的瀏覽器回退機制中，處理程式都很容易使用。

```
<h2>Sign up for our newsletter to receive news and specials!</h2>
<div class="formContainer">
    <form class="form-horizontal newsletterForm" role="form"
          action="/process?form=newsletter" method="POST">
        <input type="hidden" name="_csrf" value="{{csrf}}">
        <div class="form-group">
            <label for="fieldName" class="col-sm-2 control-label">Name</label>
            <div class="col-sm-4">
                <input type="text" class="form-control" id="fieldName" name="name">
            </div>
        </div>
        <div class="form-group">
            <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
            <div class="col-sm-4">
                <input type="email" class="form-control" required id="fieldEmail" name="email">
            </div>
        </div>
        <div class="form-group">
            <div class="col-sm-offset-2 col-sm-4">
                <button type="submit" class="btn btn-default">Register</button>
            </div>
        </div>
    </form>
</div>
{{#section 'jquery'}}
    <script>
        $(document).ready(function () {
            $('.newsletterForm').on('submit', function (evt) {
                evt.preventDefault();
                var action = $(this).attr('action');
                var $container = $(this).closest('.formContainer');
                $.ajax({
                    url: action,
                    type: 'POST',
                    success: function (data) {
                        if (data.success) {
                            $container.html('<h2>Thank you!</h2>');
                        } else {
                            $container.html('There was a problem');
                        }
                    },
                    error: function () {
                        $container.html('There was a problem');
                    }
                })
            });
        });
    </script>
{{/section}}
```

```
app.post('/process', function (req, res) {
    if (req.xhr || req.accepts('json,html') === 'json') {
        // 如果有錯誤的話，我們會傳送{error:'error description'}
        res.send({success: true});
    } else {
        // 如果有錯誤的話，我們會重新導向一個錯誤網頁
        res.redirect(303, '/thank-you');
    }
});
```

req.accepts會試著決定哪一種回應類型最適合回傳。req.accepts('json,html')詢問最佳的回傳格式是JSON或HTML：這是由Accepts HTTP標頭推論的，它是瀏覽器提供的回應類型有序清單。如果請求是AJAX請求，或如果使用者代理程式特別要求JSON比HTML還要好，它會回傳適當的JSON，否則會回傳重新導向轉接。

Top：若有AJAX請求可能使用JSON之外的東西，你應該根據Accepts標頭專門回傳一個適當的回應，讓我們方便地透過req.accepts輔助方法來存取。如果你只根據Accepts標頭來回應，你可能使用res.format，這是一種方便的方法，讓你根據用戶端的期望適當地回應。如果你這麼做，就必須在jQuery發出AJAX請求時，設定dataType或accepts特性。

## 檔案上傳

目前檔案上傳可用Connect內建的multipart中介軟體來處理，但是Connect已移除這個中介軟體，而且一旦Express更新它與Connect之間的依賴關係，它也會從Express消失，所以強烈建議不要使用這個中介軟體。

目前有兩種受歡迎且強健的多部分表單處理選項：Busboy與Formidable。Formidable比較簡單，它有一個方便的回呼，可提供含有欄位及檔案的物件，而Busboy必須監聽每一個欄位與檔案事件。

建立一個假期攝影比賽的檔案上傳表單(*views/contest/vacation-photo.handlebars*)：

```
<form class="form-horizontal" role="form"
      enctype="multipart/form-data" method="post"
      action="/contest/vacation-photo/{year}/{month}">
    <div class="form-group">
        <label for="fieldName" class="col-sm-2 control-label">Name</label>
        <div class="col-sm-4">
            <input type="text" class="form-control" id="fieldName" name="name">
        </div>
    </div>
    <div class="form-group">
        <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
        <div class="col-sm-4">
            <input type="email" class="form-control" required id="fieldEmail" name="email">
        </div>
    </div>
    <div class="form-group">
        <label for="fieldPhoto" class="col-sm-2 control-label">Vacation photo</label>
        <div class="col-sm-4">
            <input type="file" class="form-control" required accept="image/*" id="fieldPhoto" name="photo">
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-4">
            <button type="submit" class="btn btn-default">Register</button>
        </div>
    </div>
</form>
```

注意，我們必須指定**enctype="multipart/form-data"**來啟用檔案上傳。我們也使用**accept**屬性來限制可被上傳的檔案類型(非必要)。

安裝Formidable(`npm install --save formidable`)，並建立下列路由程式：

```
var formidable = require('formidable');

app.get('/contest/vacation-photo', function (req, res) {
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });
});
app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});
```

(年份與月份會被指定為**路由參數**)。

## jQuery檔案上傳

可拖曳、看到上傳的縮圖，與看到進度條，推薦Sebastian Tschan的jQuery File Upload([https://blueimp.github.io/jQuery-File-Upload/](https://blueimp.github.io/jQuery-File-Upload/))。

jQuery File Upload的設定不像公園散步那麼簡單。還好有一種npm套件可以幫你克服伺服器端的複雜事項。jQuery File Upload套件使用jQuery UI與Bootstrap。

要顯示檔案縮圖，jquery-file-upload-middleware使用ImageMagick，這是一種令人尊敬的圖像處理程式庫。這代表你的app要依賴ImageMagick，這可能會視你的託管狀態而產生一些問題。ubuntu/debian安裝，可使用`apt-get install imagemagick`安裝ImageMagick，OS X，你可使用`brew install imagemagick`。

我們先從伺服器端設定開始。首先，安裝jquery-file-upload-middleware套件(`npm install --save jquery-file-upload-middleware`)，接著在你的app檔案加入下列程式：

```
app.use('/upload', function (req, res, next) {
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function () {
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function () {
            return '/uploads/' + now;
        },
    })(req, res, next);
});
```

```
<form class="form-horizontal" role="form"
      enctype="multipart/form-data" method="post"
      action="/contest/vacation-photo/{year}/{month}">
    <div class="form-group">
        <label for="fieldName" class="col-sm-2 control-label">Name</label>
        <div class="col-sm-4">
            <input type="text" class="form-control" id="fieldName" name="name">
        </div>
    </div>
    <div class="form-group">
        <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
        <div class="col-sm-4">
            <input type="email" class="form-control" required id="fieldEmail" name="email">
        </div>
    </div>
    <div class="form-group">
        <label for="fieldPhoto" class="col-sm-2 control-label">Vacation photo</label>
        <div class="col-sm-4">
			<span class="btn btn-default btn-file">
				Upload
				<input type="file" class="form-control" required accept="image/*"
                       id="fieldPhoto" data-url="/upload" multiple name="photo">
			</span>
            <div id="fileUploads"></div>
        </div>
    </div>
    <div class="form-group">
        <div class="col-sm-offset-2 col-sm-4">
            <button type="submit" class="btn btn-default">Register</button>
        </div>
    </div>
</form>

{{#section 'jquery'}}
    <script src="/vendor/jquery-file-upload/js/vendor/jquery.ui.widget.js"></script>
    <script src="/vendor/jquery-file-upload/js/jquery.iframe-transport.js"></script>
    <script src="/vendor/jquery-file-upload/js/jquery.fileupload.js"></script>
    <script>
        $(document).ready(function () {

            $('#fieldPhoto').fileupload({
                dataType: 'json',
                done: function (e, data) {
                    $.each(data.result.files, function (index, file) {
                        $('#fileUploads').append($('<div class="upload">' +
                                '<span class="glyphicon glyphicon-ok"></span>&nbsp;' + file.originalName + '</div>'));
                    });
                }
            });

        });
    </script>
{{/section}}
```

完整範例：[https://github.com/aguidrevitch/jquery-file-upload-middleware](https://github.com/aguidrevitch/jquery-file-upload-middleware)