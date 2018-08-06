"use strict";
const q = require('q');

module.exports = function(n, arr, transformer, ignoreErrors) {
    var res = new Array(arr.length);
    var last = 0;
    var tranformOrFinish = function(runner, idx) {
        //console.log("runner " + runner + ", arr len " + arr.length + ", idx " + idx, arr[idx])
        if(idx >= arr.length) {
            return res;
        }
        return q(transformer(arr[idx]))
        .then((ret) => {
            res[idx] = ret;
            return tranformOrFinish(runner, last++);
        }, (err) => {
            if(ignoreErrors === true) {
                res[idx] = err;
            } else {
                last = arr.length;
                throw err;
            }
        });
    };

    var tasks = [];
    for(let i = 0; i < n && i < arr.length; i++) {
        tasks.push(tranformOrFinish(i, last++));
    }

    return q.all(tasks)
    .then(() => res);
};
