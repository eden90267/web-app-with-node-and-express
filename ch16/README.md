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

使用jQuery來動態改變購物車圖像。當我們將圖像移到CDN，這會分崩離析：

*meadowlark.js*：

```
// middleware to provide cart data for header
app.use(function (req, res, next) {
    var cart = req.session.cart;
    res.locals.cartItems = cart && cart.items ? cart.items.length : 0;
    next();
});
```

*main.handlebars*：

```
<header>
    <div class="row">
        <div class="col-sm-4">
            <img src="{{logoImage}}" alt="Meadowlark Travel Logo">
        </div>
        <div class="col-sm-2 pull-right">
            {{! The following represents a lot of code duplication, so we will probably want to change this in the future }}
            <a href="/cart">
                {{#if cartItems}}
                    <img class="cartIcon"
                         src="{{static '/img/shop/cart_full.png'}}'"
                         alt="Cart Contains {{cartItems}} Items">
                {{else}}
                    <img class="cartIcon"
                         src="{{static '/img/shop/cart_empty.png'}}"
                         alt="Cart Contains {{cartItems}} Items">
                {{/if}}
            </a>
        </div>
    </div>
</header>
```

```
$(document).on('meadowlark_cart_changed', function () {
        $('header img.cartIcon').attr('src', cart.isEmpty() ? '/img/shop/cart_empty.png' : '/img/shop/cart_full.png');
    });
```

所以我們希望可以對應這些圖像。解決方案是在伺服器做對應，並設定自訂的JavaScript變數。讓jQuery直接使用這些變數：

```
var IMG_CART_EMPTY = '{{static '/img/shop/cart_empty.png'}}';
var IMG_CART_FULL = '{{static '/img/shop/cart_full.png'}}';

$(document).on('meadowlark_cart_changed', function () {
        $('header img.cartIcon').attr('src', cart.isEmpty() ? IMG_CART_EMPTY : IMG_CART_FULL);
    });
```

若你在用戶端做大量的圖像交換，或許會想要在一個物件裡面組織所有的圖像變數(自己變成某種對應)：

```
<script>
    // 一個物件裡面組織所有的圖像變數
    var static = {
        IMG_CART_EMPTY: '{{static '/img/shop/cart_empty.png'}}',
        IMG_CART_FULL: '{{static '/img/shop/cart_full.png'}}'
    }
</script>
```

## 傳送靜態資源

我們已經知道如何建立一個框架來改變傳送靜態資源的地方。但資產的最佳儲存方式是什麼？了解瀏覽器所使用的標頭，可以協助你決定如何(及是否)緩存資源：

- **Expires/Cache-Control**

    這兩個標頭說明你的瀏覽器資源可緩存的最長時間。瀏覽器會認真地看待它們。但不是完全掌控：使用者可以手動清除快取，或瀏覽器可以清除你的資源，將空間留給其他使用者較常造訪的資源。Expires受到較廣泛的資源，所以使用它是較好的選擇。如果資源在快取裡面，而且它還沒有逾期，瀏覽器就完全不會發出一個GET請求，這可提升效能，特別是在行動設備上。

- **Last-Modified/ETag**

    這兩個標籤提供版本控制：如果瀏覽器需要擷取資源，它會在下載內容**之前**先檢視這些標籤。GET請求仍然會被發送到伺服器，但如果這些標頭回傳的值滿足資源尚未改變的瀏覽器，它就不會繼續下載檔案。Last-Modified指定資源最後修改的日期。ETag可使用任意的字串，它通常是一個版本字串或內容雜湊。

傳遞靜態資源時，你應該使用Expires標頭**以及**Last-Modified或ETag。Express的內建satic中介軟體會設定Cache-Control，但不會處理Last-Modified或ETag。因此，雖然它很適合用來開發，但它不是一個很好的部署方案。

如果你選擇將靜態資源放在CDN，例如Amazon CloudFront、Microsoft Azure或MaxCDN，它們會為你處理大部分的細節。你也可微調細節，但這些服務提供的預設值已經很好了。

若不想將靜態資源放在CDN，但想要用某種比Express的內建connect中介軟體更強健的東西，可考慮使用代理伺服器，例如Nginx。

## 改變你的靜態內容

快取可明顯增加網站效能，但它不是不用付出代價的。Google建議你緩存一個月，最好一年。想像一下，使用者一整年使用你網站但都不會看到你最新狀態。

你不能要求使用者清除他們的快取。解決方案是**指紋識別**(fingerprinting)，指紋識別只是將資源名稱加上某種版本資訊。當你更新資產，資源名稱會改變，讓瀏覽器知道要下載它。

如果你正處於有大量圖像位於CDN，你就要考慮讓靜態對應程式更複雜。例如，你或許會將所有數位資產的版本存在一個資源庫，靜態對應程式可以查看資產名稱，並回傳資產**最近的版本的URL**。

你至少要在CSS與JavaScript檔使用指紋識別。當你推出新功能或改變網頁版面配置之後，使用者卻因為資源被緩存而無法看到改變的時候，才真的讓人沮喪。

除了將各個檔案加上指紋識別外，最受歡迎的替代方案是**統合**你的資源。統合會將你的所有CSS弄成一個檔案，人類無法看懂他，你的用戶端JavaScript也一樣。因為新的檔案會被各種方式建構出來，將這些檔案加上指紋識別通常是很簡單且常見做法。

## 統合與壓縮

統合與壓縮，讓Grunt協助我們管理繁重的工作。

建立兩個檔案：一個供聯絡方式表單提交處理程式使用，另一個則是供購物車功能使用。

*public/js/contact.js*：

```
$(document).ready(function () {
    console.log('contact forms initialized');
});
```

