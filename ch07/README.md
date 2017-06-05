# chap07. 使用Handlebars來製作樣板

在Web上使用的語言，幾乎都已內建某種形式的樣板資源。

但現在不同的地方在於，"模板引擎"已經與語言分開。典型的例子是Mustache。

傳統用JavaScript發出HTML會有很多問題：

- 你必須經常考慮有哪些字元需要轉譯。
- 如果你要使用JavaScript來產生本身含有JavaScript的HTML，很快會抓狂
- 你通常不能使用編輯器的"語意亮顯"及其他好用的語言專屬功能
- 更難找出不正確的HTML
- 很難直觀地解析
- 其他人很難了解你的程式碼

樣板可以解決這些問題，因為它可讓你用目標語言編寫，同時提供插入動態資料的能力。

以下為使用Mustache模板：

```
<h1>Much Better</h1>
<p>No <span class="code">document.write</span> here!</p>
<p>Today's data is {{today}}.</p>
```

現在我們要做的，只是提供{{today}}的值，這也就是樣板語言的核心了。

## 除了這一條規則之外，就沒有絕對的規則了

並不是建議永遠都不要用JavaScript來編寫HTML，而是要盡可能地避免這件事。特別是因為前端程式碼比較貼心。非常簡單的情況下就比較沒關係。

```
$('#error').html('Something <b>very bad</b> happened!');
```

## 選擇模板引擎

以下是一些考量的準則：

- 效能
- 用戶端? 伺服器? 或兩者?

    如果要在兩端同時使用樣板，建議選擇兩端都可使用的。

- 抽象

    想要某些似曾相識的東西，或其實不喜歡HTML，而喜歡那些讓你不必使用括號的東西。樣板(特別是伺服器端樣板)提供一些選項。

## Jade：一種不同的做法

Jade會為你將HTML的細節抽象化。另一點值得注意是，Jade是為我們帶來Express的TJ Holowaychuk的心血結晶。

Jade肯定會減少許多文字輸入：不需角括號或封閉標籤。相反地，它依賴縮排及一些符合常識的規則。Jade還有項額外優點：理論上，當HTML改變時，你可以讓Jade重新指定HTML的最新版本，讓你可以"確保未來"的內容。

佩服Jade的哲學及它執行上的優雅的同時，我不希望HTML的細節被抽象掉。身為一位Web開發者，HTML是我工作的核心，就算鍵盤上的角括號會被手指磨耗，我也只有認命。

這裡是我們與Jade分道揚鑣的地方。

## Handlebars基礎

Handlebars是Mustache的擴充，是另一種受歡迎的樣板引擎。推薦Handlebars的原因，是它可以輕鬆地整合JavaScript(包括前端與後端)及類似的語法。對我而言，它打破所有的權力平衡。

要了解樣板引擎，關鍵在了解**內容**(*context*)的概念。當你轉譯一個模板時，你會傳送一個物件，名為**內容物件**(context object)給模板引擎，這就是替換進行的地方。

內容物件：`{name: 'Buttercup'}`，且模板引擎是`<p>Hello, {{name}}!</p>`，{{name}}會被取代為Buttercup。

如果要將HTML傳送到模板，只要三個大括號即可：`{{{name}}}`(使用三個大括號來關閉HTML轉譯功能。在沒有HTML轉譯的情況下呈現內容的特性，對**版面**及**區段**而言都很重要)。

### 註解

Handlebars的註解長得像這樣：`{{! comment goes here}}`。與HTML註解不同的是，假設它是伺服器端的模板，裡面的極機密註解永遠不會被送到瀏覽器。

### 區塊

當你開始考慮**區塊**，事情會變得比較複雜。區塊提供流程控制、條件執行及擴充功能。考慮下列的內容物件：

```
{
    currency: {
        name: 'United States dollars',
        abbrev: 'USD',
    },
    tours: [
        {name: 'Hood River', price: '$99.95'},
        {name: 'Oregon Coast', price: '$159.95'},
    ],
    specialsUrl: '/january-specials',
    currencies: ['USD', 'GBP', 'BTC'],
}
```

