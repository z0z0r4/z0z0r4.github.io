---
title: CS144 Check0
sticky: false
mermaid: true
date: 2026-09-07 18:51:13
tags:
- study-notes
- CS144
categories:
- study-notes
- CS
- CS144
cover: /covers/The_World_Wide_Web_project.png
comments:
copyright:
sponsor:
---

CS144 是 Stanford 的计算机网络课程。

<!--more-->

封面是 <https://line-mode.cern.ch/www/hypertext/WWW/TheProject.html> [Line Mode Browser](https://line-mode.cern.ch/)。详见 Wikipedia [Line Mode Browser](https://zh.wikipedia.org/wiki/Line_Mode_Browser)。 

> The line-mode browser, launched in 1992, was the first readily accessible browser for what we now know as the world wide web. It was not, however, the world’s first web browser. The very first web browser was called WorldWideWeb and was created by Tim Berners-Lee in 1990.
> Line Mode Browser 于 1992 年推出，是人们如今所熟知的万维网（World Wide Web）上第一款可以被便捷访问的浏览器。然而，它并不是世界上首款网络浏览器；真正的首款网络浏览器名为 WorldWideWeb，由 Tim Berners-Lee 于 1990 年创建。

以上内容摘自 <https://gitlab.cern.ch/web-team/html-websites/line_mode/>，其中放着欧洲核子研究组织（CERN）的 Line Mode Browser 模拟器的代码。

---

CS144 详见 [CS自学指南 Stanford CS144: Computer Network](https://csdiy.wiki/计算机网络/CS144)，此时课程网站直接没了，整个 [CS144 组织](https://github.com/CS144/) 啥都没公开，只能找 [Web Archive](https://web.archive.org/web/20260506063931/https://cs144.github.io/) 了。

艰难找到了一份 [2025 Winter 的 Lab](https://github.com/ht4w5/minnow-winter-2025) 然后备份了一份到 [z0z0r4/minnow-winter-2025](https://github.com/z0z0r4/minnow-winter-2025)。虽然是 2025 Winter 的，但应该差不多。后面在 Github 上找到个 [2025 Fall 的 Lab](https://github.com/MichaelHart23/minnow)，但是既没有不同 Lab 的 startcode 分支，也好像缺失 Lab 7 的 checkpoint，还是没用这份。

---

参考 [check0.pdf](https://web.archive.org/web/20260506063931/https://cs144.github.io/assignments/check0.pdf) 配置环境，然后试玩 `talent` 来查看网页和发送邮件。

其中要动手写代码的包括 `webget` 和 `byte_stream` 两个部分。

`webget` 基本上就是试着调用 socket，要写入的内容可以参考 `talent` 输入的内容。注意提示即可！

其中测试的时候会发现 `cs144.keithw.org` 已经失效了，无法访问，你应该自己修改一下 `tests/webget_t.sh`，试着用别的网站替代，比如 <www.msftconnecttest.com/connecttest.txt> 或者 Apple、Google 它们的连接测试网站。

> 或者干脆删掉这个测试。

---

`byte_stream` 部分需要实现一个环形缓冲区，这和 `xv6` 的网络驱动实验差不多实现，也简单很多，不再赘述。

要仔细看注释中的要求，否则你可能实现大体正确但是异常处理等情况不符合测试~

> 注意到 PDF 中要求不要使用 `new` 和 `delete`，当然也不要 `malloc` 和 `free`。你需要 *Modern C++* hahaha

---

实现见 <https://github.com/z0z0r4/minnow-winter-2025>

测试结果如下：

```
❯ cmake --build build --target check0
Test project /home/z0z0r4/minnow-winter-2025/build
Connected to MAKE jobserver
      Start  1: compile with bug-checkers
 1/11 Test  #1: compile with bug-checkers ........   Passed    0.38 sec
      Start  2: t_webget
 2/11 Test  #2: t_webget .........................   Passed    0.35 sec
      Start  3: byte_stream_basics
 3/11 Test  #3: byte_stream_basics ...............   Passed    0.02 sec
      Start  4: byte_stream_capacity
 4/11 Test  #4: byte_stream_capacity .............   Passed    0.03 sec
      Start  5: byte_stream_one_write
 5/11 Test  #5: byte_stream_one_write ............   Passed    0.02 sec
      Start  6: byte_stream_two_writes
 6/11 Test  #6: byte_stream_two_writes ...........   Passed    0.03 sec
      Start  7: byte_stream_many_writes
 7/11 Test  #7: byte_stream_many_writes ..........   Passed    0.16 sec
      Start  8: byte_stream_stress_test
 8/11 Test  #8: byte_stream_stress_test ..........   Passed    0.07 sec
      Start 37: no_skip
 9/11 Test #37: no_skip ..........................   Passed    0.02 sec
      Start 38: compile with optimization
10/11 Test #38: compile with optimization ........   Passed    0.17 sec
      Start 39: byte_stream_speed_test
        ByteStream throughput (pop length 4096):  1.00 Gbit/s
        ByteStream throughput (pop length 128):   0.90 Gbit/s
        ByteStream throughput (pop length 32):    0.97 Gbit/s
11/11 Test #39: byte_stream_speed_test ...........   Passed    0.85 sec

100% tests passed, 0 tests failed out of 11

Total Test time (real) =   2.09 sec
Built target check0
```