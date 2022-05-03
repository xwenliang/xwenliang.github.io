---
layout: post
title: 使用 Nodejs 的 socket 制作聊天室遇到的问题总结
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2013-12-03 15:53:58+0800
sync_link: https://xwenliang.cn/p/528f48cede7808945b000002
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


首先遇到的问题是，刷新浏览器会触发 disconnect 和 connect 事件，这样会反复提示用户进入和离开。要解决这个问题，可以在 disconnect 的事件回调函数里面加一个延时。如果触发了 disconnect 后马上又触发了 connect, 则不执行 disconnect 的事件回调函数。  

第二个问题是，用户在开多标签的情况下，每新打开/关闭一个标签，都会触发一次 connect/disconnect 事件。解决这个问题的关键，在于定义好「用户离开」的界定。我在这里定义的用户离开，是指的用户关闭当前浏览器的所有的聊天室窗口。那么我如何知道用户关闭了所有的聊天室窗口呢？  

首先我植入了一个浏览器生存周期的 cookie, 带有这个 cookie 的用户首次进入聊天室，我会把 tabs 属性设为 1, 再次进入就 +1, 离开就 -1, 如果最后 tabs 的值为 0, 则表示用户关闭了当前浏览器的所有的聊天室窗口，这个时候就说明「用户离开」了。  

第三个问题是用户状态同步的问题。比如用户在登录状态开了两个标签，在其中一个标签退出登录，那么另外一个标签的状态也应该是退出登录。如何实时检测呢？我的做法是，在新消息进入和新的连接建立时进行检测。也就是说，在服务器下一次主动推送消息的时候检测，这样做的好处在于，可以免于轮询。  

可能你会说，为何不在退出登录的时候，就推送一条用户离开的消息呢？因为我只有在聊天室页面使用了 socket...  