*public/js/cart.js*：

```
$(document).ready(function () {
    console.log('shopping cart initialized');
});
```

Gruntfile.js：

```
npm install --save-dev grunt-contrib-uglify grunt-contrib-cssmin grunt-hashres
```

```
[
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-link-checker',
    'grunt-contrib-less',
    'grunt-contrib-uglify',
    'grunt-contrib-cssmin',
    'grunt-hashres'
].forEach(function (task) {
    grunt.loadNpmTasks(task);
});

// ...

uglify: {
    all: {
        files: {
            'public/js/meadowlark.min.js': ['public/js/**/*.js']
        }
    }
},
cssmin: {
    combine: {
        files: {
            'public/css/meadowlark.css': ['public/css/**/*.css', '!public/css/meadowlark*.css']
        }
    },
    minify: {
        src: 'public/css/meadowlark.css',
        dest: 'public/css/meadowlark.min.css',
    }
},
hashres: {
    options: {
        fileNameFormat: '${name}.${hash}.${ext}'
    },
    all: {
        src: [
            'public/js/meadowlark.min.js',
            'public/css/meadowlark.min.css',
        ],
        dest: [
            'views/layout/main.handlebars',
        ]
    }
}
});
```

接下來，版面配置修改：

```
<link rel="stylesheet" href="{{static '/css/meadowlark.min.css'}}">
// ...
<script src="{{static '/js/meadowlark.min.js'}}"></script>
```

```
grunt less
grunt cssmin
grunt uglify
grunt hashres
```

這樣很費工，我們來設定Grunt工作：

```
grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
```

這樣只要輸入grunt static，就可以照顧到所有事情。

## 在開發模式下，跳過統合與壓縮

統合與壓縮有一個問題：它會讓前端除錯無法進行。理想的方式，就是想辦法在開發模式下取消統合及壓縮。我已經為你編寫這個模組了：connect-bundle。

```
// set up css/js bundling
var bundler = require('connect-bundle')(require('./config'));
app.use(bundler);
```

接著建立一個設定檔*config.js*：

```
module.exports = {
    bundles: {

        clientJavaScript: {
            main: {
                file: '/js/meadowlark.min.js',
                location: 'head',
                contents: [
                    '/js/contact.js',
                    '/js/cart.js',
                ]
            }
        },

        clientCss: {
            main: {
                file: '/css/meadowlark.min.css',
                contents: [
                    '/css/main.css',
                    '/css/cart.css',
                ]
            }
        }

    }
};
```

在這裡，我們只指定“標頭”(我們可任意稱呼它，但JavaScript統合必須要有一個位置)。

修改版面配置：

```
{{#each _bundles.css}}
    <link rel="stylesheet" href="{{static .}}">
{{/each}}
{{#each _bundles.js.head}}
    <script src="{{static .}}"></script>
{{/each}}
```

如想使用指紋識別的統合名稱，就必須修改config.js。修改Gruntfile.js：

```
hashres: {
    options: {
        fileNameFormat: '${name}.${hash}.${ext}'
    },
    all: {
        src: [
            'public/js/meadowlark.min.js',
            'public/css/meadowlark.min.css',
        ],
        dest: [
            'config.js',
        ]
    }
}
```

## 關於第三方程式

可看到jQuery並未統合起來。如果你只使用一或兩個第三方程式庫，或許不值得將它們與你的指令碼綁在一起。但是如果你有五個以上程式庫，或許你可以看到統合程式庫對效能的改善。

## QA

與其等待不可避免的錯誤發生，或期望程式審查抓到問題，何不在QA工具鏈中加入一個元件來解決問題？我們將使用一個Grunt外掛，grunt-lint-pattern，它會在原始檔案中搜尋一種模式，並且在發現時產生一個錯誤。

```
npm install --save-dev grunt-lint-pattern
```

```
lint_pattern: {
    view_statics: {
        options: {
            rules: [
                {
                    pattern: /<link [^>]*href=["'](?!{{|(https?:)?\/\/)/,
                    message: 'Un-mapped static resource found in <link>.'
                },
                {
                    pattern: /<script [^>]*src=["'](?!{{|(https?:)?\/\/)/,
                    message: 'Un-mapped static resource found in <script>.'
                },
                {
                    pattern: /<img [^>]*src=["'](?!{{|(https?:)?\/\/)/,
                    message: 'Un-mapped static resource found in <img>.'
                }
            ]
        },
        files: {
            src: [
                'views/**/*.handlebars'
            ]
        }
    },
    css_statics: {
        options: {
            rules: [
                {
                    pattern: /url\(/,
                    message: 'Un-mapped static found in LESS property.'
                },
            ]
        },
        files: {
            src: [
                'less/**/*.less'
            ]
        }
    }
}
```

接著在你預設規則中加入lint_pattern：

```
grunt.registerTask('default', ['cafemocha', 'jshint', 'linkChecker', 'lint_pattern']);
```

現在當我們執行grunt，會捕捉所有未對應的靜態實例。

## 結論

靜態資源最佳化，雖然帶來很多麻煩，但它們可能代表實際被傳送到你的訪客那裡的大量資料，因此花些時間處理它們，將會帶來大量的回報。

靜態對應，對於某些小型或較不複雜的網站而言，可能有點大材小用。對於這些專案另一可行辦法，就是一開始就在CDN上託管你的靜態資源，並在視圖與CSS中使用完整的資源URL。也可用lint確保你不是在本地託管靜態資源：`(?:https?:)//`。

精心統合與壓縮是另一種節省時間的方式。

無論哪一種技術提供靜態資源，我都強烈建議將他們分開託管，最好在CDN上。CDN的託管成本很低，而且明顯提升效能。