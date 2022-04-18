---
layout: post
title: Node.js 中的流式下载解压与流式压缩上传
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2019-10-14 21:53:12+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


我们的构建工具中有下载和上传的功能，分别是在创建项目和发布代码到测试环境的时候；最开始为了偷懒都是先 下载/打包 成临时压缩包，然后 解压/上传 这个临时压缩包  

后来觉得先写个文件到磁盘，再 解压/上传 这个文件有点傻，因为 解压/上传 完毕还要再删掉它，并且即使捕获了程序异常退出、上传失败、网络不通等等异常还是会因为一些原因删不掉，比如突然断电、程序异常崩溃等  

倒是有个猥琐的手段，写到一个不容易察觉的位置以.开头命名（所以你用户根目录里的.temp文件都是这么来的🤭）  

---

**流式处理**下载解压是门学问，首先格式要支持流式处理，什么？难道还有文件不支持流式处理吗？是的，zip 就是其中之一，根据 [wikipedia - Zip(file formate)](https://en.wikipedia.org/wiki/Zip_(file_format)) 对 zip 的解释：
> A ZIP file is correctly identified by the presence of an end of central directory record which is located at the end of the archive structure in order to allow the easy appending of new files.  

zip 中包含文件目录结构的关键信息位于文件的尾部，以便于方便的添加新文件(为什么方便呢？)，所以在你拿到这个关键目录信息之前，你是无法知道它的文件内容的，所以 [yauzl](https://www.npmjs.com/package/yauzl) (一个解压 zip 的基础库，截止目前周下载量400万+ ) 的作者在[文档中吐槽](https://github.com/thejoshwolfe/yauzl#no-streaming-unzip-api)：     
> #### No Streaming Unzip API
>
> Due to the design of the .zip file format, it's impossible to interpret a .zip file from start to finish (such as from a readable stream) without sacrificing correctness. The Central Directory, which is the authority on the contents of the .zip file, is at the end of a .zip file, not the beginning. A streaming API would need to either buffer the entire .zip file to get to the Central Directory before interpreting anything (defeating the purpose of a streaming interface), or rely on the Local File Headers which are interspersed through the .zip file. However, the Local File Headers are explicitly denounced in the spec as being unreliable copies of the Central Directory, so trusting them would be a violation of the spec.
>
> Any library that offers a streaming unzip API must make one of the above two compromises, which makes the library either dishonest or nonconformant (usually the latter). This library insists on correctness and adherence to the spec, and so does not offer a streaming API.

简单翻译下：  
所有的号称实现了流式解压 zip 文件的库，要么是全部读入内存先取到尾部关键目录信息（失去了 stream 化的意义），要么就是依赖了散布于文件中的本地文件头，而这些本地文件头是尾部关键目录信息的不可靠副本，依赖于它将不符规范（作者还在下面举了个反例），所以他坚决不提供这种 API  

---

所以我们要下载支持流式处理的 .tar.gz 格式，[什么是 .tar.gz 呢？](https://en.wikipedia.org/wiki/Tar_(computing)#Suffixes_for_compressed_files) 它是经过 gzip 压缩的 tar 文件，[什么是 tar 呢？](https://en.wikipedia.org/wiki/Tar_(computing)#Suffixes_for_compressed_files) 它是最先在 Unix 系统中被引入用于备份软件的文件格式，它只是把文件打包在一起并不做压缩处理，是 `(t)ape (ar)chive` 的缩写，它的内容格式是由 （文件头+文件内容）+（文件头+文件内容）... 的形式组成的，你可以在文件开始处就得到这个文件的名称、长度等信息，所以可以用于流式处理，经过 [gzip 压缩](https://en.wikipedia.org/wiki/Gzip)后的 .gz 文件内容信息同样位于头部，也可以用于流式处理  

知道了上述信息后，我们就可以使用 .tar.gz 格式文件进行流式下载解压了：  

```javascript
// 简单代码，未做任何异常捕获和处理
function downloadTgzStream(url, outputRepo, useMemory=false){
    const http = require('http');
    const path = require('path');
    // third-party libraries
    const gunzip = require('gunzip-maybe');
    const tar = require('tar-stream');
    
    const extract = tar.extract();
    const fileList = [];

    return new Promise((resolve, reject) => {
        !useMemory && fs.mkdirSync(outputRepo);
        extract.on('entry', (header, stream, next) => {
            const tempBuffer = [];
            let tempPrefix = '';
            stream.on('data', function(data){
                tempBuffer.push(data);
                tempPrefix = tempPrefix || `${header.name.split('/')[0]}/`;
                const wholeBuffer = Buffer.concat(tempBuffer);
                const dataSize = Buffer.byteLength(wholeBuffer);
                const fileName = header.name.replace(tempPrefix, '');
                if(dataSize === header.size && header.type === 'file'){
                    // be careful of size
                    if(useMemory){
                        return fileList.push({
                            fileName,
                            buffer: wholeBuffer
                        });
                    }
                    const filePath = path.join(outputRepo, fileName);
                    // todo: create directory if not exists
                    fs.writeFileSync(filePath, wholeBuffer);
                    fileList.push(filePath);
                    tempBuffer.length = 0;
                }
            });
            stream.on('end', function(){
                next();
            });
            stream.resume();
        });
        extract.on('finish', () => {
            resolve(fileList);
        });

        http.get(sourceUrl, res => {
            res.pipe(gunzip()).pipe(extract);
        }).on('error', err => {
            reject(err);
        });
    });
}
```

这里注意一个文件的 `on('entry')`可能会触发多个`on('data')`，因为 stream 是分段的，每段默认 `highWaterMark` 是 60*1024, 超过这个尺寸的文件就会被分成多段，所以注意验证文件完整性（上面实现很简陋，最好是按照 stream 分段写入文件防止超过最大内存限制，这也是流式处理的好处，可以操作大文件）  

通过上述方法我们可以直接将 .tar.gz 格式的文件下载并解压成文件，省去了先保存 .zip 再解压它然后删除它这三步 IO, 并且保证了不会有遗留文件  

---

**流式处理**压缩上传可以先看这篇文章：[buffer 上传中遇到的问题](https://xwenliang.github.io/backend/2019/08/13/upload-a-buffer.html)，然后我们只要流式创建 buffer 即可实现流式压缩上传：  
```javascript
// 简单代码，未做任何异常捕获和处理
const path = require('path');
const http = require('http');
const { Transform, finished } = require('stream');

const archiver = require('archiver');

const CRLF = '\r\n';
const boundarySymbol = Array.apply(null, {length: 24}).map(i => {
    return Math.floor(Math.random() * 10).toString(16);
}).join('');
const contentType = `multipart/form-data; boundary=${boundarySymbol}`;

let firstPipe = true;
const pipeLine = new Transform({
    transform(chunk, encoding, callback){
        let toSendChunk = chunk;
        if(firstPipe){
            firstPipe = false;
            toSendChunk = Buffer.concat([
                Buffer.from(`--${boundarySymbol}${CRLF}`, 'utf8'),
                Buffer.from(`Content-Disposition: form-data; name="your_key_1"; filename="your_file_name.zip"${CRLF}`, 'utf8'),
                Buffer.from(`Content-Type: application/zip${CRLF}${CRLF}`, 'utf8'),
                chunk
            ]);
        }
        callback(null, toSendChunk);
    },
    flush(callback){
        // file ended
        this.push(Buffer.from(CRLF, 'utf8'));
        // field start
        this.push(Buffer.concat([
            Buffer.from(`--${boundarySymbol}${CRLF}`, 'utf8'),
            Buffer.from(`Content-Disposition: form-data; name="your_key_2"${CRLF}`, 'utf8'),
            Buffer.from(`Content-Type: text/plain${CRLF}${CRLF}your_value${CRLF}`, 'utf8'),
            // all ended
            Buffer.from(`--${boundarySymbol}--${CRLF}`, 'utf8')
        ]));
        callback(null);
    },
    final(callback){
        callback(null);
    }
});

const request = http.request({
    hostname: 'xxx',
    port: 'xxx',
    path: '/xxx',
    method: 'post',
    headers: {
        'Content-Type': contentType
    }
});
request.on('response', res => {
    console.log(res.statusCode);
});

const archive = archiver('zip', {
    zlib: { level: 9 }
});
archive.pipe(pipeLine).pipe(request);
archive.directory(path.resolve('./test'), false);
archive.finalize();
```

[完整代码>>](https://github.com/xwenliang/xwenliang.github.io/tree/master/repro/test-stream-upload)  

相关环境与库版本：  
node: `8.16.0`  
archiver: `3.0.0`  

