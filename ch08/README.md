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