# chap04. 整理

## 版本控制

版本控制的優點：

- 文件化
- 署名
- 實驗

## npm套件

package.json依賴關係

## 專案中繼資料

package.json的專案名稱、作者、認證資訊等等。

中繼資料另一個部分是README.md

## Node模組

Node模組，顧名思義，提供一個機制來進行模組化及封裝。npm套件提供一個標準方案來儲存、版本控制及參考專案(這不只限於模組)。

```
var express = require('express');
```

require是一個匯入模組的Node函式。預設情況下，Node會在node_modules目錄中尋找模組。但Node也有提供機制讓你建構自己的模組：

建立一個目錄儲存模組，並建立一個檔案，`lib/fortune.js`：

```
/**
 * Created by eden90267 on 2017/6/3.
 */
var fortuneCookies = [
    "Conquer your fears or they will conquer you.",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple.",
];

exports.getFortune = function () {
    var idx = Math.floor(Math.random() * fortuneCookies.length);
    return fortuneCookies[idx];
};
```

全域變數exports的使用方式：如果你想要讓某個東西可在模組外被看到，就必須將它加到exports。getFortuned可在模組外被使用，但fortuneCookies陣列**被完全隱藏**。

```
var fortune = require('./lib/fortune');
```

在模組名稱前加入./。這告訴Node不要尋找node_modules目錄中的模組，

```
app.get('/about', function (req, res) {
    res.render('about', {fortune: fortune.getFortune()});
});
```

模組是非常強大且簡單的功能封裝方式。