```
<h1>Block</h1>

<ul>
    {{#each tours}}
        {{! I'm in a new block...and the context has changed }}
        <li>
            {{name}} - {{price}}
            {{#if ../currencies}}
                ({{../../currency.abbrev}})
            {{/if}}
        </li>
    {{/each}}
</ul>
{{#unless currencies}}
    <p>All prices in {{currency.name}}</p>
{{/unless}}
{{#if specialsUrl}}
    {{! I'm in a new block..but the context hasn't changed (sortof) }}
    <p>Check out our <a href="{{specialsUrl}}">specials!</a></p>
{{else}}
    <p>Please check back often for specials.</p>
{{/if}}
<p>
    {{#each currencies}}
        <a href="#" class="currency">{{.}}</a>
    {{else}}
        Unfortunately, we currently only accept {{currency.name}}
    {{/each}}
</p>
```

- each：可遍歷陣列。在區塊中如果想操作currency物件，我們必須使用../來存取**上一代**的內容。
- 在Handlebars中，所有**區塊**都會改變內容，所以在if區塊中，有一個新的內容。在`{{#each tours}}`迴圈中，我們可以使用../來存取上一代的內容。但是，在`{{#if ../currencies}}`區塊中，我們已經輸入一個新的內容...所以要到currency物件，我們必須用../../。
- if與each都可以使用else區塊(如果陣列中沒任何元素，else會執行)。
- unless，基本上它是if的相反，false情況下執行。
- `{{#each currencies}}`區塊中的`{{.}}`，代表目前的內容。

Top：使用一個句點來存取目前內容有其他作用：它可以區分輔助程式及目前內容的特性。例如，你有一個輔助程式，稱為foo，在目前的內容也有一個特性稱為foo，{{foo}}代表輔助程式，{{./foo}}代表特性。

### 伺服器端模板

伺服器端模板可在HTML被傳到用戶端**之前**轉譯HTML。與用戶端模板不同的是，使用者永遠不會看到伺服器端的模板，或是用來產生HTML的內容物件。

伺服器端模板除了可以隱藏實作細節外，也支援模板緩存。模板引擎會緩存已被編譯的模板(在模板本身有所改變時，才會重新編譯及重新緩存)，這會提升模板化的視圖的效能。預設情況下，視圖緩存在開發模式是停用的，並在產品模式下啟用。若想自行啟用視圖緩存：`app.set('view cache', true);`。

我們需要添加一個node套件來為Express提供Handlebars支援。

```
npm install --save express3-handlebars
```

接下來為它連結至Express：

```
// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
```

Tops：express3-handlebars預期Handlebars模板會有.handlebars副檔名。也可將副檔名調整為也很常見的.hbs：`require('express3-handlebars').create({extname: '.hbs'});`。

#### 筆者註

express3-handlebars已經rename為express-handlebars，且設定view engine有改變：

```
npm install --save express-handlebars
```

```
// 設定handlebar view引擎
app.engine('handlebars', require('express-handlebars')({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
```

不過到partials練習時會有問題...

```
Error: You must pass a string or Handlebars AST to Handlebars.compile. You passed [object Object]
```

### 視圖與版面配置

**視圖**(view)通常代表網站的一張獨立網頁(也有可能代表網頁、email、或其他東西之中，AJAX載入的部分)。在預設情況下，Express會在*views*子目錄中尋找視圖。**版面配置**是一種特殊類型的視圖，基本上，它是模板的模板。版面配置是很基本的，因為大部分網頁都會友幾乎相同的版面，你不想在每一個網頁中重複這些程式碼，這就是版面配置的用途所在。

```
<!doctype html>
<html>
<head>
    <title>Meadowlark Travel</title>
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    {{{body}}}
</body>
</html>
```

