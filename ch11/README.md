# chap11. 傳送Email

Email是網站與全世界通訊的主要方法之一。從註冊使用者到密碼重置到促銷email到問題通知。

Node與Express都沒有內建方法可傳送email，需要第三方模組：建議套件是Andris Reinman的Nodemailer([https://www.npmjs.com/package/nodemailer](https://www.npmjs.com/package/nodemailer))，討論Node-mailer設定之前，先來了解一些email的基礎知識。

## SMTP、MSA與MTA

傳送email使用的語言是簡易郵件傳輸通訊協定(Simple Mail Transfer Protocol)。雖然你也可以使用SMTP來將email直接傳給收件者的email伺服器，但這通常是很糟糕的作法。除非你是位"受信任的傳輸者"，如Google或Yahoo!否則你的email很有可能會直接丟到垃圾郵件箱裡。你最好使用Mail Submission Agent(MSA)，它會透過受信任的通道來傳遞email，減少你的email被標記為垃圾的機會。MSA除了可以確保你的email送達外，也可以處理一些干擾，例如臨時退回及中斷的email。方程式最後的一個部分是郵件傳輸代理程式(MTA)，這是基本將email傳送到最終目的地服務。對這裡而言，MSA、MTA及"SMTP伺服器"基本上是相同的。

所以你需要存取MSA，最入門方式是使用一個免費的email服務，例如Gmail、Hotmail、Yahoo!。這是短期解決方案，它除了有限制外(例如Gmail 24小時之內只容許500封email，且每一封不得超過100位收件者)，也會公開你私人email。雖可指定傳送者的顯示方式，例如joe@meadowlarktravel.com，但只要瞄一下email標頭，就可以看到它是由joe@gmail.com傳送的，這說不上是一種專業的做法。當你準備上市時，可以切換專業的MSA，例如Sendgrid或Amazon Simple Email Service(SES)。

如果你為某個機構工作，機構本身有一個MSA，你可以聯繫你的IT部門，詢問他們是否有SMTP中繼器可自動傳送email。

## 接收Email

大部分網站只需要傳送email的能力，例如密碼重設指令及促銷email。但有些應用程式也需要接收email。典型例子是問題追蹤系統，它會在某人更新問題狀況時傳送email：如果你回應那封email，問題就會被自動更新成你的回應。

接收email牽涉很多領域，這裡不會討論。如果這是你要的功能，可參考Andris Reinman的SimpleSMTP([https://github.com/andris9/simplesmtp](https://github.com/andris9/simplesmtp))或Haraka([http://haraka.github.io/](http://haraka.github.io/))。

## Email標頭

Email訊息由兩部分組成：標頭與內文(很像HTTP請求)。標頭包含關於email的資訊：誰寄的?寄到哪裡?它接收的日期、主題及其他。這是email應用程式通常顯示給使用者看的標頭，還有許多其他標頭。包括email如何給你的，每一封email經過的伺服器與MTA。

有些標頭可讓傳送方任意設定，例如"寄件"地址。但不應該濫用它。

但你所寄送的email**必須**有"寄件"地址。當你傳送自動email，有時會產生問題，因此你經常會看到email的回傳地址長得像DO NOT REPLY<do-not-reply@meadowlarktravel.com>。你可採用這種方法，或使用來自諸如Meadowlark Travel<info@meadowlarktravel.com>這種地址的自動email，就應該準備回應被寄到info@meadowlarktravel.com的email。

## Email格式

email格式與編碼是一種可怕、混亂的技術與標準。還好，我們不需要去處理這些複雜問題：Nodemailer會幫我們處理這件事。

對你而言，現在最重要的事情是，你的email可以是純文字(Unicode)或HTML。

email格式化為HTML通常是非常安全的。

Nodemailer支援一種捷徑可以從HTML自動產生純文字版本。

## HTML Email

HTML email是一個可以用一本書來討論的主題。它不像你在網站中編寫HTML一樣簡單。大部分的郵件用戶端只支援一小部分的HTML。大多數情況下，你必須用1996年的方式來編寫HTML，尤其是，你必須回去使用表格來做版面設計。

Email的HTML相容性比browser還要更糟。

建議閱讀MailChimp編寫HTML email的好文章：[http://kb.mailchimp.com/campaigns/ways-to-build/about-html-email](http://kb.mailchimp.com/campaigns/ways-to-build/about-html-email)。

接著是真正為你節省時間的好東西：HTML Email Boilerplate([http://htmlemailboilerplate.com](http://htmlemailboilerplate.com))。它是一個編寫良好、經過嚴格測試的HTML email模板。

多種email用戶端測試你的內文不會爆炸：Litmus([https://litmus.com/email-testing](https://litmus.com/email-testing))，但每個月的收費是$80起跳，並不是廉價服務，但你要傳送許多促銷郵件，它是無可取代的。

如果你格式是普通的，就不須用到Litmus這種昂貴的測試服務。如果你堅持使用諸如頁首、粗體/斜體文字、垂直尺規，及一些圖像連結，就沒有什麼問題。

## Nodemailer

安裝Nodemailer套件：

```
npm install --save nodemailer
```

接下來需要nodemailer套件，並建立一個Nodemailer實例(按Nodemailer的說法，就是一個"傳輸")
:

```
var nodemailer = require('nodemailer');

var credentials = require('./credentials');

var mailTransport = nodemailer.createTransport('SMTP', {
    service: 'Gmail',
    auth: {
        user: credentials.gmail.user,
        pass: credentials.gmail.password
    }
});
```

憑證模組credentials.js須更新：

```
module.exports = {
    cookieSecret: 'you cookie secret goes here',
    gmail: {
        user: 'your gmail username',
        password: 'your gmail password'
    }
}
```

Nodemailer為最受歡迎的email服務提供捷徑：Gmail、Hotmail、iCloud、Yahoo!還有許多其他服務。如果你的MSA沒有在名單中，或你需要直接連結到SMTP伺服器，它也提供支援：

```
var mailTransport = nodemailer.createTransport('SMTP', {
    host: 'smtp.meadowlarktravel.com',
    secureConnection: true, //
    port: 465,
    auth: {
        user: credentials.meadowlarkSmtp.user,
        pass: credentials.meadowlarkSmtp.password,
    }
});
```

## 傳送Mail

只傳送文字郵件給一位收件者開始：

```
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'eden90267@gmail.com',
    subject: 'Your Meadowlark Travel Tour',
    text: 'Thank you for booking your trip with Meadowlark Travel.  We look forward to your visit!',
}, function (err) {
    if (err) console.error('Unable to send email: ' + err);
});
```

這裡有處理錯誤，但要了解的重點在於，沒有錯誤不一定代表你的email被成功地傳到**收件者**：回呼的error參數只有在與MSA的通訊出現問題才會被設定(網路或身分驗證錯誤)。如果對MSA不能傳送email(不正確的email地址或不明的使用者)，你會收到一封MSA帳號傳送的失敗email。

如果你要讓系統自動判斷email是否成功地傳遞，方法有很多。其中一種是**使用錯誤回報的MSA**。Amazon的Simple Email Service(SES)是其中一種服務，它是使用Simple Notification Service(SNS)來傳送email彈出提示，你可以設定它來呼叫在你的網站上執行的Web服務，另一個選項是使用直接傳遞，繞過MSA。不過不建議直接傳遞，因為它是個複雜的做法，而且你的email很有可能會被標記成垃圾郵件。這些做法都不是很簡單，因此它超出這裡的範圍。

## 傳送郵件給多個收件者

Nodemailer支援傳送給多個收件者，只要以逗號分隔收件者即可：

```
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'eden90267@gmail.com, "Eden Liu" <eden90267@yahoo.com.tw>, eden_90267@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    text: 'Thank you for booking your trip with Meadowlark Travel.  We look forward to your visit!',
}, function (err) {
    if (err) console.error('Unable to send email: ' + err);
});
```

在這範例中，混合純email地址(eden90267@gmail.com)與指定收件者名字的email地址("Eden Liu" <eden90267@yahoo.com.tw>)，這是合法的語法。

傳送email給多人，你必須注意MSA的限制。就算是最強健的服務，例如SendGrid，都建議限制收件者的數量(SendGrid建議每封email不要超過1000人)。

```
// largeRecipientList是一個email地址的陣列
var recipientLimit = 100;
for(let i = 0; i < largeRecipientList.length/recipientLimit; i++) {
    mailTransport.sendMail({
        from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
        to: largeRecipientList.slice(i * recipientLimit, i * (recipientLimit + 1)).join(','),
        subject: 'Your Meadowlark Travel Tour',
        text: 'Thank you for booking your trip with Meadowlark Travel.  We look forward to your visit!',
    }, function (err) {
        if (err) console.error('Unable to send email: ' + err);
    });
}
```

## 較佳的大量Email選項

雖然你肯定可使用Nodemailer與適當的MSA來傳送大量的email，但要考慮到的是取消訂閱的方式給使用者，維護訂閱名單。在這領域中，別重複造輪。MailChimp與Campaign Monitor等服務已經提供你需要的東西了，包括監控你的email行銷活動成功與否的強大工具。它們非常好用，建議使用。

## 傳送HTML Email

Nodemailer可讓你傳送同一封email的HTML及純文字版本，讓email用戶端選擇要顯示哪個版本(通常是HTML):

```
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'eden90267@gmail.com, "Eden Liu" <eden90267@yahoo.com.tw>, eden_90267@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with Meadowlark Travel. <b>We look forward to your visit!</b></p>',
    text: 'Thank you for booking your trip with Meadowlark Travel.  We look forward to your visit!'
}, function (err) {
    if (err) console.error('Unable to send email: ' + err);
});
```

這很費工，我也不建議這種方式。幸運的是，如果你要求，Nodemailer會自動將你的HTML轉換成純文字：

```
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'eden90267@gmail.com, "Eden Liu" <eden90267@yahoo.com.tw>, eden_90267@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with Meadowlark Travel. <b>We look forward to your visit!</b></p>',
    generateTextFromHtml: true
}, function (err) {
    if (err) console.error('Unable to send email: ' + err);
});
```