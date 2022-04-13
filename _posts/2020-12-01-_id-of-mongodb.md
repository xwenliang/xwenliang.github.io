---
layout: post
title: MongoDB 自带的 _id 会不会重复
# date 同时用作关联 github issue 的唯一标识，所以不可重复
date: 2020-12-01 23:32:28+0800
categories: backend
# permalink: /xxx/

# https://jekyllrb.com/docs/structure/
# name of this file show be in format of: YEAR-MONTH-DAY-title.MARKUP
---


前些天吃晚饭的时候跟曹老师聊起来数据库的东西，顺带吐槽了下他们 MongoDB 用的很山寨，表里的每条数据还得单独存个时间戳字段，因为我们知道 MongoDB 自带的 `_id` 中是可以解析出秒级时间戳的。

曹老师当场不同意我的看法，认为他们这么做是有一定道理的，因为默认的 `_id` 是没法用的会重复，所以他们使用雪花算法自定义了 `_id`, 所以才又单独存了个时间戳字段。

且不说自定义 `_id` 的时候也可以把时间戳设计进去，在我印象中，默认 `_id` 是有唯一性保证的，并且还有自增的逻辑。

所以就默认 `_id` 是否唯一我俩杠上了，在反复确认了是单库单表并且没有自定义 `_id` 的情况下，我们打赌 -- 如果它唯一曹老师明天写离职报告，不唯一我明天写离职报告。

曹老师的理论基础是，他曾在具体项目中看到了大量的 E11000 重复 key 的错误，并且是单库单表的情况，并且没有自定义 `_id`. 我的理论基础是几年前做这个博客后台的时候，模糊记得看过文档上是有唯一性保证的。

回来后就赶紧开始查文档，最后在[这里](https://www.mongodb.com/blog/post/generating-globally-unique-identifiers-for-use-with-mongodb)找到了这个默认 `_id` 的算法：

> ObjectID is a 96-bit number which is composed as follows:
> 1. a 4-byte value representing the seconds since the Unix epoch (which will not run out of seconds until the year 2106)
> 2. a 3-byte machine identifier (usually derived from the MAC address),
> 3. a 2-byte process id, and
> 4. a 3-byte counter, starting with a random value.

![IMAGE](https://cdn.jsdelivr.net/gh/xwenliang/gallery2022/2022-4-13-2d2b5de15b.jpg)  

看到这里，好像并不能保证不重复，因为它只说了有个 3-byte 也就是6位16进制的自增 counter, 并且还是从一个随机值开始的，假如不幸正好随机到了最大值 `2^24=16,777,216` 附近，会不会再累加就溢出了，然后导致产生重复呢？

然后我们找到了这个自增 counter 的[代码](https://github.com/mongodb/bson-ruby/blob/master/lib/bson/object_id.rb#L369-L378)：  

```ruby
# Return object id data based on the current time, incrementing the
# object id counter. Will use the provided time if not nil.
#
# @example Get the next object id data.
#   generator.next_object_id
#
# @param [ Time ] time The optional time to generate with.
#
# @return [ String ] The raw object id bytes.
#
# @since 2.0.0
def next_object_id(time = nil)
@mutex.lock
begin
    count = @counter = (@counter + 1) % 0xFFFFFF
ensure
    @mutex.unlock rescue nil
end
generate(time || ::Time.new.to_i, count)
end
```

看完代码后终于放心了，如果随机到了临近上限的值，累加溢出后会取余，然后继续累加，结合前面 4-byte 的秒级时间戳，这意味着单库单表每秒并发量达到 `2^24=16,777,216` 才会产生重复 `_id`, 并且不是随机产生，而是一定产生。但是这个数字基本是不可能的，所以曹老师遇到的重复问题应该还是在哪个环节自定义了 `_id`, 由于当时场景已经无法复现，只能等到下一次遇到问题现场再看了  

最后还有个问题，4-byte 能表示的最大值是 `2^32=4,294,967,296`, 换算成时间后只能到2106年2月7日，留给 MongoDB 的时间不多了😅  

