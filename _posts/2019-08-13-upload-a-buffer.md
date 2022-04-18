---
layout: post
title: buffer 上传中遇到的问题
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-08-13 17:58:38+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


最近在做的这个构建工具中，有个打包上传的功能，共分为两步：  
1. 使用 `archiver` 将文件打包成 zip 格式文件包  
2. 将 zip 包上传至指定地址  

第一步最开始的时候做成了先本地生成一个临时文件，然后使用 `request` 模块上传:  
```javascript
// 简单代码，未做任何异常捕获和处理
const archiver = require('archiver');
const request = require('request');

const archive = archiver('zip', {
    zlib: { level: 9 }
});
const filePath = path.resolve(__dirname, `./__temp__${Date.now()}.zip`);
const file = fs.createWriteStream(filePath);
file.on('close', () => {
    request.post({
        url: '{url_to_post}',
        formData: {
            my_file: fs.createReadStream(filePath),
            my_field: 'abc'
        }
    });
});
archive.pipe(file);
archive.directory('{target_directory}', false);
archive.finalize();
```

一直觉得先写个文件到磁盘，再上传这个文件有点傻，因为上传完毕还要再删掉它，并且即使捕获了程序异常退出、上传失败、网络不通等等异常还是会因为一些原因删不掉，比如突然断电、程序异常崩溃等(倒是有个猥琐的手段，写到一个不容易察觉的位置以`.`开头命名)  

为了解决这个问题，我们打算重构它，`archiver` 打包完毕后直接转成 buffer, 然后通过接口上传：  
```javascript
// 简单代码，未做任何异常捕获和处理
const { Writable } = require('stream');
const archiver = require('archiver');
const request = require('request');

new Promise((resolve, reject) => {
    const converter = new Writable();
    converter.data = [];
    converter._write = function(chunk, encoding, callback){
        this.data.push(chunk);
        callback();
    };
    converter.on('finish', () => {
        resolve(Buffer.concat(this.data));
    });
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(converter);
    archive.directory('{target_directory}', false);
    archive.finalize();
}).then(buff => {
    request.post({
        url: '{url_to_post}',
        formData: {
            my_file: buff,
            my_field: 'abc'
        }
    });
});
```

后端接口是使用了 express + multer 来接收这个上传请求的：  
```javascript
// express@4.16.4
// multer@1.4.2
// 示例代码
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: './upload/' });
app.post('/file', upload.single('my_file'), (req, res, next) => {
    console.log(req.file);//undefined
});
```

然后却发现 `req.file` 是 `undefined`, 查看 multer 源码发现，他引入了 [busboy](https://github.com/mscdex/busboy)(有趣的名字) 作为其 req 的解析器，经过断点调试发现，我们的请求确实会走到 busboy 的 file 事件中，但是由于我们发送的是 buffer 所以不会有文件名字 filename 这种东西，然后 multer 对此也并未做任何处理，直接认为没有文件内容：
```javascript
// multer@1.4.2
// multer/lib/make-middleware.js#L95-L98
   
// handle files
busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
    // don't attach to the files object, if there is no file
    if (!filename) return fileStream.resume()
    ...
```
所以我们的 `req.file` 才会是 `undefined`, 那为什么 busboy 却能触发这个 file 事件呢：  
```javascript
// busboy@0.2.14
// busboy/lib/typs/multipart.js#L174-L213

var onData,
    onEnd;
if (contype === 'application/octet-stream' || filename !== undefined) {
// file/binary field
...
boy.emit('file', fieldname, file, filename, encoding, contype);
```
只要你发的请求 `Content-Type` 是 `application/octet-stream` 或者能解析出 `filename` 那就会触发 file 事件，所以结论是，如果你使用 multer 来接收 buffer, 将得不到任何内容。  

所以我们怎么才能接收到这个 buffer 呢？只使用 Vanilla JS 是肯定能得到的，只要监听 req 的 data 事件，然后拼接即可：  
```javascript
// 简单代码，未做任何异常捕获和处理
const http = require('http');

http.createServer((req, res) => {
    const postData = [];
    req.on('data', chunk => {
        postData.push(chunk);
    }).on('end', () => {
        const buffer = Buffer.concat(postData);
        res.end(buffer.toString('utf8'));
    });
}).listen(3000);
```

使用 express 该如何接收呢？所幸 data 事件还在(如果用了其他中间件来处理 req 就不能保证了)，接收代码和上面 createServer 的函数一致。  

让我们回到正题，由于后端已经是个稳定的服务，不那么方便修改，所以我们要在发送阶段兼容成它能正常解析的格式。那么使用 request 模块通过 formData 发送一个文件通过 `fs.createReadStream` 生成的 stream 和直接发送这个文件的 buffer 有什么区别呢？后端接到的内容又有什么区别？

对于发送端来说没有区别，都是个 multipart/form-data, 对于接收端来说，我们还是看看实际收到的内容对比吧：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-19-1d331e163d.jpg)  

