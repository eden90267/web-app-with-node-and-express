# chap20. 除錯

在本章中，我們要討論一些對Node與Express應用程式有效率地除錯的工具及技術。

## 除錯的第一原則

>我說了那麼多次，當你將所有不可能發生的事情排除在外，剩下的就算多麽讓人難以置信，也必定是真相？

—— Sir Authur Conan Doyle

第一及最重要的除錯原則是**排除**的程序。

排除有許多形式，以下是一些常見的做法：

- 有系統地將一個程式段落改成註解，或停用。
- 編寫可讓單元測試發現的程式碼，單元測試本身提供一種進行排除的框架。
- 分析網路流量來判斷問題出在用戶端還是伺服器端。
- 測試系統內一開始很類似的各個部分。
- 輸入之前可以正常動作的資料，並慢慢改變該項輸入的各個部分，直到問題出現為止。
- 使用版本控制回到正常時間，把一個時間當成一步，直到問題消失為止。
- “模仿”功能來排除複雜的子系統

之所以發生問題，往往是因為兩個元件以上的元件之間複雜地互動，排除或模仿任何元件，問題可能消失，但問題無法從任何單一元件身上排除。“排除”無法在正確的位置上亮起霓虹燈，但可協助縮小問題。

細心、有條理地使用，排除是最有效的方法。但排除元件，要思考元件如何影響整個系統。

## 利用REPL與主控台

## 使用Node的內建除錯程式

```
node debug meadowlark.js
```

Node除錯程式會建立它自己的Web伺服器來工作，可讓你控制被除錯的應用程式的執行。討論到Node Inspector，就會看到這種方法的實用。

在主控台除錯程式裡面，可輸入help看指令的清單。

- n(下一個)
- s(步進進入)
- o(步進離開)

指令列除錯程式，你應該不會經常使用它們。你一定比較喜歡使用圖形除錯器，如Node Inspector。

## Node Inspector

Node透過Web服務來公開它的除錯控制項，讓你有其他的選擇。特別是Danny Coates傑出的Node Inspector(現由StrongLoop管理)可讓你使用在用戶端除錯JavaScript程式的介面來除錯Node應用程式。

Node Inspector使用Chromium專案的Blink引擎，它也是Chrome的引擎。

```
sudo npm install -g node-inspector
```

接著背景執行它：

```
node-inspector&
```

接著你可以在除錯模式下啟動：

```
node --debug meadowlark
```

你有三個不同的應用程式在三個不同埠上執行

- 5858：你的app在5858埠公開它的除錯介面
- 8080：Node Inspector在8080埠執行，監聽5858

連結[http://127.0.0.1:8080/debug?port=5858](http://127.0.0.1:8080/debug?port=5858)，一探究竟。

最簡單使用方式：Sources選單設定**中斷點**。

一旦中斷點被執行到，你可以使用我們在指令列除錯程式中使用的那些指令：

- **恢復執行指令碼(F8)**

    不再步進執行程式碼，通常是看到想要的東西後，或想跳到下一個中斷點的時候使用。

- **步進到下一個函式呼叫(F10)**

    如果目前這行程式是在呼叫函式，除錯程式將不進去該程式。

- **步進執行下一個函式呼叫(F11)**

    這會進入函式裡面。

- **跳出目前的函式(Shift-F11)**

    這會執行你目前所在的函式的其餘部分，並在函式**呼叫方**的下一行繼續除錯。當你不小心跑到函式裡面，或已經看到你需要的資訊時，才會使用這個功能。
    
除了所有控制動作之外，你也可以操作主控台：那個主控台是在你的應用程式目前的環境下執行的。你可查看變數，甚至修改它們，或呼叫函式...。

右邊，最上面是watch expressions，可讓你定義的JavaScript表達式。可持續追蹤某個變數。會隨步進即時更新。

call stack：這裡顯示你所處的位置。call stack會列出所有函式。在Node這種極度非同步的世界，call stack可能會很難釐清與瞭解，特別是牽涉到非同步的功能。

範圍變數：目前範圍裡面的變數。

接下來是所有中斷點的清單。這其實只是一個筆記，按一下就會直接把你帶到那裡。

最後還有DOM、XHR與事件監聽程式中斷點。他們只適合在瀏覽器上執行的JavaScript使用。

有時你要找的是應用程式設定上的錯誤(例如，當你將中介軟體連結到Express)，可使用：

```
node --debug-brk meadowlark
```

除錯程式就會在應用程式前幾行就中斷執行，接下來你就可以步進執行。

進一步了解，可參考專案首頁：[https://github.com/node-inspector/node-inspector](https://github.com/node-inspector/node-inspector)。

## 對非同步函式除錯

```
console.log('Baa, baa, black sheep.');
fs.readFile('yes_sir_yes_sir.txt'function(err, data) {
    console.log('Have you any wool?');
    console.log(data);
});
console.log('Three bags full;');
```

中斷點的行數要搞清楚。

## Express除錯

有些時候，當你程式有問題，步進執行Express原始碼本身(or 第三方中介軟體)或許是這些問題的最佳除錯方式。

這裡快速介紹Express原始碼：

- **Express app建構**(*lib/express.js*、**function createApplication()**)

    這是你的Express app的生命起始之處，也是當你在程式中呼叫`var app = express();`時，所呼叫的函式。
    
- **Express app初始化**(*lib/application.js*、**app.defaultConfiguration**)

    這裡是Express初始化的地方，可看到Express啟動時所有的預設值。步進一次這裡會給你很大的幫助。

- **添加中介軟體**(*lib/application.js*、**app.use**)

    每次Express將中介軟體連結進來的時候，都會呼叫這個函式。

- **轉譯視圖**(*lib/application.js*、**app.render**)

    須針對視覺相關的問題進行除錯時。可看到視圖引擎是如何被選擇及呼叫的。

- **請求擴充**(*lib/request.js*)

    很稀疏且易於了解。Express加入請求物件的方法，大部分都是非常簡單方便的功能。

- **傳送回應**(*lib/response.js*、**res.send**)

    你建構回應(.send、.render、.json或.jsonp)的方式並不是很重要，它最後都會到達它的函式(.sendFile是例外)。所以這是放置中斷點的好地方。

- **回應擴充**(*lib/response.js*)

    res.send的內容有點豐富，但其他方法大部分都很簡單。你可將中斷點放在這些方法裡面，來查看你的app是如何回應請求的。

- **靜態中介軟體**(*node_modules/serve-static/index.js*、**function staticMiddleware**)

    想知道標頭如何因為靜態檔案的不同，而有不同設定，步進執行靜態中介軟體是有用的。

Express裡面很少中介軟體(靜態中介軟體與路由是較明顯的例外)。大部分的中介軟體其實都來自Connect。

Express 4.0已不再跟Connect綁在一起了，你必須另外安裝Connect，所以可在*node_module/connect*找到源碼。

- **期程中介軟體**(*node_modules/express-session/index.js*、**function session**)
- **紀錄程式中介軟體**(*node_modules/morgan/index.js*、*function logger*)
- **URL編碼內文解析**(*node_modules/body-parser/index.js*、**function urlencoded**)