# chap05. 品質確認

## QA：是否值得？

在Web開發上，品質可被分成三個領域：

- 影響力

    影響力指的是產品的市場滲透率：觀看網站或使用服務的人數。SEO會大幅衝擊影響力，這就是SEO加入QA計畫的原因。

- 功能性

    網站功能的品質會深深影響使用者停留程度。與其他領域不同的是，你通常可以自動進行功能測試

- 易用性

    功能性焦點在於功能的正確與否，易用性則是評估人類與電腦之間的互動(HCI)。“功能的傳遞方式對目標使用者而言是實用的嗎？”，但追求易用性往往會失去彈性與功能。評估易用性，必須考慮目標使用者。
    
    它通常無法自動驗證，但你應該將使用者的測試加入QA計劃之中。

- 美觀

    三個領域中最主觀的一種，也是與開發最沒關係的一種。雖網站美學與開發沒太大關係，但你的QA計畫應該定期檢查網站的美學。讓使用者觀看你的網站覺得落伍或無法產生預期的反應。
    
    美學是與時間有關的，且會隨使用者而有所不同。

QA計畫應該要包含所有四個維度，功能測試及SEO可在開發過程中自動測試。

## 邏輯與外觀

網站有兩種“領域”：

- 邏輯(商業邏輯)

    網站邏輯有一種純粹的知識領域。盡可能簡單、清楚。

- 外觀

    視需要簡單或複雜。與易用性、美觀有關。
    
## 測試類型

**單元測試**與**整合測試**。

- 單元測試：測試單一元件確保功能正常。
- 整合測試：測試多個元件的互動，甚至整個系統。

一般而言，單元測試用來測邏輯。整合測試同時適用兩者(邏輯與外觀)。

## QA技術概要

- 網頁測試

    測試一張網頁的外觀及前端功能。涉及到單元測試及整合測試。這裏會使用Mocha來完成。

- 跨頁測試

    這種測試先天就涉及一個以上的元件，通常為整合測試。這裡會使用Zombie.js。
    
- 邏輯測試

    對我們邏輯領域執行單元及整合測試。它只會測試JavaScript。

- Lint

    找出潛在的錯誤。使用JSHint作lint。
    
- 連結檢查

    確保網站沒無效的連結。連結檢查屬於單元測試。會使用LinkChecker。
    
## 運行你的伺服器

使用nodemon，grunt外掛程式。

## 網頁測試

建議將測試碼坎入網頁，這樣製作網頁時，可在瀏覽器載入它的時候立即看到所有錯誤。這種做法需要一些設定：

```
npm install --save-dev mocha
```

`--save-dev`：讓npm在開發依賴關係列出這個套件，而不是執行期的依賴關係。這在部署網站的活動實例時，減少專案的依賴關係數量。

將Mocha資源放入公用的資料夾，讓他可被傳到用戶端。

```
mkdir public/vendor
cp node_modules/mocha/mocha.js public/vendor
cp node_modules/mocha/mocha.css public/vendor
```

Top：將你所使用的第三方程式庫放到一個特別的目錄，例如vendor，是一種不錯的做法。這可讓你輕鬆區別哪些程式碼是應該測試並修改的，哪些程式碼可以跳過。

測試通常需要一種功能，稱為assert(或expect)。Node框架可以使用它，但瀏覽器沒有內建，所以我們會使用Chai判斷程式庫。

```
npm install --save-dev chai
cp node_modules/chai/chai.js public/vendor
```

讓測試預設停用，使用URL參數來啟動測試：`http://localhost:3000?test=1`

```
app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

// 路由由此開始...
```

現在修改*views/layouts/main.handlebars*，依條件加入測試框架：

```
<head>
    <title>Meadowlark Travel</title>
    {{#if showTests}}
        <link rel="stylesheet" href="/vendor/mocha.css">
    {{/if}}
    <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
</head>
```

這裡連結jQuery，因為，除了會將它當成網站的主要DOM操作庫之外，也可用它來產生測試結果。

```
{{#if showTests}}
    <div id="mocha"></div>
    <script src="/vendor/mocha.js"></script>
    <script src="/vendor/chai.js"></script>
    <script>
        mocha.ui('tdd');
        var assert = chai.assert;
    </script>
    <script src="/qa/tests-global.js"></script>
    {{#if pageTestScript}}
        <script src="{{pageTestScript}}"></script>
    {{/if}}
    <script>mocha.run();</script>
{{/if}}
</body>
```

_/qa/tests-global.js_：這是每個網頁上運行的測試。接下來加入網頁專屬的測試。先從單一、簡單的測試開始：確保網頁有一個有效的標題。

