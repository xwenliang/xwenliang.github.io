---
layout: post
title: Javascript 两种创建字符串方式的区别
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2013-11-17 21:15:55+0800
sync_link: https://xwenliang.cn/p/5288c18be8ce32583f000002
categories: frontend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


我们在创建字符串的时候，最常用的是直接定义的方法，如 `var a = 'aaa'`, 那么不常用的 `var b = new String('aaa')` 和前者有什么区别呢？  

前者是基础数据类型 string, 后者是一个字符串对象 object 类型。所以 `b.b = 'bb'` 是可以的，而 `a.b='bb'` 是不可以的。  

但是考虑到基础数据类型 string 也有一些自带的拓展方法或属性，如 `a.length`,`a.indexOf()`,`a.charAt()`,`a.split()`,`a.substring()` 等，那为什么却不能扩展方法或属性呢？  

原来 js 存在自动装箱行为，当使用上述方法时，js 会自动把基础数据类型装箱为与之对应的引用类型，操作结束后再把引用类型还原为基础类型。  

如果想扩展 a 的属性或方法，可以先对其进行装箱：`a = new String(a);`, 然后可以实现 `a.b = 'bb'`, 当然也可以通过原型的方法：`String.prototype.b = 'bb'`, 但这样所有的字符串都拥有了 b 属性，污染了原型，所以不建议使用。  

如果想获得一个字符串对象的基础数据类型 string, 可以用 `valueOf()`, 比如上面例子中的 b, 执行 `b = b.valueOf()` 之后它的数据类型便被转化为 string 类型了，可以把这一步看作是拆箱操作。  

