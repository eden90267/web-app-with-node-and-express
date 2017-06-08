/**
 * Created by eden_liu on 2017/6/8.
 */
const nodemailer = require('nodemailer');

const credentials = require('./credentials');

var mailTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: credentials.gmail.user,
        pass: credentials.gmail.password
    }
});

// var mailTransport = nodemailer.createTransport('SMTP', {
//     host: 'smtp.meadowlarktravel.com',
//     secureConnection: true, //
//     port: 465,
//     auth: {
//         user: credentials.meadowlarkSmtp.user,
//         pass: credentials.meadowlarkSmtp.password,
//     }
// });

// largeRecipientList是一個email地址的陣列
// var recipientLimit = 100;
// for(let i = 0; i < largeRecipientList.length/recipientLimit; i++) {
//     mailTransport.sendMail({
//         from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
//         to: largeRecipientList.slice(i * recipientLimit, i * (recipientLimit + 1)).join(','),
//         subject: 'Your Meadowlark Travel Tour',
//         text: 'Thank you for booking your trip with Meadowlark Travel.  We look forward to your visit!',
//     }, function (err) {
//         if (err) console.error('Unable to send email: ' + err);
//     });
// }

mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'eden90267@gmail.com, "Eden Liu" <eden90267@yahoo.com.tw>, eden_90267@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with Meadowlark Travel. <b>We look forward to your visit!</b></p>',
    generateTextFromHtml: true
}, function (err) {
    if (err) console.error('Unable to send email: ' + err);
});