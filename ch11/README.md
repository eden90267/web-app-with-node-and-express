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

### HTML Email內的圖像

雖然你可將圖像嵌入HTML email，但我非常不建議這麼做：它們會讓你的email訊息變大，而且這通常不會被視為良好的做法。你應該在Web服務器上製作想要在email使用的圖像，並在email裡面連結它。

你最好在靜態資產資料夾中，有一個email圖像專用的地方。你甚至應該要將網站及email使用的資料(例如你的日誌)分開：它會減少讓你的email版面產生不好的影響的機會。

在你的public中添加email。將想使用的圖像放進來。接下來，在你的email中可直接使用這些圖像：

```
<img src="//meadowlarktravel.com/email/logo.png" alt="Meadowlark Travel">
```

### 使用Views來傳送HTML Email

HTML Email的內文透過JavaScript字串傳送，是必須避免的做法。

幸運的是，可利用views來處理這件事。建立一個感謝網頁的視圖：views/cart-thank-you.handlebars：

```
<p>Thank you for booking your trip with Meadowlark Travel, {{cart.billing.name}}</p>
<p>Your reservation number is {{cart.number}}, and an email has been send to {{cart.billing.email}} for your records.</p>
```

接下來，建立一個email模板。下載HTML Email Boilerplate，並放入views/email/cart-thank-you.handlebars

