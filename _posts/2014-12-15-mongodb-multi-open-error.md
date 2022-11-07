---
layout: post
title: 解决 mongodb 多次 open 报错
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2014-12-15 18:54:23+0800
sync_link: https://xwenliang.cn/p/548aae4aea5f23ed64000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


用过 mongodb 的同学们可能都遇到过，mongodb 在 open 之后没来的及 close, 再进行一次 open 操作将会导致报错，整个 nodejs 进程都死掉了。如下图：  

![IMAGE]({{ site.gallery_prefix }}2022-04-30-21dff08e39.jpg)  

解决方法大致有以下几种：  

1. 使用 [Mongoose](http://mongoosejs.com/)  

2. open 之后，就不再 close  

以上两种解决方案，对于我这个强迫症患者来说，都有问题。前者太霸道，后者有不确定因素。  

一次偶然的机会，发现了 mongodb.openCalled, 顾名思义，如果 mongodb 已经 open 了，它的值为 true:  

```javascript
var mongodb = require('mongodb'),
    Db = mongodb.Db,
    Connection = mongodb.Connection,
    Server = mongodb.Server,
    mongo = new Db(某db, new Server(host, Connection.DEFAULT_PORT, {safe: true}), {w: 1}),
    db = {};
    
db.open = function(callback){
    if(mongo.openCalled){
        callback(null, mongo);
    }
    else{
        mongo.open(callback);
    }
};

db.get = function(table, conditions, callback){
    this.open(function(err, db){
        if(err){
            mongo.close();
            return console.log(err);
        }
        db.collection(table, function(err, collection){
            if(err){
                mongo.close();
            }
            var sort = conditions['sort'] || null,
                limit = conditions['limit'] || null;
            delete conditions['sort'];
            delete conditions['limit'];
            collection.find(conditions).sort(sort).limit(limit).toArray(function(err, result){
                mongo.close();
                callback(err, result);
            });
        });
    });
};
```

