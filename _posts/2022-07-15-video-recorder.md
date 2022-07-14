---
layout: post
title: 通用在线加密视频解密方案
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2022-07-15 05:09:51+0800
sync_link: https://xwenliang.cn/p/62d0869576d29c733e12c4a9
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---

#### 最近有小伙伴花了大几千买了某视频网课的课程，快到期了还没看过，问我能不能下载到本地  

先去 github 逛了一圈，发现有个叫做 CocoCut 的浏览器插件，可以下载视频，对于加密视频，只要能播放就能下载  


---



#### 试用后发现存在几个问题：  

1. 无法自动化，对于加密视频需要每次打开网页后点击插件弹出面板上一个叫做「force download」的按钮，跳转到其官网后打开 「Recording mode」, 此时播放视频的网页会刷新，然后开始录制，最后提供 mp4 格式的视频下载  

2. 需要付费，只能免费下载几个小时的时长  


---



#### 既然它能做，那么咱们应该也可以。先了解下目前市面上常见的视频加密手段：  

1. 微软 DRM SDK, 浏览器兼容较差  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-a4bb0b5823.jpg)  

2. RTMPE, Adobe 提出的产生于 FLASH 时代的视频加密传输协议。流媒体服务器软件价格贵，数据不能缓存，用户每次播放都要占用服务器带宽  

3. HLS, Apple 提出的基于 http 协议的视频分片传输协议, PC Chrome 不支持，需要使用 Media Source Extensions 转码播放(西瓜播放器、jwplayer)  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-41ec81e858.jpg)  

    ![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-f77b775498.jpg)  

HLS 由两部分构成，一个是 .m3u8 文件，一个是 .ts 视频文件（TS 是视频文件格式的一种）。整个过程是，浏览器会首先去请求 .m3u8 的索引文件，然后解析 m3u8，找出对应的 .ts 文件链接，并开始下载  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-6fd21b095d.jpg)  

HLS 原生支持客户端加密，只需要往 .m3u8 文件中添加 EXT-X-KEY 字段，值为客户端获取密钥的鉴权服务即可  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-189c200c46.jpg)  

这是原生支持的方式，而查看我们目标网站的实现方式，由于是需要在 PC 端播放的，所以是利用了 Media Source Extensions 转码播放的，所以 ts 文件的解密也是自定义的过程  

我们接下来需要做的事情是下载所有的 ts 文件，从 js 中找到解密 ts 文件的 AES key 就可以了  

但这个找 AES key 的过程不可复用，每个网站的手段不尽相同，定向破解成本较大  


---



#### 行业方案 —— 保利威视基于 HLS 的视频加密方案  

v11: m3u8+AES 和上述方案类似  

v12: m3u8+canvas+wasm 可以认为是上述方案的升级版，采用 canvas 绘制有效防止视频破解后分流去除水印，且把解密过程放到 wasm 二进制中保护起来，更难于破解获取 AES key  


---



#### 思考：既然视频要给用户播放，那不管怎么加密，最终总是要呈现给用户，那我们能不能在呈现这一环节入手呢？  

最差的手段是物理录屏，但也无法实现自动化，且效果会很差，分辨率问题，声音问题，卡顿、转场等等问题  

此时我们恰好看到了一个神奇的 API：`HTMLMediaElement.captureStream()`  

> The captureStream() property of the HTMLMediaElement interface returns a MediaStream object which is streaming a real-time capture of the content being rendered in the media element.

Chrome Developers 也有一篇文章介绍它：https://developer.chrome.com/blog/capture-stream/  

它可以用来实时录制多媒体元素上渲染的内容，结合 `MediaRecorder` 是不是正好贴合我们的场景呢，赶紧来试一下：  

以下代码是运行在浏览器插件的 `content_scripts` 中，获取到视频流后发送到 `background` 进行合并下载：  

