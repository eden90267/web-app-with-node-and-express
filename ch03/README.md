# chap03. 使用Express來節省時間

## 鷹架

借用了Ruby on Rails的做法，也就是所謂的“樣板”程式。自動產生初步的專案骨架。

Express提供一個公用程式，可產生鷹架來開始你的Express專案。

以下兩點不足以推薦：

1. 無法支援個人選擇的樣板化語言(Handlebars)
2. 無法遵循個人喜歡的名稱格式

這裡不會使用鷹架公用程式。

這裡推薦傑出的HTML5 Boilerplate，它會為HTML5網站製作一個巨大的空白版面。可產生自訂的組建版本。自訂組建的選項包括Twitter Bootstrap。

## 初始步驟

`app.get`是添加路由的方法。這個方法有兩個參數：

- 路徑
- 函式

app.VERB