{{{body}}}欄位的放置地點是沒有限制的。

```
<body>
<div class="container">
    <header>
        <h1>Meadowlark Travel</h1>
    </header>
    {{{body}}}
    <footer>&copy; {{copyrightYear}} Meadowlark Travel</footer>
</div>
</body>
```

動作的順序：**視圖會先被呈現**，在版面之前。反向的作法有一些優點。特別是，它可以讓視圖本身進一步自訂版面，當討論到**段落**，這是很好用的功能。

### 在Express中使用版面配置(或不使用)

當我們建立視圖引擎，會指定預設版面配置的名稱；

```
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
```

預設情況下，Express會在views子目錄中察看視圖，並在views/layouts中察看版面配置。

```
app.get('/foo', function(req, res) {
    res.render('foo');
});
```

如果完全不想要使用版面配置，可在內容物件中指定layout: null：

```
app.get('/foo', function(req, res) {
    res.render('foo', {layout: null});
});
```

或者，想使用不同的模板：

```
app.get('/foo', function(req, res) {
    res.render('foo', {layout: 'microsite'});
});
```

### Partials

你經常想要在不同網頁上重複使用許多元件(前端圈之中，稱為"widget")。我們想要用一個Current Weather元件來顯示目前在Portland、Bend與Manzanita的天氣狀況。我們希望這個元件是可重複使用的，讓我們輕鬆將它放在想要的天氣網頁上，所以需要partial。

首先，建立一個partial檔案views/partials/weather.handlebars：

```
<div class="weatherWidget">
    {{#each partials.weather.locations}}
        <div class="location">
            <h3>{{name}}</h3>
            <a href="{{forecastUrl}}">
                <img src="{{iconUrl}}" alt="{{weather}}">
                {{weather}}, {{temp}}
            </a>
        </div>
    {{/each}}
    <small>Source: <a href="http://www.wunderground.com">Weather Underground</a></small>
</div>
```

注意，內容的命名空間一開頭使用`partial.weather`，因為我們想要在任何的網頁上使用partial，將內容傳入所有的視圖是不切實際的做法，因此我們使用res.locals(所有視圖都可使用它)。但是因為我們不想要干涉個別的視圖所指定的內容，我們會將所有的parital內容放入paritals物件中。

```
// mocked weather data
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}
```

現在來建立一個中介軟體將這個資料注入res.locals.partials物件。

```
app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData();
    next();
});
```

接下來在視圖中使用partial即可。編輯views/home.handlebars：

```
<h1>Welcome to Meadowlark Travel</h1>
{{> weather}}
```

`{{> partial_name}}`是將partial加到視圖的語法：express-handlebars會在views/partials中尋找一個partial_name.handlebars的視圖。

Top：express3-handlebars支援子目錄，所以如果你有許多partial時，可以組織它們。

### Sections

如果你的視圖需要將它自己注入版面的不同部分的話，會發生什麼事? 舉例，有一個視圖需要在`<head>`元素中添加某個東西，或插入一個使用jQuery的`<script>`。

Handlebars輔助程式會讓這件事情變得容易處理。當我們初始化Handlebars物件時，會加入一個輔助程式，稱為section：

```
// 設定handlebar view引擎
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
```

現在可在視圖中使用section輔助程式。我們來添加一個視圖(views/jquerytest.handlebars)，在`<head>`添加一些東西，及使用jQuery的指令碼：

```
{{#section 'head'}}
    <!-- we want Google to ignore this page -->
    <meta name="robots" content="noindex">
{{/section}}

<h1>Test Page</h1>
<p>We're testing some jQuery stuff.</p>

{{#section 'jquery'}}
    <script>
        $('document').ready(function () {
            $('h1').html('jQuery Works');
        });
    </script>
{{/section}}
```

版面放入section：