我们发现只是少了个 `filename="aaa.zip"`, 同时 `Content-Type` 也有一点变化，那么 multipart/form-data 的数据格式规范到底是什么样的呢？具体可以看这里：[RFC7578](https://tools.ietf.org/html/rfc7578)  
> For form data that represents the content of a file, a name for the file SHOULD be supplied as well, by using a "filename" parameter of the Content-Disposition header field. 

规范表明，如果上传的内容代表着一个文件，那么 filename 也是要提供的。所以我们的文件 buffer 是不能通过强行塞给 request 的 formData 中的字段来发送的，这样会导致 filename 的丢失。所以我们要自己构造出来符合规范的文件格式，然后发送：  
```javascript
// 示例代码
/**
 * @typedef {Object} FormData
 * @property {string} contentType
 * @property {string} body
 */
 
/**
 * create form-data
 * @param {object} param
 * @returns {FormData}
 */

function createFormData(param={}){
    const CRLF = '\r\n';
    const boundarySymbol = Array.apply(null, {length: 24}).map(i => {
        return Math.floor(Math.random() * 10).toString(16);
    }).join('');
    const contentType = `multipart/form-data; boundary=${boundarySymbol}`;
    const body = Buffer.concat(Object.keys(param).map(key => {
        const val = param[key];
        return val.buffer
            ? Buffer.concat([
                Buffer.from(`--${boundarySymbol}${CRLF}`, 'utf8'),
                Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${val.filename}"${CRLF}`, 'utf8'),
                Buffer.from(`Content-Type: ${val.contentType}${CRLF}${CRLF}`, 'utf8'),
                val.buffer,
                Buffer.from(CRLF, 'utf8')
            ])
            : Buffer.concat([
                Buffer.from(`--${boundarySymbol}${CRLF}`, 'utf8'),
                Buffer.from(`Content-Disposition: form-data; name="${key}"${CRLF}`, 'utf8'),
                Buffer.from(`Content-Type: text/plain${CRLF}${CRLF}${val}${CRLF}`, 'utf8')
            ]);
    }).concat([Buffer.from(`--${boundarySymbol}--${CRLF}`, 'utf8')]));
    return {
        contentType,
        body
    };
};

const content = createFormData({
    my_field: 'abc',
    my_file: {
        buffer: buff,// 上面代码中 archiver 生成的 buffer  
        filename: 'somename.zip',// 这里可以随便写一个  
        contentType: 'application/zip'
    }
});
// 既然都做到这一步了，也就没有必要再用 request 模块了
const http = require('http');
const req = http.request({
    hostname: 'xxx',
    port: 'xxx',
    path: '/xxx',
    method: 'POST',
    headers: {
        'Content-Type': content.contentType,
        'Content-Length': Buffer.byteLength(content.body)
    }
}, resp => {
    resp.on('data', d => console.log(d.toString()));
});
req.write(content.body);
req.end();

```

构建这个 formData 的时候，遇到了几个坑：  

首先是 LF 与 CRLF 的问题，最开始我是通过字符串模板来生成的数据，在字符串模板中使用了换行格式来产生换行及空行，结果上传时总是报 parse error, 肉眼对比上传后能正常解析的内容发现也都是一样的，最后无奈使用 Beyond Compare 对比才发现了问题：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-19-282ed1e271.jpg)  

原来是换行符不一致导致的，类 Unix 系统中默认的换行符是 LF(\n), 而 [RFC7578](https://tools.ietf.org/html/rfc7578#section-4.1) 规范中要求的是 CRLF(\r\n), 所以才导致了解析异常  

还有就是结尾的 '--', 找遍了 RFC7578 也没有找到关于这个的说明，最后在 [RFC1341](https://tools.ietf.org/html/rfc1341) 上找到了：  
> The encapsulation boundary following the last body part is a distinguished  delimiter that indicates that no further body parts will follow.  Such a delimiter  is  identical  to  the previous  delimiters,  with the addition of two more hyphens at the end of the line: --gc0p4Jq0M2Yt08jU534c0p--

还有个疑问，就是成熟的框架里，为什么要像上图一样，给 boundary 加那么多的 `-` 呢？有小伙伴和我一样发出了这个疑问： [what-is-the-in-multipart-form-data](https://stackoverflow.com/questions/3508252/what-is-the-in-multipart-form-data), 高票回答者的意思大概是，这个 `-` 并没有特殊的含义，可能是在远古时代，人们还需要用肉眼去看实际的请求内容，而这些 `-` 会提供良好的视觉分隔  

我们也可以使用现有的框架来发送这个文件的 buffer, 比如 [form-data](https://www.npmjs.com/package/form-data):  
```javascript
// 示例代码
const request = require('request');
const FormData = require('form-data');

const formData = new FormData();
formData.append('my_field', 'abc');
formData.append('my_file',
    buff,// 上面代码中 archiver 生成的 buffer
    {
        filename: 'somename.zip'// 随便写，但必须有
    }
);
formData.pipe(
    request.post({
        url: '{url_to_post}',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        }
    })
);

```

相关环境与库版本：  
node: `8.16.0`  
archiver: `3.0.0`  
request: `2.88.0`  
express: `4.16.4`  
multer: `1.4.2`  
form-data: `2.3.3`  

