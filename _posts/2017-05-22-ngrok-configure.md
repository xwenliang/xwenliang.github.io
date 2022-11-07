---
layout: post
title: 搭建 ngrok 实现内网穿透
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-05-22 20:39:46+0800
sync_link: https://xwenliang.cn/p/5922dc12d9d219d608000002
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


一直想从外网访问家中的网络，以前听说可以设置端口转发，但必须进入小区的交换机设置，一般运营商是不允许这么做的。后来甚至想过自己用 socket 实现，外网请求阿里云，阿里云 socket 推送给家中内网  

今天偶然间发现了 [ngrok](https://github.com/inconshreveable/ngrok) 这么个东西，据官方解释，这是一个 go 实现的可以穿透内网的反向代理服务器，正好符合我的需求。下面就记录一下安装配置过程  

既然是基于 go 语言实现的，那首先要安装 go 语言环境，[这里](https://golang.org/doc/install?download=go1.8.1.linux-amd64.tar.gz)有详细的文档  

从ngrok的官方 github 获取源码：  

```bash
git clone https://github.com/tutumcloud/ngrok.git ngrok
```  

进入ngrok目录，生成密钥：  

```bash
NGROK_DOMAIN="xwenliang.cn"
openssl genrsa -out base.key 2048
openssl req -new -x509 -nodes -key base.key -days 10000 -subj "/CN=$NGROK_DOMAIN" -out base.pem
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=$NGROK_DOMAIN" -out server.csr
openssl x509 -req -in server.csr -CA base.pem -CAkey base.key -CAcreateserial -days 10000 -out server.crt

cp base.pem assets/client/tls/ngrokroot.crt
```

然后编译成服务端和客户端程序, 默认生成的是 Linux 64-bit 环境下的程序：  

```bash
sudo make release-server release-client
```

如果需要生成 mac 平台的：  

```bash
sudo GOOS=darwin GOARCH=amd64 make release-server release-client
```

生成树莓派的：  

```bash
sudo GOOS=linux GOARCH=arm make release-server release-client
```

编译成功后会在 ngrok/bin 下生成 ngrokd、ngrok 两个文件，前者是服务端程序，后者是客户端程序  

启动服务端程序：  

```bash
sudo ./bin/ngrokd -tlsKey=server.key -tlsCrt=server.crt -domain="xwenliang.cn" -httpAddr=":8081" httpsAddr=":8082"
```

启动后就可以通过 `http://xwenliang.cn:8081` 来访问 ngrok 的服务了：  

> Tunnel ngrok.xwenliang.cn:8081 not found  

出现这个错误表示客户端程序没有启动  

接下来我们把刚才生成的 ngrok/bin 下的 ngrok 文件拷贝到树莓派中(注意要用树莓派的配置生成的文件，否则无法启动)，启动：  

```bash
./ngrok -subdomain ngrok -proto=http -config=ngrok.conf 8080
```

```bash
# ngrok.conf
server_addr: xwenliang.cn:4443
trust_host_root_certs: false
```

这个 4443 端口是服务端默认转发过来的端口，启动服务端程序的时候可以通过 `-tunnelAddr=":xxx"` 来指定  

然后在树莓派中实现一个小 server:  

```javascript
var a = require('http');
var server = a.createServer(function(req, res){
   res.writeHead(200, {'Content-Type': 'text'});
   res.write('i am from raspberry 0.0');
   res.end();
});
server.listen(8080);
```

启动后，从外网访问 `http://ngrok.xwenliang.cn:8081` 就会出现：  

![IMAGE]({{ site.gallery_prefix }}2022-04-27-f21a6a3b74.jpg)  

