# chap16. 靜態內容

靜態內容代表app所傳遞的資源不會因為不同的請求而有所不同。以下是常見的內容：

- 多媒體
- CSS
- JavaScript
- 二進制下載

如你所見，HTML不在名單裡面。

## 效能注意事項

**減少請求數量**與**減少內容大小**是兩項主要的效能注意事項。

減少請求數量特別在行動設備上。有兩種方式：**結合資源**，與**瀏覽器緩存**。

結合資源主要與結構與前端有關：小型圖像應該盡可能地結合至單一拼合圖像(Sprite)，越多越好。接著用CSS來設定位置與大小，來顯示你要的圖像。強烈建議使用免費的SpritePad([https://wearekiss.com/spritepad](https://wearekiss.com/spritepad))來拚合圖像。用它產生拚合圖像非常簡單，而且它也會為你產生CSS。

瀏覽器緩存可以在用戶端瀏覽器儲存常用的靜態資源，以減少HTTP請求。你可以做一些事，也應該做，讓瀏覽器緩存你的靜態資源。

我們可以減少靜態資源的大小來增加效能。有一些技術是**無失真的**(不用失去任何資料就可以縮小)，有一些技術是**失真的**(藉由降低靜態資源的品質來減少大小)。無失真技術包括繪製JavaScript與CSS，以及將PNG圖像最佳化。失真技術包括提升JEPG與視訊壓縮等級。本章將會討論png最佳化與縮製(及統合(bundling)，它也會減少HTTP請求)。

Top：當你使用CDN時，通常不需要擔心跨網域資源分享(CORS)。HTML載入外部資源不會被CORS政策限制:你只要針對透過AJAX載入的資源啟用CORS。

## 對你的網站進行未來驗證

透過**內容傳遞網路**(CDN)上託管靜態資源，來讓你更輕鬆。CDN是一種針對靜態資源傳遞來做最佳化的伺服器。它會使用特殊的標頭來讓瀏覽器進行緩存。此外，CDN可以啟用**地理最佳化**(最靠近你的用戶端的伺服器傳遞靜態內容)。

對你網站進行"未來驗證"很簡單，因此到時你可以將靜態內容移到CDN，而且我建議你要養成習慣，一定要做這件事。它的動作可以歸納為：幫靜態資源建立一個抽象層，如此一來，移動它們就像切換開關依樣容易。

你的靜態資源大多會在HTML視圖中被參考(`<link>`、`<script>`、`<img>`、及多媒體內嵌標籤)。接著是CSS的靜態參考(background-image特性)。JavaScript靜態資源參考，例如動態改變或插入`<img>`標籤或background-image特性。

### 靜態對應

要讓靜態資源可重新定位，方便緩存，核心策略就是對應：我們**要**關心的是靜態資源的邏輯組織。

Top：我們會使用"與協定相關的URL"來參考靜態資源。意思是，URL的開頭只是//，而不是http://或https://。這可讓瀏覽器使用任何適當的協定。

所以這歸類為對應問題：我們想將較不具體的路徑(*/img/meadowlark_logo.png*)對應至較具體的路徑(*//s3-us-west-2.amazonaws.com/meadowlark/img/meadowlark_logo-3.png*)。此外，我們還希望可以改變那個對應。例如，在你註冊Amazon S3帳號之前。可能想將圖像放在在地端。

這些範例中，為了完成對應，我們只是將某些東西加到路徑的前面，稱之為**基底URL**。可採取一種存放數位資產的資料庫來將"Meadowlark Logo"對應至*http://meadowlarktravel.com/img/meadowlark_logo.png*，不過要有充分的理由這樣做。關於更複雜的對應方案，較實際的範例是使用資產版本設定，例如編寫一個對應程式將*/img/meadowlark_logo.png*對應至*/img/meadowlark_logo-5.png*。

目前我們只想要採用簡單的對應方案：我們只添加一個基底URL。我們假設所有靜態資料都以斜線開頭。因為我們會在一些不同的檔案類型使用對應程式(視圖、CSS及JavaScript)，所以想將它模組化。我們來建立一個檔案，名為*lib/static.js*：

```
var baseUrl = '';

exports.map = function (name) {
    return baseUrl + name;
};
```

現在正在開發，所以可把靜態資源放在*localhost*。也請注意，我們可能想要從組態檔讀取baseUrl的值，就目前而言，我們只會將它放在模組。

### 視圖中的靜態資源

視圖中的靜態資源容易處理。我們可建立一個Handlebars輔助程式來給我們一個靜態資源的連結：


```
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        static: function (name) {
            return require('./lib/static').map(name);
        }
    }
});
```

我們加入一個Handlebars輔助程式，稱為static，它只會呼叫靜態對應程式。現在我們來修改main.layout，讓標誌圖像使用這個新的輔助程式：

```
<header><img src="{{static '/img/logo.png'}}" alt="Meadowlark Travel Logo"></header>
```

現在花些時間將所有的參考換成視圖及模板中的靜態資源。現在HTML裡面所有靜態資源都已經可以移轉到CDN了。

### CSS內的靜態資源

CSS預處理程式，我最喜歡LESS。

我會在網站中添加一個背景圖像來提供一些紋理。建立一個目錄，稱為less，以及一個在裡面的檔案，稱為main.less：

```
body {
  background-image: url("/img/background.png");
}
```

LESS可以向後兼容CSS。將public/css/main.css檔案裏面已經有任何一行CSS，就應該移到less/main.less。現在需要編譯LESS來產生CSS的方法，我們會使用Grunt工作：

```
npm install --save-dev grunt-contrib-less
```

接著修改Gruntfile.js：

```
less: {
    development: {
        files: {
            'public/css/main.css': 'less/main.less'
        }
    }
}
```

這段語法代表"從less/main.less產生public/css/main.css"。現在執行grunt less，你就會得到CSS檔，再將它連結到我們的版面配置：

```
<link rel="stylesheet" href="{{static '/css/main.css'}}">
```

現在來設定框架，讓CSS檔裡面的URL可重新定位。首先，我們將靜態對應程式以LESS自訂函式連結進來。

```
less: {
    development: {
        options: {
            customFunctions: {
                static: function (lessObject, name) {
                    return 'url("' + require('./lib/static').map(name.value) + '")';
                }
            }
        },
        files: {
            'public/css/main.css': 'less/main.less'
        }
    }
}
```

注意我們在對應程式的輸出添加標準的url說明符與雙引號：這會確保我們的CSS是有效的。現在修改LESS檔：

```
body {
  background-image: static("/img/background.png");
}
```

## 伺服器端JavaScript的靜態資源

在伺服器端使用靜態對應程式非常簡單。我們已經寫了一個模組來做對應。假設我們想要添加一個復活節彩蛋到應用程式。我們想要在Clark先生的生日將標誌換成他的照片。修改*meadowlark.js*：

```
var static = require('./lib/static').map;
app.use(function (req, res, next) {
    var now = new Date();
    res.locals.logoImage = now.getMonth() === 11 && now.getDate() === 19 ? static('/img/logo_bud_clark.png') : static('/img/logo.png');
    next();
});
```

接著*views/layouts/main.handlebars*：

```
<header><img src="{{logoImage}}" alt="Meadowlark Travel Logo"></header>
```

注意我們並未在視圖中使用static Handlebars輔助程式：因為我們已經在路由處理程式中使用它了。

## 用戶端JavaScript的靜態資源

如果我們開始使用資料來做更複雜的對應，它將會再也不能在瀏覽器中工作。此時我們就必須發出AJAX呼叫，讓伺服器為我們對應檔案，這會大大的減緩速度。

```

```