```js
// content.js
const $videos = [...document.querySelectorAll('video')];
// todo: 支持同一页面多个视频
const $target = $videos[0];
$target && $target.addEventListener('playing', () => {
    // muted video 不触发 captureStream
    // $target.muted = true;
    $target.volume = 0.01;
    if($target.isRecording){
        return ;
    }
    $target.isRecording = true;
    // 很多视频开头有小动作，比如帮你拖拽进度条，可能会延迟触发或多次触发，所以我们要加个延时
    setTimeout(() => {
        console.log('Video Recorder started...');
        startRecording($target);
    }, 5000);
});

function startRecording($tar){
    const mimeType = 'video/webm';
    const recorder = new MediaRecorder($tar.captureStream(), {
        mimeType
    });
    recorder.onstart = function(e){
        // console.log('start', e);
    };
    recorder.ondataavailable = function(e){
        // console.log('ondata', e);
        // const blob = new Blob([e.data], {
        //     type: mimeType
        // });
        sendBlobData(e.data);
    };
    recorder.onstop = function(e){
        endBlobData();
        // console.log('stoped', e);
        // 不能成功，因为有些页面视频播完会刷新到下一个视频
        // const blob = new Blob(chunks, {
        //     type: mimeType
        // });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // document.body.appendChild(a);
        // a.style = 'display: none';
        // a.href = url;
        // a.download = document.title;
        // a.click();
        // window.URL.revokeObjectURL(url);
    };
    recorder.onerror = function(e){
        // console.log('errored', e);
    };
    // 重置播放时间
    $tar.currentTime = 0;
    recorder.start(1000);
    $tar.onended = function(e){
        stopRecorder(recorder);
    };
    $tar.oncomplete = function(e){
        stopRecorder(recorder);
    };
    window.onbeforeunload = function(e){
        stopRecorder(recorder);
    };
};

function sendBlobData(blobData){
    const fr = new FileReader();
    fr.onload = function(ev){
        chrome.runtime.sendMessage({
            data: fr.result,
            size: blobData.size,
            mimeType: blobData.type,
            name: document.title,
            action: 'data'
        }, response => {
            // console.log("Response: ", response);
        });
    };
    fr.onerror = function(ev){
        console.log('FileReader error', ev);
    };
    fr.readAsBinaryString(blobData);
};

function endBlobData(){
    chrome.runtime.sendMessage({
        data: '',
        size: 0,
        mimeType: '',
        name: '',
        action: 'end'
    }, response => {
        // console.log("Response: ", response);
    });
};

function stopRecorder(recorder){
    if(recorder.state === 'recording'){
        recorder.stop();
    }
};
```


---



#### 遇到的几个问题：  

1. 很多视频网站播放完后会刷新页面到下一个播放页面，导致 `content.js` 中对 `video` 标签的 `end` `complete` 事件的监听函数中的动作不能保证成功，同样页面的 `beforeunload` `unload` 事件监听函数中的动作也不能保证成功，所以我们把视频流发送到浏览器插件的 `background` 进行处理  

2. `MediaRecorder` 只能录制成以下几种格式的视频：  

```
Essentially, it looks like the following are (at time of writing) accepted MIME types for video/audio in Chrome:

video/webm
video/webm;codecs=vp8
video/webm;codecs=vp9
video/webm;codecs=vp8.0
video/webm;codecs=vp9.0
video/webm;codecs=h264
video/webm;codecs=H264
video/webm;codecs=avc1
video/webm;codecs=vp8,opus
video/WEBM;codecs=VP8,OPUS
video/webm;codecs=vp9,opus
video/webm;codecs=vp8,vp9,opus
video/webm;codecs=h264,opus
video/webm;codecs=h264,vp9,opus
video/x-matroska;codecs=avc1

audio/webm

audio/webm;codecs=opus
(EDITED 2019-02-10: Updated to include brianchirls' link find)  
```

3. https://github.com/ffmpegwasm/ffmpeg.wasm 不能用于浏览器插件的 background, 报错：  

> Uncaught (in promise) RuntimeError: abort(CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder). Build with -s ASSERTIONS=1 for more info.  

manifest.json 加上 `"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",` 仍然报错：  

> Refused to load the script 'blob:chrome-extension://nnodhmmdmobflnhbigcheclnhdfkidpf/71e2d139-c5f1-4991-bbc0-4748802aec2a' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-eval'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.  

4. content 和 background 通信无法直接传递 Blob 类型数据，但可以传递 `URL.createObjectURL` 创建的数据，localStorage 同样。可以使用 `new FileReader().readAsBinaryString` 解决  

5. muted video 不会触发 `captureStream()`  

> https://bugs.chromium.org/p/chromium/issues/detail?id=1136404  


---



#### 攻防设想  

**假如我不想被别人利用这个手段下载到我的视频怎么办？**  

既然是用了 `HTMLMediaElement.captureStream()` 这个 API, 那我能不能屏蔽它呢？答案是可以的：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-9b983eed58.jpg)  

**假如别人用了这个手段屏蔽了 API, 但我还是想下载怎么办？**  

相信有很多种办法可以做到，这里我尝试了 cloneNode:  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-07-15-2c41b190d9.jpg)  

当然可以继续屏蔽 `HTMLElement.prototype.cloneNode`, 我们还可以使用 `outerHTML`  

**如果 MediaRecorder 被屏蔽了呢**  

我们可以在页面加载前就注入代码，提前保存该 API  


---



#### TODO:  

1. 同个页面多个 video 处理  
2. 视频暂停时要暂停录制  
3. popup 增加录制提示，各种控制按钮，如静音录制、自动录制等等  
4. 在 client 端转为 MP4 格式的可行性  
5. 经常会失败，或录制不全  
6. 顶多可以同时开4个窗口录制，再多容易失败(爆内存)  
7. canvas 录制支持  
8. 因为实现了视频流的同步，可以邀请你的小伙伴实现异地同步观影的功能，不知道实际是否实用..  