```
suite('Global Tests', function () {
    test('page has a valid title', function () {
        assert(document.title && document.title.match(/\S/) && 
            document.title.toUpperCase() !== 'TODO');
    });
});
```

Top：Mocha支援多個“介面”，它會控制你的網站樣式。預設的介面是驅動開發(BDD)，他是為了讓你站在行為的角度來思考而量身訂做。BDD中你會描述元件與他們的行為以及測試，接下來驗證這些行為。但許多測試與這個模式不一致。讓BDD語言看起來很奇怪。測試驅動開發(TDD)比較實際：你可描述測試的套件，及套件的測試項。

接下來執行網站，並加上查詢字串*test=1*。

現在添加網頁專用的測試，確保之後要建立的Contact網頁連結會一直位在About網頁上。

建立一個檔案：_public/qa/tests-about.js_

```
suite('"About" Page Tests', function () {
    test('page should contain link to contact page', function () {
        assert($('a[href="/contact"]').length);
    });
});
```

最後一件事要做：在路由中指定哪個網頁測試檔是view要使用的。修改About網頁路由：

```
app.get('/about', function (req, res) {
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});
```

## 跨網頁測試

例如有一個Request Group Rate網頁，裡面包含一個聯絡人表單。行銷想知道客戶從哪個連結前往Request Group Rate網頁 - 從Hood River旅遊或Oregon Coast靜修。

要做到這件事，需要一些隱形的表單欄位及JavaScript，測試方式是前往一個網頁，接著按下Request Group Rate，並確認隱藏起來的欄位是否被填入適當的東西。

建立一個旅遊網頁*views/tours/hood-river.handlebars*：

```
<h1>Hood River Tour</h1>
<a class="requestGroupRate" href="/tours/request-group-rate">Request</a>
```

及一個報價網頁*views/tours/request-group-rate.handlebars*：

```
<h1>Request Group Rate</h1>
<form>
    <input type="hidden" name="referrer">
    Name: <input type="text" id="fieldName" name="name"><br>
    Group size: <input type="text" name="groupSize"><br>
    Email: <input type="email" name="email"><br>
    <input type="submit" value="Submit">
</form>
<script>
    $(document).ready(function () {
        $('input[name="referrer"]').val(document.referrer);
    });
</**script>
```

增加上述網頁的路由：

```
app.get('/tours/hood-river', function (req, res) {
    res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function (req, res) {
    res.render('tours/request-group-rate');
});
```

現在可供手動測試了，但我們想要的是經常被稱為headless瀏覽器的東西：它代表該瀏覽器不一定要在螢幕上顯示東西，只要有瀏覽器的行為就可以了。

這裡選擇：_Zombie_

Zombie並未使用既有的瀏覽器引擎，所以它不適合用來測試瀏覽器功能，但它很適合測試基本功能。

首先，安裝Zombie：

```
npm install --save-dev zombie
```

現在要建立新目錄，名稱只有qa。該目錄中建立一個檔案*qa/tests/crosspage.js*：

```
var Browser = require('zombie');

var browser;

suite('Cross-Page Tests', function () {

    setup(function () {
        browser = new Browser();
    });

    this.timeout(5000);

    test('requesting a group rate quote from hood river tour page should populate the referrer field', function (done) {
        var referrer = 'http://localhost:3000/tours/hood-river';
        browser.visit(referrer, function () {
            browser.clickLink('.requestGroupRate', function () {
                browser.assert.element('form input[name=referrer]', referrer);
                done();
            });
        });
    });
    // this test fails on the assertion, checking the actual output says it should pass
    test('requesting a group rate quote from oregan coast tour page should populate the referrer field', function (done) {
        var referrer = 'http://localhost:3000/tours/oregan-coast';
        browser.visit(referrer, function () {
            browser.clickLink('.requestGroupRate', function () {
                browser.assert.element('form input[name=referrer]', referrer);
                done();
            });
        });
    });
    // this test passes but not sure it is actually making it real?
    test('visiting the "request group rate" page directly should result in an empty referrer field', function (done) {
        browser.visit('http://localhost:3000/tours/request-group-rate', function () {
            browser.assert.element('form input[name=referrer]', '');
            done();
        });
    });
});
```

setup會取用一個函式，測試框架會在每次執行測試之前執行這個函式：這是為每個測試項建立新的瀏覽器實例的地方。

*browser.visit*會確實地載入網頁

*browser.clickLink*會用requestGroupRate類別來查看連結，並跟隨它。載入被連結的網頁時，會呼叫回呼函式。

