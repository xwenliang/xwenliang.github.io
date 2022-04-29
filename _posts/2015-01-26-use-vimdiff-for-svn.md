---
layout: post
title: 使用 vimdiff 代替 svn diff
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2015-01-26 21:42:51+0800
orig_link: https://xwenliang.cn/p/54c640f0c8dd347c0500000a
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


svn 自带的 diff 实在是没法看，果断百度 google 一番，找到了 vimdiff 这东西，怕日后别人链接挂了，抄到这里吧。  

首先创建一个 shell 脚本，就叫 mydiff 吧，放在 /usr/bin 下好了：  

```bash
#!/bin/sh
#指定vimdiff的路径
DIFF="/usr/bin/vimdiff"
#svn提供的第六和第七个参数就是两个要对比的文件
LEFT＝${6}
RIGHT=${7}
#调用vimdiff做比较
$DIFF $LEFT $RIGHT
```

并赋予该文件可执行权限：`chmod +x /usr/bin/mydiff`  

然后配置个人目录下的 svn 配置文件：~/.subversion/config  

找到 [helplers], 将 `# diff-cmd = diff_program(diff, gdiff, etc.)` 这句，改为：`diff-cmd = /usr/bin/mydiff` 保存退出，就可以了。  

效果：  

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-04-30-f708b1537e.jpg)  