```
<!-- ***************************************************
********************************************************

HOW TO USE: Use these code examples as a guideline for formatting your HTML email. You may want to create your own template based on these snippets or just pick and choose the ones that fix your specific rendering issue(s). There are two main areas in the template: 1. The header (head) area of the document. You will find global styles, where indicated, to move inline. 2. The body section contains more specific fixes and guidance to use where needed in your design.

DO NOT COPY OVER COMMENTS AND INSTRUCTIONS WITH THE CODE to your message or risk spam box banishment :).

It is important to note that sometimes the styles in the header area should not be or don't need to be brought inline. Those instances will be marked accordingly in the comments.

********************************************************
**************************************************** -->

<!-- Using the xHTML doctype is a good practice when sending HTML email. While not the only doctype you can use, it seems to have the least inconsistencies. For more information on which one may work best for you, check out the resources below.

UPDATED: Now using xHTML strict based on the fact that gmail and hotmail uses it.  Find out more about that, and another great boilerplate, here: http://www.emailology.org/#1

More info/Reference on doctypes in email:
Campaign Monitor - http://www.campaignmonitor.com/blog/post/3317/correct-doctype-to-use-in-html-email/
Email on Acid - http://www.emailonacid.com/blog/details/C18/doctype_-_the_black_sheep_of_html_email_design
-->

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Meadowlark Travel Order Confirmation</title>
    <style type="text/css">

        /***********
        Originally based on The MailChimp Reset from Fabio Carneiro, MailChimp User Experience Design
        More info and templates on Github: https://github.com/mailchimp/Email-Blueprints
        http://www.mailchimp.com &amp; http://www.fabio-carneiro.com

        INLINE: Yes.
        ***********/
        /* Client-specific Styles */
        #outlook a {padding:0;} /* Force Outlook to provide a "view in browser" menu link. */
        body{width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0;}
        /* Prevent Webkit and Windows Mobile platforms from changing default font sizes, while not breaking desktop design. */
        .ExternalClass {width:100%;} /* Force Hotmail to display emails at full width */
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;} /* Force Hotmail to display normal line spacing.  More on that: http://www.emailonacid.com/forum/viewthread/43/ */
        #backgroundTable {margin:0; padding:0; width:100% !important; line-height: 100% !important;}
        /* End reset */

        /* Some sensible defaults for images
        1. "-ms-interpolation-mode: bicubic" works to help ie properly resize images in IE. (if you are resizing them using the width and height attributes)
        2. "border:none" removes border when linking images.
        3. Updated the common Gmail/Hotmail image display fix: Gmail and Hotmail unwantedly adds in an extra space below images when using non IE browsers. You may not always want all of your images to be block elements. Apply the "image_fix" class to any image you need to fix.

        Bring inline: Yes.
        */
        img {outline:none; text-decoration:none; -ms-interpolation-mode: bicubic;}
        a img {border:none;}
        .image_fix {display:block;}

        /** Yahoo paragraph fix: removes the proper spacing or the paragraph (p) tag. To correct we set the top/bottom margin to 1em in the head of the document. Simple fix with little effect on other styling. NOTE: It is also common to use two breaks instead of the paragraph tag but I think this way is cleaner and more semantic. NOTE: This example recommends 1em. More info on setting web defaults: http://www.w3.org/TR/CSS21/sample.html or http://meiert.com/en/blog/20070922/user-agent-style-sheets/

        Bring inline: Yes.
        **/
        p {margin: 1em 0;}

        /** Hotmail header color reset: Hotmail replaces your header color styles with a green color on H2, H3, H4, H5, and H6 tags. In this example, the color is reset to black for a non-linked header, blue for a linked header, red for an active header (limited support), and purple for a visited header (limited support).  Replace with your choice of color. The !important is really what is overriding Hotmail's styling. Hotmail also sets the H1 and H2 tags to the same size.

        Bring inline: Yes.
        **/
        h1, h2, h3, h4, h5, h6 {color: black !important;}

        h1 a, h2 a, h3 a, h4 a, h5 a, h6 a {color: blue !important;}

        h1 a:active, h2 a:active,  h3 a:active, h4 a:active, h5 a:active, h6 a:active {
            color: red !important; /* Preferably not the same color as the normal header link color.  There is limited support for psuedo classes in email clients, this was added just for good measure. */
        }

        h1 a:visited, h2 a:visited,  h3 a:visited, h4 a:visited, h5 a:visited, h6 a:visited {
            color: purple !important; /* Preferably not the same color as the normal header link color. There is limited support for psuedo classes in email clients, this was added just for good measure. */
        }

        /** Outlook 07, 10 Padding issue: These "newer" versions of Outlook add some padding around table cells potentially throwing off your perfectly pixeled table.  The issue can cause added space and also throw off borders completely.  Use this fix in your header or inline to safely fix your table woes.

        More info: http://www.ianhoar.com/2008/04/29/outlook-2007-borders-and-1px-padding-on-table-cells/
        http://www.campaignmonitor.com/blog/post/3392/1px-borders-padding-on-table-cells-in-outlook-07/

        H/T @edmelly

        Bring inline: No.
        **/
        table td {border-collapse: collapse;}

        /** Remove spacing around Outlook 07, 10 tables

        More info : http://www.campaignmonitor.com/blog/post/3694/removing-spacing-from-around-tables-in-outlook-2007-and-2010/

        Bring inline: Yes
        **/
        table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }

        /* Styling your links has become much simpler with the new Yahoo.  In fact, it falls in line with the main credo of styling in email, bring your styles inline.  Your link colors will be uniform across clients when brought inline.

        Bring inline: Yes. */
        a {color: orange;}

        /* Or to go the gold star route...
        a:link { color: orange; }
        a:visited { color: blue; }
        a:hover { color: green; }
        */

        /***************************************************
        ****************************************************
        MOBILE TARGETING

        Use @media queries with care.  You should not bring these styles inline -- so it's recommended to apply them AFTER you bring the other stlying inline.

        Note: test carefully with Yahoo.
        Note 2: Don't bring anything below this line inline.
        ****************************************************
        ***************************************************/

        /* NOTE: To properly use @media queries and play nice with yahoo mail, use attribute selectors in place of class, id declarations.
        table[class=classname]
        Read more: http://www.campaignmonitor.com/blog/post/3457/media-query-issues-in-yahoo-mail-mobile-email/
        */
        @media only screen and (max-device-width: 480px) {

            /* A nice and clean way to target phone numbers you want clickable and avoid a mobile phone from linking other numbers that look like, but are not phone numbers.  Use these two blocks of code to "unstyle" any numbers that may be linked.  The second block gives you a class to apply with a span tag to the numbers you would like linked and styled.

            Inspired by Campaign Monitor's article on using phone numbers in email: http://www.campaignmonitor.com/blog/post/3571/using-phone-numbers-in-html-email/.

            Step 1 (Step 2: line 224)
            */
            a[href^="tel"], a[href^="sms"] {
                text-decoration: none;
                color: black; /* or whatever your want */
                pointer-events: none;
                cursor: default;
            }

            .mobile_link a[href^="tel"], .mobile_link a[href^="sms"] {
                text-decoration: default;
                color: orange !important; /* or whatever your want */
                pointer-events: auto;
                cursor: default;
            }
        }

        /* More Specific Targeting */

        @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
            /* You guessed it, ipad (tablets, smaller screens, etc) */

            /* Step 1a: Repeating for the iPad */
            a[href^="tel"], a[href^="sms"] {
                text-decoration: none;
                color: blue; /* or whatever your want */
                pointer-events: none;
                cursor: default;
            }

            .mobile_link a[href^="tel"], .mobile_link a[href^="sms"] {
                text-decoration: default;
                color: orange !important;
                pointer-events: auto;
                cursor: default;
            }
        }

        @media only screen and (-webkit-min-device-pixel-ratio: 2) {
            /* Put your iPhone 4g styles in here */
        }

        /* Following Android targeting from:
        http://developer.android.com/guide/webapps/targeting.html
        http://pugetworks.com/2011/04/css-media-queries-for-targeting-different-mobile-devices/  */
        @media only screen and (-webkit-device-pixel-ratio:.75){
            /* Put CSS for low density (ldpi) Android layouts in here */
        }
        @media only screen and (-webkit-device-pixel-ratio:1){
            /* Put CSS for medium density (mdpi) Android layouts in here */
        }
        @media only screen and (-webkit-device-pixel-ratio:1.5){
            /* Put CSS for high density (hdpi) Android layouts in here */
        }
        /* end Android targeting */
    </style>

    <!-- Targeting Windows Mobile -->
    <!--[if IEMobile 7]>
    <style type="text/css">

    </style>
    <![endif]-->

    <!-- ***********************************************
    ****************************************************
    END MOBILE TARGETING
    ****************************************************
    ************************************************ -->

    <!--[if gte mso 9]>
    <style>
        /* Target Outlook 2007 and 2010 */
    </style>
    <![endif]-->
</head>
<body>
<!-- Wrapper/Container Table: Use a wrapper table to control the width and the background color consistently of your email. Use this approach instead of setting attributes on the body tag. -->
<table cellpadding="0" cellspacing="0" border="0" id="backgroundTable">
    <tr>
        <td>

            <!-- Tables are the most common way to format your email consistently. Set your table widths inside cells and in most cases reset cellpadding, cellspacing, and border to zero. Use nested tables as a way to space effectively in your message. -->
            <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                    <td width="200" valign="top">
                        <img class="image_fix" src="http://meadowlarktravel.com/email/logo.png" alt="Meadowlark Travel"
                             title="Meadowlark Travel" width="180" height="220"/>
                    </td>
                    <td width="200" valign="top">
                        <p>Thank you for booking your trip with Meadowlark Travel, {{cart.billing.name}}.</p>
                        <p>Your reservation number is {{cart.number}}.</p>
                    </td>
                    <td width="200" valign="top">
                        Problems with your reservation?  Contact Meadowlark Travel at <span class="mobile_link">555-555-0123</span>.
                    </td>
                </tr>
            </table>

            <!-- End example table -->

        </td>
    </tr>
</table>
<!-- End of wrapper table -->
</body>
</html>
```