```
<!doctype html>
<html>
<head>
    <title>Meadowlark Travel</title>
    {{#if showTests}}
        <link rel="stylesheet" href="/vendor/mocha.css">
    {{/if}}
    {{{_sections.head}}}
    
</head>
<body>
    {{{body}}}
    <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
    {{{_sections.jquery}}}
</body>
</html>
```

### 將你的模板最佳化

你的模板就是網站的核心。良好的模板結構，會讓你節省開發時間、網站一致性，減少版面問題的藏身之處。

- 決定在一個專案中要使用多少模板：一般而言，越少越好，根據網頁一致性，會有一個報酬遞減點。
- 你的模板也是對抗跨瀏覽器相容性問題的第一道防線。

最佳入門之處：HTML5 Boilerplate。

### 用戶端Handlebars

如果你想要有動人的內容，可考慮使用handlebars的用戶端模板。可讓我們接收AJAX呼叫JSON資料結果，並將它格式化，以適應我們的網站。因此，它特別適合與第三方API通訊，它會回傳JSON，而不是為了適合你的網站而格式化的HTML。

在用戶端使用Handlebars之前，我們必須先載入Handlebars。我們可將Handlebars放在靜態的內容，或使用已經可用的CDN。第二種方法在views/nursery-rhyme.handlebars：

```
{{#section 'head'}}
    <script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.min.js"></script>
{{/section}}
```

現在我們需要某個可以放置模板的地方。方法之一是在HTML中使用既有的元素，最好是被隱藏的。你可以將你的HTML放在`<head>`的`<script>`元素來做到這點。一開始它看起來很怪，但它可以良好運作：

```
{{#section 'head'}}
    <script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.min.js"></script>

    <script id="nurseryRhymeTemplate" type="text/x-handlebars-template">
        Marry had a little <b>\{{animal}}</b>, its <b>\{{bodyPart}}</b>
        was <b>\{{adjective}}</b> as <b>\{{noun}}</b>.
    </script>
{{/section}}
```

注意，我們至少要轉譯這些大括號的其中一個；否則，伺服端視圖處理會試著進行轉換。

在我們使用模板前，必須編譯它：

```
{{#section 'jquery'}}
    <script>
        $(document).ready(function() {
            var nurseryRhymeTemplate = Handlebars.compile(
                    $('#nurseryRhymeTemplate').html());
        });
    </script>
{{/section}}
```

我們也需一個地方來放置已轉譯的模板。我們添加一對按鈕來進行測試：

```
<div id="nurseryRhyme">Click a button....</div>
<hr>
<button id="btnNurseryRhyme">Generate nursery rhyme</button>
<button id="btnNurseryRhymeAjax">Generate nursery rhyme from AJAX</button>
```

最後是呈現模板的程式碼：

```
{{#section 'jquery'}}
    <script>
        $(document).ready(function() {

            var nurseryRhymeTemplate = Handlebars.compile(
                    $('#nurseryRhymeTemplate').html());

            var $nurseryRhyme = $('#nurseryRhyme');

            $('#btnNurseryRhyme').on('click', function (evt) {
                evt.preventDefault();
                $nurseryRhyme.html(nurseryRhymeTemplate({
                    animal: 'basilisk',
                    bodyPart: 'tail',
                    adjective: 'sharp',
                    noun: 'a needle'
                }));
            });

            $('#btnNurseryRhymeAjax').on('click', function (evt) {
                evt.preventDefault();
                $.ajax('/data/nursery-rhyme', {
                    success: function (data) {
                        $nurseryRhyme.html(nurseryRhymeTemplate(data));
                    }
                });
            });

        });
    </script>
{{/section}}
```

以及我們童謠網頁的路由處理程式及AJAX呼叫：

```
app.get('/nursery-rhyme', function (req, res) {
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function (req, res) {
    res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck',
    });
});
```

**Handlebars.compile**會接收一個模板，回傳一個函式。那個函式會接收一個內容物件，並回傳一個已轉譯的字串。所以編輯模板之後，我們就有可重複使用的模板編譯器，讓我們可以像呼叫函式一樣呼叫。