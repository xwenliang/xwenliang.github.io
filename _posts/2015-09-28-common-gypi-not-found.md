---
layout: post
title: 解决 common.gypi not found
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-09-28 19:45:45+0800
sync_link: https://xwenliang.cn/p/56092869e679ea9102000001
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


记得在很久之前安装各种 node 模块的时候，就遇到过 node-gyp 报的各式各样的错误，其中这个找不到 common.gypi 是很常见的。今天在安装 node-iconv 的时候，再次遇到了这个问题：  

> \> iconv@2.1.11 install /root/web/xwenliang/3/app/node_modules/iconv  
> \> node-gyp rebuild
>  
> gyp: /root/.node-gyp/0.10.25/common.gypi not found (cwd: /root/web/xwenliang/3/app/node_modules/iconv) while reading includes of binding.gyp
> gyp ERR! configure error 
> gyp ERR! stack Error: `gyp` failed with exit code: 1
> gyp ERR! stack     at ChildProcess.onCpExit (/usr/local/lib/node_modules/npm/node_modules/node-gyp/lib/configure.js:337:16)
> gyp ERR! stack     at ChildProcess.EventEmitter.emit (events.js:98:17)
> gyp ERR! stack     at Process.ChildProcess._handle.onexit (child_process.js:797:12)
> gyp ERR! System Linux 3.2.0-29-generic
> gyp ERR! command "node" "/usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" "rebuild"
> gyp ERR! cwd /root/web/xwenliang/3/app/node_modules/iconv
> gyp ERR! node -v v0.10.25
> gyp ERR! node-gyp -v v0.12.2
> gyp ERR! not ok 
> npm ERR! iconv@2.1.11 install: `node-gyp rebuild`
> npm ERR! Exit status 1
> npm ERR! 
> npm ERR! Failed at the iconv@2.1.11 install script.
> npm ERR! This is most likely a problem with the iconv package,
> npm ERR! not with npm itself.
> npm ERR! Tell the author that this fails on your system:
> npm ERR!     node-gyp rebuild
> npm ERR! You can get their info via:
> npm ERR!     npm owner ls iconv
> npm ERR! There is likely additional logging output above.

如果你不知道 node-gyp 是干啥的，可以先点[这里](https://github.com/nodejs/node-gyp)。这个 common.gypi 是个什么鬼呢，据网友可靠消息，它应该是一个类似于编译前的配置文件的东西。但是我们明明都没碰过 node-gyp, 怎么就缺少了配置文件了呢？万能的网友告诉我，你一定是在编译某个模块的时候，强制中断了操作或编译过程意外中断，才导致了这个问题。  

解决方法：手动删除 ~/.node-gyp 这个目录，让 node-gyp 认为还没有生成过 common.gypi 文件，这样编译前它就会重新生成这个文件，于是就解决了这个问题。(感觉 node-gyp 这么弱智呢，既然文件是自己生成的，找不到了不会再生成一份啊？)  

接下来确实不报 common.gypi not found 的错误了，却又报了下面的错误：  

> \> iconv@2.1.11 install /root/web/xwenliang/3/app/node_modules/iconv  
> \> node-gyp rebuild
>  
> gyp: /root/.node-gyp/0.10.25/common.gypi not found (cwd: /root/web/xwenliang/3/app/node_modules/iconv) while reading includes of binding.gyp
> gyp ERR! configure error 
> gyp ERR! stack Error: `gyp` failed with exit code: 1
> gyp ERR! stack     at ChildProcess.onCpExit (/usr/local/lib/node_modules/npm/node_modules/node-gyp/lib/configure.js:337:16)
> gyp ERR! stack     at ChildProcess.EventEmitter.emit (events.js:98:17)
> gyp ERR! stack     at Process.ChildProcess._handle.onexit (child_process.js:797:12)
> gyp ERR! System Linux 3.2.0-29-generic
> gyp ERR! command "node" "/usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" "rebuild"
> gyp ERR! cwd /root/web/xwenliang/3/app/node_modules/iconv
> gyp ERR! node -v v0.10.25
> gyp ERR! node-gyp -v v0.12.2
> gyp ERR! not ok 
> npm ERR! iconv@2.1.11 install: `node-gyp rebuild`
> npm ERR! Exit status 1

执行了多次无果后，绝望之下突然想到，是不是因为 node 进程还在运行中，对这个模块的编译安装产生了影响？于是机智的停掉了 node 进程，再次编译安装，终于成功了...  

> \> iconv@2.1.11 install /root/web/xwenliang/3/app/node_modules/iconv  
> \> node-gyp rebuild
>  
> make: Entering directory '/root/web/xwenliang/3/app/node_modules/iconv/build'
> CC(target) Release/obj.target/libiconv/deps/libiconv/lib/iconv.o
> AR(target) Release/obj.target/iconv.a
> COPY Release/iconv.a
> CXX(target) Release/obj.target/iconv/src/binding.o
> SOLINK_MODULE(target) Release/obj.target/iconv.node
> SOLINK_MODULE(target) Release/obj.target/iconv.node: Finished
> COPY Release/iconv.node
> make: Leaving directory '/root/web/xwenliang/3/app/node_modules/iconv/build'
> iconv@2.1.11 node_modules/iconv
> └── nan@2.0.9

但似乎暴露了不少路径啥的...  