*browser.field*方法會回傳一個DOM Element物件。(zombie到4.X版即無法使用，需使用*browser.assert.element*)

執行測試：

- 啟動伺服器：

    ```
    node meadowlark.js
    ```

- 執行測試：

    ```
    mocha -u tdd -R spec qa/tests-crosspage.js 2>/dev/null
    ```

會有一個錯誤，只要再加上Oregon Coast Tour的，所有測試就都會通過了。

指令中，我將介面指定為TDD，並使用一個稱為spec的回報器。spec回報器會比預設的回報器提供更多資訊。Mocha會回報所有失敗測試的追蹤。

如果需要更多資料，不使用*2>/dev/null*就會看到錯誤的詳細資訊。

Top：在實作功能之前編寫測試項的優點之一，是它們一開始都是失敗的。當測試項開始通過測試時，你不但會有成就感，也可以確定測試是正確的。反之，若實作功能之前就通過測試，代表該測試項可能是壞的。這有時稱為紅綠燈測試。

## 邏輯測試

我們也會使用Mocha來做邏輯測試。這裡加入單元測試。建立檔案*qa/tests-unit.js*：

```
var fortune = require('../lib/fortune');
var expect = require('chai').expect;

suite('Fortune cookie tests', function () {

    test('getFortune() should return a fortune', function () {
        expect(typeof fortune.getFortune() === 'string');
    });

});
```

```
mocha -u tdd -R spec qa/tests-unit.js
```

## Lint

良好的Linter就好像第二對眼睛，它會發現人類的大腦遺漏的事項。

採用的lint是JSHint。

```
npm install -g jshint
```

```
jshint meadowlark.js
```

持續使用linter會讓你成為一位更棒的程式員。

## 連結檢查

連結死掉會對搜尋引擎的網站排名方式造成很大的影響。在你的工作流程中整合它非常容易。

推薦LinkChecker。

```
linkchecker http://localhost:3000
```

## 使用Grunt進行自動化

我們所使用的QA工具(測試套件、lint、連結檢查器)，只有確實**被使用**時才能提供價值，這也是許多QA計畫不了了之的主因。你必須記得QA工具鏈的所有元件，以及執行它們的所有指令，這樣使用它們的機會將大大降低。

將QA工具鏈流程自動化。

透過Grunt，把邏輯測試、跨頁測試、lint，及連結測試全部放到單一指令。沒網頁測試？因為headless瀏覽器，如PhantomJS或Zombie都可用來測試，但其測試複雜，超出本書範圍。此外，瀏覽器測試通常設計為製作單獨網頁時執行，所以它的價值無法與其他測試相提並論。

安裝Grunt：

```
npm install -g grunt-cli
npm install --save-dev grunt
```

Grunt依賴**外掛程式**來做事，我們需要Mocha、JSHint及LinkChecker外掛程式。

```
npm install --save-dev grunt-cafe-mocha grunt-contrib-jshint grunt-link-checker
```

再來在你的專案中建立Gruntfile.js：

```
module.exports = function (grunt) {

    // 載入外掛
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-link-checker'
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // 設置外掛
    grunt.initConfig({
        cafemocha: {
            all: {src: 'qa/tests-*.js', options: {ui: 'tdd'}}
        },
        jshint: {
            app: ['meadowlark.js', 'public/js/**/*.js', 'lib/**/*.js'],
            qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
        },
        linkChecker: {
            dev: {
                site: 'localhost',
                options: {
                    initialPort: 3000
                }
            }
        },
    });

    // 註冊工作
    grunt.registerTask('default', ['cafemocha', 'jshint', 'linkChecker']);
};
```

*cafemocha*外掛，我們必須告訴它測試在哪裡。

JSHint，我們必須指定哪些JavaScript檔案要被lint。目前*grunt-contrib-jshint*無法排除檔案，只能加入它們。我通常會將想要加入的檔案分成兩個清單：實際構成應用程式或網站的JavaScript，及QA JavaScript。

grunt特別命名的目錄：default，是只輸入grunt，預設執行的工作。

```
grunt
```

如果有任何元件出問題，Grunt會產生一個錯誤訊息並中斷。

## 持續整合(CI)

另一個非常有用的QA概念：持續整合。基本上，在你每次提供程式碼給共用伺服器之前，CI會執行你的一些或全部的測試。結果失敗通常比較公開化，會有email通知給整個團隊。

Node專案專用CI伺服器是Travis CI。它是一種主機式解決方案。Github提供傑出的整合支援。結構良好的CI伺服器現在也有Node外掛。JetBrains的TeamCity也提供Node外掛。