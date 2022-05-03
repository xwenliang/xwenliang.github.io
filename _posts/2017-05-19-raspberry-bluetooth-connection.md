---
layout: post
title: 树莓派 raspberry 连接蓝牙音箱播放音乐的小折腾
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2017-05-19 11:26:28+0800
sync_link: https://xwenliang.cn/p/57ea7ef7866ef7873c000060
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


前段时间入手了一个树莓派，一直没怎么折腾，最近事情少就打算搞一搞  
  
让我惊奇的是官方提供的系统：RASPBIAN JESSIE(2016-05-27) 版本居然内置了 Nodejs, 虽然版本只有 `v0.10.29`  
  
后续提到的折腾都是在 RASPBIAN JESSIE 这个版本下  

---

先是更新所有软件包：  

`sudo apt-get upgrade`  

再通过 raspi-config 图形界面修改各种配置：  
Timezone(时区，选择Asia---Shanghai)  
Keyboard(键盘，选择United States---English(US))  

看起来一切都棒棒哒，拿它干点啥用呢，首先是连接比较麻烦，总不能一直给它单独配上鼠标键盘显示器吧，那就先让它联网后自动播报 IP 地址吧  

装上 mplayer, scp 过去一小段音乐，插上耳机发现根本木有声音啊...

Google 一番后，再次通过 raspi-config 进入设置：  

Advanced Options -> Audio -> Force 3.5mm('headphone')jack  

然后就有声了，Google 果然是万能的...

---

但是每次都带着耳机听 IP 是不是有点蠢啊，最好指定一个接口，让他自动播报到这个接口上去，感觉这个比较靠谱，后面再搞  

正好手头有个蓝牙音箱，再折腾下连接蓝牙音响吧  

这个版本带的东西比较全，Google 上说的 `pulseaudio` `pulseaudio-module-bluetooth` 啥的都有了，那直接开始搞吧  

通过 bluetoothctl 命令进入配置环境  
scan on 扫描到我的设备  
scan off 关掉扫描  
pair MAC 地址，成功  
trust MAC 地址，添加到信任列表  
connect MAC 地址  
然后就报错了：`Failed to connect: org.bluez.Error.Failed`  

Google 搜索了很久也没找到正确答案，期间还怀疑人生重装过一次系统...

根据广大网友们提的问题和答案来推测，应该是 pulseaudio 的锅，但是哪里出问题了呢，难道是这货没启动吗？  

直接输入 pulseaudio, 回车后一串红数字：  

> `bluez4-util.c: org.bluez.Manager.GetProperties()....`

看到这些又一脸茫然了，这难道是这个版本的 bug? 不能吧，如果存在这么大的 bug 不应该被放到官网上好几个月没人管吧...

感觉是自己姿势不对，所以看看这货的说明吧：`pulseaudio -h`  

出来一大堆的配置，看到有 kill 和 options, 既然 `pulseaudio -k` 是杀掉程序，那启动是什么呢，然后看到了options的第一个参数：-D, 那就试试好了，执行`pulseaudio -D` 后神奇的事情发生了，再去 connect 我的蓝牙音响的时候终于提示 `connecttion successful` 了  

然而到这里还没有结束，虽然连上了但还是没有声音，我实在忍不住要狠狠吐槽下这些蓝牙音响：  
1.开关机声音震天响，不能调节，不能关闭，简直了，害的我每次都要把它捂得严严实实的怕影响同事  
2.不管连接没连接，几分钟后没有动作的话，会自动关闭，仍然不能更改设置，和 1 组合起来简直是没谁了  

问题总要解决的，继续 Google 吧，找了大半天才找到它：[传送门](http://plugable.com/2016/03/14/listening-to-bluetooth-audio-on-your-raspberry-pi-3-pi-2-or-pi-zero)  

在安装了 pavucontrol 并 reboot 后，终于在菜单中看到了 Sound & Video 选项，打开后在 Playback 选项卡里给 mplayer 选择蓝牙音箱作为音频输出，终于有声音了...  

后来发现如果不先执行 `pulseaudio -D` 的话，这个 Sound & Video 选项也是打不开的，其实这些图形界面的操作也是更改了某些配置文件而已，直接更改配置文件应该更简单高效，后续有时间再看吧  

接下来就是看看如何开机启动 pulseaudio, 然后连接蓝牙音箱进行播报 IP 了  

---

倒腾来倒腾去，各种方法都试了：修改配置文件、添加脚本到 init.d、添加命令到 rc.local 等等都无效，后来看到官方解释说这东西不建议开机启动，也就没再折腾了，就凑合着用耳机听吧。。。  

既然要播报，那得找个发声的接口啊，突然想到百度翻译好像可以发出单词读音，赶紧找到接口来试了下：[点我试听](http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=1&text=%E4%BB%8E%E5%89%8D%E6%9C%89%E5%BA%A7%E5%B1%B1%EF%BC%8C%E5%B1%B1%E9%87%8C%E6%9C%89%E5%BA%A7%E5%BA%99%EF%BC%8C%E5%BA%99%E9%87%8C%E6%9C%89%E4%B8%AA%E8%80%81%E5%92%8C%E5%B0%9A)  

还不错吧，不知道用多了会不会被封 IP...  

下面是代码，为了图方便就用了我大 python:  

```python
#!/usr/bin/evn python
# coding=utf-8
import os
import sys
import time
import socket
import subprocess

def getIP():
    ip = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 0))
        ip = s.getsockname()[0]
    except:
        print '仍在获取'
    return ip

def talk(text, speed=2):
    speechUrl = "http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=%s&text=%s" % (speed, text)
    subprocess.call(["mplayer", speechUrl], shell=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

if __name__ == "__main__":
    count = 0
    while True:
        ip = getIP()
        if ip == None:
            talk('正在获取 IP 地址')
        else:
            count += 1
            talk('IP 地址是')
            talk(ip)
        if count == 3:
            break
        time.sleep(2)
```

