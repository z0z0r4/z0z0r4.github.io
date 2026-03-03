---
title: CSAPP Data Lab
sticky: false
mermaid: false
date: 2026-02-25 18:45:09
tags:
  - CSAPP
  - learning-notes
categories:
  - learning-notes
  - CS
  - CSAPP
cover: covers/IMG_20260303_205751_061.png
comments:
copyright:
sponsor:
---

2026-02-25 到 2026-02-28 完成 :|

---

[材料下载](https://csapp.cs.cmu.edu/3e/datalab-handout.tar)

其中有一些工具：

`btest` 可以用来测试，`btest -f func_name` 可以测试指定函数，`-1 value1 -2 value2 - 3 value3` 可以指定测试参数

`dlc -e bits.c` 可以纠正风格和统计操作符数量

`ishow` 和 `fshow` 可以分别显示 int 和 float 的相关信息，比如

```shell
❯ ./ishow 127
Hex = 0x0000007f,       Signed = 127,   Unsigned = 127
```

```shell
❯ ./fshow 3.75

Floating point value 3.75
Bit Representation 0x40700000, sign = 0, exponent = 0x80, fraction = 0x700000
Normalized.  +1.8750000000 X 2^(1)
```

具体见 `ishow -h` 和 `fshow -h`

`driver.pl` 用来评分

---

确实得写Lab，我一开始只想看书，但试了下发现不实践不会遇到很多诡异的需求...

好几个问题都无从下手，奇怪的技巧，~~被迫借鉴思路~~...相比只下 Rating 4 的两个 float 显得简单很多。

实现太丑陋了，在写完全部 Lab 之前不公开 =_=

```
❯ ./driver.pl
1. Running './dlc -z' to identify coding rules violations.

2. Compiling and running './btest -g' to determine correctness score.
gcc -O -Wall -m32 -lm -o btest bits.c btest.c decl.c tests.c 

3. Running './dlc -Z' to identify operator count violations.

4. Compiling and running './btest -g -r 2' to determine performance score.
gcc -O -Wall -m32 -lm -o btest bits.c btest.c decl.c tests.c 

5. Running './dlc -e' to get operator count of each function.

Correctness Results     Perf Results
Points  Rating  Errors  Points  Ops     Puzzle
1       1       0       2       7       bitXor
1       1       0       2       1       tmin
1       1       0       2       7       isTmax
2       2       0       2       7       allOddBits
2       2       0       2       2       negate
3       3       0       2       12      isAsciiDigit
3       3       0       2       8       conditional
3       3       0       2       20      isLessOrEqual
4       4       0       2       5       logicalNeg
4       4       0       2       49      howManyBits
4       4       0       2       18      floatScale2
4       4       0       2       19      floatFloat2Int
4       4       0       2       8       floatPower2

Score = 62/62 [36/36 Corr + 26/26 Perf] (163 total operators)
```