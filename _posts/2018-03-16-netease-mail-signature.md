---
layout: post
title: 编辑网易邮箱签名的奇幻之旅
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2018-03-16 19:26:38+0800
sync_link: https://xwenliang.cn/p/5aaba9ee59c7704f42000008
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


今天有个同事接到了编辑邮箱签名的需求，但是遇到了个问题：编辑的好好的，保存后签名预览也没问题，可邮件发出去签名图片就是不显示。  

为了测试这个问题，我们先来打开网易邮箱，找到：设置->邮箱设置->签名/电子签名，看到有两个按钮，`新建文本签名`、`新建名片签名`，由于该需求定制化程度很高，用名片签名是满足不了的，所以只能`新建文本签名`了。  

既然是**文本**签名为啥又能插入图片了呢？点开后弹出的新建签名窗口也并没有插入图片这个功能，那我的同事是怎么插入图片的呢？询问后得知原来是先在邮件正文编辑好样式，直接粘贴过来的。这么说应该是支持插入 html 了，那就好办了，我们审查元素打开开发者工具，然后编辑节点，随便找个图片放进去，保存。然后新建邮件，使用刚才编辑好的签名，发送邮件，然后到同事那里打开，发现签名图片是能正常显示的。  

为啥我同事的不能显示呢，再次询问得知，他是在邮件正文编辑签名样式的时候，直接选的本地图片上传，然后复制到签名保存的。好我们依样画瓢，先打开写信，在邮件正文选择插入图片->我的电脑->浏览，进行本地图片上传，然后复制正文内容，打开新建签名，粘贴保存。然后再新建邮件，使用刚编辑的签名发送邮件，然后查看已发邮件，这次签名图片果然不能正常显示了。  

当时脑子里就发出了疑问，为啥站外资源就可以，站内资源却不行，这样的体验对用户操作是百害而无一利啊。我们打开已经保存的签名列表，发现列表中的签名图片确实是可以正常显示的。既然定位到了问题，那这个问题就已经解决一半了，我们打开开发者工具，分别查看已发送邮件正文中的签名图片和签名列表中的签名图片对比地址发现：  

```html
<!--已发送邮件正文中的签名图片-->
<img src="http://mail.beebank.com/js6/s?func=mbox:getComposeData&sid=*&composeId=c:1521194812189&attachId=1&rnd=0.05406239073781283">
<!--签名列表中的签名图片-->
<img src="http://mail.beebank.com/js6/s?func=mbox:getComposeData&sid=ZAftzLLXiigwXhoDceXXKQVrHHRDIaKF&composeId=c:1521194812189&attachId=1&rnd=0.05406239073781283">
```

我们可以看到，唯一的区别就是这个 sid 了，已发邮件**正文的签名图片**被替换成了`*`, 就是这个原因导致了图片不能显示。但是为什么发出去的**正文中的图片**能显示呢？经过再次对比发现，正文中图片被换成各自登录用户的sid了😑，也就是说，签名中的图片受到了不公正待遇...

至于为什么一定要 sid 才能查看图片，可能是出于对邮件内容的隐私保护吧，确保只有邮件发送者和接受者才能有权限查看。所以说这个邮件正文的图片上传确实有很多需要考虑地方，不然隐私泄露真是分分钟的事，这不禁让我想起之前微信红包的漏洞：只要扫到红包链接就可以领取并无是否该群成员的验证。  

但邮件签名这个事，我觉得对于普通用户来说就是个坑，他并不知道邮件内容出于隐私需要做的这些事情，并且由于`新建文本签名`这个名字的误导，估计有很多用户会在邮件正文编辑样式再粘贴进来实现自定义样式吧。我觉得最好的解决方式是把这个按钮改成`新建签名`，然后在签名编辑器中实现图片上传，或者直接把 img 过滤掉真正实现这个按钮的含义吧...