現在可為購物車“感謝”網站建立一個路由：

```
app.post('/cart/checkout', function (req, res) {
    var cart = req.session.cart;
    if (!cart) next(new Error('Cart does not exist'));
    var name = req.body.name || '', email = req.body.email || '';
    // 輸入驗證
    if (!email.match(VALID_EMAIL_REGEX)) {
        return res.next(new Error('Invalid email address.'));
    }
    // 指定隨機的購物車ID，通常我們會在這裡使用資料庫ID
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
        name: name,
        email: email,
    };
    res.render('email/cart-thank-you', {
        layout: null,
        cart: cart
    }, function (err, html) {
        if (err) console.log('error in email template');
        mailTransport.sendMail({
            from: '"Meadowlark Travel": info@meadowlarktravel.com',
            to: cart.billing.email,
            subject: 'Thank you for Book your Trip with Meadowlark',
            html: html,
            generateTextFromHtml: true
        }, function (err) {
            if (err) console.log('Unable to send confirmation: ' + err.stack);
        });
    });
    res.render('cart-thank-you', {cart: cart});
});
```

我們呼叫res.render兩次。在這情況下，我們避開第一次呼叫的轉譯程序：注意我們提供了一個回呼，這麼做可避免視圖被轉譯到瀏覽器上。相反地，回呼會在參數html：接收被轉譯的視圖，我們只要使用那個被轉譯的HTML並傳送email！我們指定layout: null來避免版面配置檔案被使用，因為他們全都在email模板裡面。最後，我們再次呼叫res.render。這一次，一如往常，結果會被轉譯到HTML回應。

### 封裝Email功能

如果你的網站大量使用email，或許會想要封裝email功能。*lib/email.js*：

```
/**
 * Created by eden90267 on 2017/6/9.
 */
var nodemailer = require('nodemailer');

module.exports = function (credentials) {
    var mailTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: credentials.gmail.user,
            pass: credentials.gmail.password
        }
    });
    var from = '"Meadowlark Travel" <info@meadowlarktravel.com>';
    var errorRecipient = 'eden90267@gmail.com';

    return {
        send: function (to, subj, body) {
            mailTransport.sendMail({
                from: from,
                to: to,
                subject: subj,
                html: body,
                generateTextFromHtml: true
            }, function (err) {
                if (err) console.error('Unable to send email: ' + err);
            });
        },
        emailError: function (message, filename, exception) {
            var body = '<h1>Meadowlark Travel Site Error</h1>' + 'message:<br><pre>' + message + '</pre><br>';
            if (exception) body += 'exception:<br><pre>' + exception + '</pre><br>';
            if (filename) body += 'filename:<br><pre>' + filename + '</pre>';
            mailTransport.sendMail({
                from: from,
                to: errorRecipient,
                subject: 'Meadowlark Travel Site Error',
                html: body,
                generateTextFromHtml: true
            }, function (err) {
                if (err) console.error('Unable to send email: ' + err);
            });
        },
    };
};
```

要傳送email：

```
var emailService = require('./lib/email')(credentials);

emailService.send('eden90267@gmail.com', 'Hood River tour on sale today!', 'Get \'em white they\'re hot!');
```

## 把Email當成網站監控工具

網站發生錯誤時，先用email寄給你求救訊息：

```
if (err) {
    email.sendError('the widget broke down!', __filename);
}

// 或

try {
    // 在這裡私下處理一些事情
} catch (ex) {
    email.sendError('the widget broke down!', __filename, ex);
    // ...顯示錯誤訊息給使用者
}
```