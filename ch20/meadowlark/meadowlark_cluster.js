/**
 * Created by eden90267 on 2017/6/9.
 */
var cluster = require('cluster');

function startWorker() {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.id);
}

if (cluster.isMaster) {
    require('os').cpus().forEach(function () {
        startWorker();
    });

    // 記錄所有未連結的worker，如果worker中斷連線，它就應該退出，所以我們會等待退出事件

    // 生出一個新的worker來取代它
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster.', worker.id);
    });

    // 當worker死掉的時候(結束)，建立一個worker來取代它
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.id, code, signal);
        startWorker();
    });
} else {

    // 在worker開始我們的app，見meadowlark.js
    require('./meadowlark')();

}