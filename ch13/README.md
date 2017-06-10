# chap13. 持久保存

此章，會將焦點放在文件資料庫

## 檔案系統持久保存

“平面檔案”(平面代表檔案沒有內在結構，它只是一個位元組序列)。

無法處理擴展的問題，除非所有伺服器都可以存取同一個共用的檔案系統。

沒有內在結構，定位、搜尋、篩選資料的重擔將會由你的應用程式來承擔。

所以你應該使用資料庫來儲存資料，而不是檔案系統。除非你要存二進位檔案：圖片、音訊檔或視訊檔。資料庫也可以處理這類型檔案，但它們的效率不太可能會比檔案系統還要好。

如果需儲存二進位資料，記得檔案系統存儲仍有擴展上的問題，如果主機不能處理共用的檔案系統，就必須考慮將二進位檔案存在資料庫裡面，或雲端式存儲服務(AWS S3或Microsoft Azure Storage)。

來看Node的檔案系統支援。填寫處理表單的處理程式：

```
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath) {
    // 待辦...稍後加入
}

app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
        if (err) {
            res.session.flash = {
                type: 'danger',
                intro: 'Oops!',
                message: 'There was an error processing your submission. Please try again.'
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo;
        var dir = vacationPhotoDir + '/' + Date.now();
        var path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Good luck',
            message: 'You have been entered into the contest.'
        };
        return res.redirect(303, '/contest/vacation-photo/entries');
    });
});
```