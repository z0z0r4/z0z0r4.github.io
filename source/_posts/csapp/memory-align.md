---
title: CSAPP Memory Align
sticky: false
mermaid: false
date: 2026-01-16 13:26:17
tags:
  - CSAPP
  - learning-notes
categories:
  - learning-notes
  - CS
  - CSAPP
cover:
comments:
copyright:
sponsor:
---

关于内存对齐的学习。

# 定义

当内存地址 $a$ 是 $n$ 的倍数，其中 $n$ 是 2 的幂时，称地址 $a$ 是 $n$ 字节对齐的。

当被访问的数据长度是 $n$ 字节且起始地址 $n$ 字节对齐，那么该数据是对齐的，否则是不对齐的。

# 基本类型的对齐

- char 是 1 字节对齐

- short 是 2 字节对齐

- int 是 4 字节对齐

- long 是 4 字节对齐（32 位系统）或 8 字节对齐（64 位系统）

- long long 是 4 字节对齐（32 位系统）或 8 字节对齐（64 位系统）

- float 是 4 字节对齐

- double 是 8 字节对齐

- long double 是 8 字节对齐（Visual C++）或者 16 字节对齐（GCC）

- pointer 是 4 字节对齐（32 位系统）或 8 字节对齐（64 位系统）

# 结构体的对齐

结构体 `struct` 的根据成员的对齐要求进行对齐，保证每一个成员的起始地址都是对齐的。

结构体的总大小需要是其成员的最大对齐要求的整数倍，如果不是则需要在末尾进行填充。

比如下面的结构体，摘自 [Wikipedia Data_structure_alignment #Typical_alignment_of_C_structs_on_x86](https://en.wikipedia.org/wiki/Data_structure_alignment#Typical_alignment_of_C_structs_on_x86)：

```c
struct MixedData
{
    char Data1;
    short Data2;
    int Data3;
    char Data4;
};
```

- Data1：char，占用 1 字节，起始地址 0，char 对齐要求 1 字节

- 填充 1 字节，使 Data2 起始地址为 2，short 对齐要求 2 字节

- Data2：short，占用 2 字节，起始地址 2

- Data3：int，占用 4 字节，起始地址 4，int 对齐要求 4 字节

- Data4：char，占用 1 字节，起始地址 8，char 对齐要求 1 字节

最后，结构体成员的最大对齐要求是 4 字节，因此结构体的总大小需要是 4 的倍数。当前大小为 9 字节，需要在末尾填充 3 字节，使得总大小为 12 字节。

很显然可以通过调整成员顺序减少填充，减少内存占用：

```c
struct MixedDataReordered
{
    char Data1;
    char Data4;
    short Data2;
    int Data3;
};
```

最后占用 8 字节，没有填充。