---
title: CSAPP Cache Lab
sticky: false
mermaid: false
tags:
categories:
cover: images/csapp/memory_mountain.png
comments:
copyright:
sponsor:
---

这是 CSAPP Lab 记录的第五弹————CacheLab。

<!-- more -->

在此放一张在笔记本上跑出来的 Memory Mountain。

![Memory Mountain](/images/csapp/memory_mountain.png)

配置如下：

```
❯ fastfetch
        _,met$$$$$gg.          z0z0r4@DESKTOP-TKC6ATT
     ,g$$$$$$$$$$$$$$$P.       ----------------------
   ,g$$P""       """Y$$.".     OS: Debian GNU/Linux 13 (trixie) x86_64
  ,$$P'              `$$$.     Host: Windows Subsystem for Linux - Debian (2.6.3.0)
',$$P       ,ggs.     `$$b:    Kernel: Linux 6.6.87.2-microsoft-standard-WSL2
`d$$'     ,$P"'   .    $$$     Uptime: 10 hours, 52 mins
 $$P      d$'     ,    $$P     Packages: 1446 (dpkg)
 $$:      $$.   -    ,d$$'     Shell: zsh 5.9
 $$;      Y$b._   _,d$P'       Display (rdp-0): 2560x1440 @ 60 Hz
 Y$$.    `.`"Y$$$$P"'          WM: WSLg 1.0.71 (Wayland)
 `$$b      "-.__               Terminal: Windows Terminal
  `Y$$b                        CPU: Intel(R) Core(TM) i5-9300H (8) @ 2.40 GHz
   `Y$$.                       GPU 1: NVIDIA GeForce GTX 1650 (3.84 GiB) [Discrete]
     `$$b.                     GPU 2: Intel(R) UHD Graphics 630 (128.00 MiB) [Integrated]
       `Y$$b.                  Memory: 1.42 GiB / 15.54 GiB (9%)
         `"Y$b._               Swap: 0 B / 4.00 GiB (0%)
             `""""             Disk (/): 30.70 GiB / 1006.85 GiB (3%) - ext4
                               Disk (/mnt/c): 151.75 GiB / 169.60 GiB (89%) - 9p
                               Disk (/mnt/d): 289.54 GiB / 305.89 GiB (95%) - 9p
                               Disk (/mnt/e): 529.46 GiB / 931.50 GiB (57%) - 9p
                               Local IP (eth0): 192.168.1.220/24
                               Battery (Microsoft Hyper-V Virtual Battery): 97% [AC Connected]
                               Locale: en_US.UTF-8
```

---

PartA 参考自 [CSAPP第六章 - 存储器层次结构](https://www.caiwen.work/post/csapp-6)（Part B 他写的太玄乎看不懂）。

在 [Lab Assignments](https://csapp.cs.cmu.edu/3e/labs.html) 下载 [cachelab-handout.tar](https://csapp.cs.cmu.edu/3e/cachelab-handout.tar)。

以下只需要修改 `csim.c` 和 `trans.c` 两个文件。

## Part A

按照要求完成一个简单的 cache 模拟器。

1. 读取用 Valgrind 的内存访问记录生成的 `.trace` 文件，每一行格式为 `<op> <addr> <size>`，其中 `<op>` 是 `L`（load）或 `S`（store）或者 `M`（modify），`<addr>` 是内存地址，`<size>` 是访问字节数。

2. 读取 CLI 参数构建缓存，其中 `-s <s>` 是 set index 的位数，`-E <E>` 是每个 set 中的行数，`-b <b>` 是 block offset 的位数。

3. 模拟访问，其中 `L` 和 `S` 代表一次访问，`M` 代表两次访问（一次 load 一次 store）。每次访问都要判断是命中、未命中还是替换。当没有空余行的时候，按照 LRU 策略，淘汰最近最久未被使用的行。（注意替换也算一次未命中）

4. 按照读取的 `traces` 的顺序模拟对 cache 的访问，统计命中、未命中和替换的次数，传给 `printSummary` 函数输出。

<details>
<summary>参考实现</summary>

```c
#include "cachelab.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

char *file_name;
int s, E, b, group_cnt, trace_count;
int hit_count = 0, miss_count = 0, eviction_count = 0;
struct cacheGroup *cache;

struct trace
{
    char operation;
    int address;
    int size;
};

struct cacheRow
{
    int valid;
    long long tag;
    int last_time;
};

struct cacheGroup
{
    struct cacheRow *lines;
};

void parseAddress(int address, int *group_index, long long *tag, int *block_offset)
{
    *group_index = (address >> b) & ((1 << s) - 1);
    *tag = (long long)(address >> (b + s));
    *block_offset = address & ((1 << b) - 1);
}

struct trace *readTraceFile()
{
    FILE *file = fopen(file_name, "r");
    if (file == NULL)
    {
        fprintf(stderr, "Error opening file: %s\n", file_name);
        exit(1);
    }
    char operation;
    int address, size;
    int traces_size = 1000;
    struct trace *traces = malloc(sizeof(struct trace) * traces_size);
    trace_count = 0;
    while (fscanf(file, " %c %x,%d", &operation, &address, &size) == 3)
    {
        struct trace t = {operation, address, size};
        *(traces + trace_count++) = t;
        if (trace_count >= traces_size)
        {
            traces_size *= 2;
            traces = realloc(traces, sizeof(struct trace) * traces_size);
        }
    }
    fclose(file);
    return traces;
}

int str2int(char *str)
{
    int result = 0;
    while (*str)
    {
        result = result * 10 + (*str - '0');
        str++;
    }
    return result;
}

void parseArguments(int argc, char *argv[])
{
    for (int i = 1; i < argc; i += 2)
    {
        if (argv[i][1] == 't')
        {
            file_name = argv[i + 1];
        }
        else
        {
            int val = str2int(argv[i + 1]);
            switch (argv[i][1])
            {
            case 's':
                s = val;
                break;
            case 'E':
                E = val;
                break;
            case 'b':
                b = val;
                break;
            }
        }
    }
    group_cnt = 1 << s;
}

void touchCache(int group_index, long long tag)
{
    int empty_line_index = -1;
    for (int i = 0; i < E; i++)
    {
        if (cache[group_index].lines[i].valid && cache[group_index].lines[i].tag == tag)
        {
            // hit case
            cache[group_index].lines[i].last_time = clock();
            hit_count++;
            return;
        }
        else
        {
            if (!cache[group_index].lines[i].valid)
            {
                // record empty line
                empty_line_index = i;
            }
        }
    }

    miss_count++;

    // if group has empty line
    if (empty_line_index != -1)
    {
        cache[group_index].lines[empty_line_index].valid = 1;
        cache[group_index].lines[empty_line_index].tag = tag;
        cache[group_index].lines[empty_line_index].last_time = clock();
        return;
    }

    // if we reach here, where no empty line, it means we have a miss and need to evict
    eviction_count++;
    int lru_index = 0;
    for (int i = 1; i < E; i++)
    {
        if (cache[group_index].lines[i].last_time < cache[group_index].lines[lru_index].last_time)
        {
            lru_index = i;
        }
    }

    // evict the LRU line
    cache[group_index].lines[lru_index].tag = tag;
    cache[group_index].lines[lru_index].last_time = clock();
}

void simulateCache(struct trace *traces)
{
    cache = malloc(sizeof(struct cacheGroup) * group_cnt);
    for (int i = 0; i < group_cnt; i++)
    {
        cache[i].lines = malloc(sizeof(struct cacheRow) * E);
        for (int j = 0; j < E; j++)
        {
            cache[i].lines[j].valid = 0;
            cache[i].lines[j].tag = 0;
            cache[i].lines[j].last_time = 0;
        }
    }

    for (int i = 0; i < trace_count; i++)
    {
        int group_index, block_offset;
        long long tag;
        parseAddress(traces[i].address, &group_index, &tag, &block_offset);
        if (traces[i].operation == 'L' || traces[i].operation == 'S')
        {
            touchCache(group_index, tag);
        }
        else if (traces[i].operation == 'M')
        {
            touchCache(group_index, tag);
            touchCache(group_index, tag);
        }
    }
}

int main(int argc, char *argv[])
{
    parseArguments(argc, argv);
    struct trace *traces = readTraceFile();
    simulateCache(traces);
    printSummary(hit_count, miss_count, eviction_count);
    return 0;
}
```

</details>

## Part B

完成对 $32 \times 32$、$64 \times 64$ 和 $61 \times 67$ 三种矩阵的转置优化，在 `trans.c` 中实现 `transpose_submit` 函数。

最简单的实现当然是直接挨个交换元素：

```c
/* 
 * trans - A simple baseline transpose function, not optimized for the cache.
 */
char trans_desc[] = "Simple row-wise scan transpose";
void trans(int M, int N, int A[N][M], int B[M][N])
{
    int i, j, tmp;

    for (i = 0; i < N; i++) {
        for (j = 0; j < M; j++) {
            tmp = A[i][j];
            B[j][i] = tmp;
        }
    }    

}
```

参考 [cachelab.pdf](https://csapp.cs.cmu.edu/3e/cachelab.pdf) 中 5.2.1 Performance 说到

> For each matrix size, the performance of your transpose_submit function is evaluated by using
valgrind to extract the address trace for your function, and then using the reference simulator to replay
this trace on a cache with parameters `(s = 5, E = 1, b = 5)`.

那么最多有 $2^5 = 32$ 个缓存行，每行长度为 $2^5 = 32$ 字节，每个 `int` 元素占 4 字节，所以每行可以存储 8 个元素。

#### 32*32

对于 $32 \times 32$ 的矩阵，我们可以将其分成 $8 \times 8$ 的小块进行转置。

```c
void transpose_block(int M, int N, int A[N][M], int B[M][N], int si, int sj, int block_length) {
    int i, j, tmp;
    for (i = si; i < si + block_length && i < N; i++) {
        for (j = sj; j < sj + block_length && j < M; j++) {
            tmp = A[i][j];
            B[j][i] = tmp;
        }
    }
}

void transpose_submit(int M, int N, int A[N][M], int B[M][N])
{
    int i, j;
    int block_length = 8;
    for (i = 0; i < N; i+=block_length) {
        for (j = 0; j < M; j+=block_length) {
            transpose_block(M, N, A, B, i, j, block_length);
        }
    }
}
```

结果为

```
❯ ./test-trans -M 32 -N 32

Function 0 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 0 (Transpose submission): hits:1709, misses:344, evictions:312

Function 1 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 1 (Simple row-wise scan transpose): hits:869, misses:1184, evictions:1152

Summary for official submission (func 0): correctness=1 misses=344
```

以上是逐个元素交换，那么假如 `A[i]` 行映射的组和 `B[j]` 行的映射的组相同，那么在访问 `B[j][i]` 时会踢出 `A[i]` 行存入 `B[j]`，继续交换到 `B[j+1]` 时也需要读取 `A[i]` 行得到 `A[i][j+1]`，就会一直互相冲突。

显然如果一次性取出 `A[i][j]` 到 `A[i][j+7]` 的 8 个元素存入寄存器中，就算写入 `B[j]` 有冲突，那么就可以避免上述问题。

```c
void transpose_block(int M, int N, int A[N][M], int B[M][N], int si, int sj, int block_length) {
    int a0, a1, a2, a3, a4, a5, a6, a7;
    for (int i = si; i < si + block_length && i < N; i++) {
        a0 = A[i][sj];
        a1 = A[i][sj + 1];
        a2 = A[i][sj + 2];
        a3 = A[i][sj + 3];
        a4 = A[i][sj + 4];
        a5 = A[i][sj + 5];
        a6 = A[i][sj + 6];
        a7 = A[i][sj + 7];

        B[sj][i] = a0;
        B[sj + 1][i] = a1;
        B[sj + 2][i] = a2;
        B[sj + 3][i] = a3;
        B[sj + 4][i] = a4;
        B[sj + 5][i] = a5;
        B[sj + 6][i] = a6;
        B[sj + 7][i] = a7;
    }
}
```

结果为

```
❯ ./test-trans -M 32 -N 32

Function 0 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 0 (Transpose submission): hits:1765, misses:288, evictions:256

Function 1 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 1 (Simple row-wise scan transpose): hits:869, misses:1184, evictions:1152

Summary for official submission (func 0): correctness=1 misses=288

TEST_TRANS_RESULTS=1:288
```
---

以下是做完整个实验之后的复盘。在进入 64*64 之前，这里应该思考一下：

- 为什么在 B 竖着写入的时候，B 的每一行之间不会有冲突？

考虑到一个缓存行可以存 32 bytes，也就是 8 个元素，由于 32*32 的矩阵每行有 32 个元素，所以每行占用 4 个缓存行，每 8 行才会将内存映射到同一行中。而分块为 8\*8，这决定了分块矩阵内任意两行不可能映射到同一行中，因此自身行之间不会有冲突。

- 什么情况下 B 的行之间可能有冲突？假如有冲突会发生什么？

考虑下方的 64*64 的矩阵，每行有 64 个元素，占用 8 个缓存行，每 4 行就会映射到同一行中。如果分块为 8\*8，这决定了分块矩阵内 0~3 行和 4~7 行会分别映射到同一行中，因此在写入 B 的时候，前 4 行和后 4 行互相踢出缓存。

- 剩下的 288 个未命中是怎么产生的？

当分块在对角线上时，A 和 B 的分块的每一行都映射到同一行中，导致大量未命中。

非对角线上的分块应该不会这样。

#### 64*64

$8 \times 8$ 的块大小直接套用到 $64 \times 64$ 的矩阵上，结果很差：

```
❯ ./test-trans -M 64 -N 64

Function 0 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 0 (Transpose submission): hits:3585, misses:4612, evictions:4580

Function 1 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 1 (Simple row-wise scan transpose): hits:3473, misses:4724, evictions:4692

Summary for official submission (func 0): correctness=1 misses=4612

TEST_TRANS_RESULTS=1:4612
```

将 `block_length` 改为 16 之后，为什么结果没变...？依旧是 `hits:3585, misses:4612, evictions:4580`。

> 这个模拟器是不是有问题.jpg 按道理 `block_length` 从 8 变成 16，`misses` 应该会增加才对
> 但是对于 $32 \times 32$ 的矩阵倒是显著增大了 `misses`，从 288 增加到了 1156
> ```
> ❯ ./test-trans -M 32 -N 32
>
> Function 0 (2 total)
> Step 1: Validating and generating memory traces
> Step 2: Evaluating performance (s=5, E=1, b=5)
> func 0 (Transpose submission): hits:897, misses:1156, evictions:1124
>
> Function 1 (2 total)
> Step 1: Validating and generating memory traces
> Step 2: Evaluating performance (s=5, E=1, b=5)
> func 1 (Simple row-wise scan transpose): hits:869, misses:1184, evictions:1152
>
> Summary for official submission (func 0): correctness=1 misses=1156
> 
> TEST_TRANS_RESULTS=1:1156
> ```

既然矩阵每四行就会映射到同一行中，那么考虑分块为 $4 \times 4$，这样就可以保证分块内任意两行都不会映射到同一行中，结果如下：

```
❯ ./test-trans -M 64 -N 64

Function 0 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 0 (Transpose submission): hits:6497, misses:1700, evictions:1668

Function 1 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 1 (Simple row-wise scan transpose): hits:3473, misses:4724, evictions:4692

Summary for official submission (func 0): correctness=1 misses=1700

TEST_TRANS_RESULTS=1:1700
```

满分要求是 1300 个未命中。

虽然这样也优化了，但缓存行每次读取 8 个元素而只利用了 4 个元素，非常浪费。

> ~~经过和 AI 与 参考的殊死搏斗，折磨一晚上，终于跌跌撞撞理解了以下内容~~

将矩阵 A 和 B 按照 $8 \times 8$ 的块进行划分后再对分块划分为 $4 \times 4$ 的子块，分别为 $A_{11}, A_{12}, A_{21}, A_{22}$，以及 $B_{11}, B_{12}, B_{21}, B_{22}$。

我们可以轻松转置 $A_{11}$ 到 $B_{11}$，$A_{22}$ 到 $B_{22}$，但是还有 $A_{12}$ 和 $A_{21}$。

又因为我们需要想办法利用读取 $A_{11}$ 的时候读取到的 $A_{12}$（也就是已经读取了 A 的前四行），但是又不能直接写入完 $B_{11}$ 后再写入 $B_{21}$ （每四行冲突）。

而写入 $B_{11}$ 的时候，$B_{12}$ 也会被缓存，而 $B_{12}$ 是空的。这样就可以利用 $B_{12}$ 来暂存 $A_{12}$ 的数据。（可以先将 $A_{21}$ 转置到 $B_{12}$）

以上是第一步，然后第二步是将 $A_{21}$ 转置到 $B_{12}$，同时将 $B_{12}$ 中的 $A_{12}^T$ 写入 $B_{11}$。

最后，第三步，将 $A_{22}$ 转置到 $B_{22}$。

```c

void transpose_block_8_for_64_64(int M, int N, int A[N][M], int B[M][N], int si, int sj)
{
    int a0, a1, a2, a3, a4, a5, a6, a7;
    for (int i = si; i < si + 4; i++)
    {
        a0 = A[i][sj];
        a1 = A[i][sj + 1];
        a2 = A[i][sj + 2];
        a3 = A[i][sj + 3];

        a4 = A[i][sj + 4];
        a5 = A[i][sj + 5];
        a6 = A[i][sj + 6];
        a7 = A[i][sj + 7];

        B[sj][i] = a0;
        B[sj + 1][i] = a1;
        B[sj + 2][i] = a2;
        B[sj + 3][i] = a3;

        // A12 -> B12，先转置，后续直接平移列到 B21
        B[sj + 0][i + 4] = a4;
        B[sj + 1][i + 4] = a5;
        B[sj + 2][i + 4] = a6;
        B[sj + 3][i + 4] = a7;
    }

    /* 这个版本会在 B 的 0~3 和 4~7 之间读写，缓存失效 */
    // for (int i = si + 4; i < si + 8; i++)
    // {
    //     // read A21 line
    //     a0 = A[i][sj];
    //     a1 = A[i][sj + 1];
    //     a2 = A[i][sj + 2];
    //     a3 = A[i][sj + 3];

    //     // read B12 column
    //     a4 = B[sj][i];
    //     a5 = B[sj + 1][i];
    //     a6 = B[sj + 2][i];
    //     a7 = B[sj + 3][i];

    //     // write A21 line to B12 column
    //     B[sj][i] = a0;
    //     B[sj + 1][i] = a1;
    //     B[sj + 2][i] = a2;
    //     B[sj + 3][i] = a3;

    //     // write B21 column
    //     B[sj + 4][i - 4] = a4;
    //     B[sj + 5][i - 4] = a5;
    //     B[sj + 6][i - 4] = a6;
    //     B[sj + 7][i - 4] = a7;
    // }

    /* 这个版本按列读取 A 然后按行写入 B 失效数量明显减少 */
    for (int j = sj; j < sj + 4; j++)
    {
        // read A21 column
        a0 = A[si + 4][j];
        a1 = A[si + 5][j];
        a2 = A[si + 6][j];
        a3 = A[si + 7][j];

        // read B12 row
        a4 = B[j][si + 4];
        a5 = B[j][si + 5];
        a6 = B[j][si + 6];
        a7 = B[j][si + 7];

        // write A21 column to B12 row
        B[j][si + 4] = a0;
        B[j][si + 5] = a1;
        B[j][si + 6] = a2;
        B[j][si + 7] = a3;

        // write B12 row to B21 row
        B[j + 4][si] = a4;
        B[j + 4][si + 1] = a5;
        B[j + 4][si + 2] = a6;
        B[j + 4][si + 3] = a7;
    }

    // A22 -> B22, 直接转置
    for (int i = si + 4; i < si + 8; i++)
    {
        a0 = A[i][sj + 4];
        a1 = A[i][sj + 4 + 1];
        a2 = A[i][sj + 4 + 2];
        a3 = A[i][sj + 4 + 3];

        B[sj + 4][i] = a0;
        B[sj + 4 + 1][i] = a1;
        B[sj + 4 + 2][i] = a2;
        B[sj + 4 + 3][i] = a3;
    }
}

void transpose_64_64(int M, int N, int A[N][M], int B[M][N])
{
    int block_length = 8;
    for (int i = 0; i < N; i += block_length)
    {
        for (int j = 0; j < M; j += block_length)
        {
            transpose_block_8_for_64_64(M, N, A, B, i, j);
        }
    }
}
```

测试得到：

```
❯ ./test-trans -M 64 -N 64

Function 0 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 0 (Transpose submission): hits:9065, misses:1180, evictions:1148

Function 1 (2 total)
Step 1: Validating and generating memory traces
Step 2: Evaluating performance (s=5, E=1, b=5)
func 1 (Simple row-wise scan transpose): hits:3473, misses:4724, evictions:4692

Summary for official submission (func 0): correctness=1 misses=1180

TEST_TRANS_RESULTS=1:1180
```

其实和 32*32 的过程没有太多差别，只是多了个每四行冲突的问题。

> 实验工具的分析细粒度还是有点低，只有 Summary，也许有需要可以根据 trace 来具体分析吧...

#### 61*67

测试 4、8、16 的分块，可以发现 16 的分块效果最好，通过了...

> 我还以为又有奇淫巧计，参考前人史料发现寥寥两行

> 此时 61 不是二次幂，冲突不在对角线上，或许减少？没分析...

## Summary

> 注意：`driver.py` 是 Python2 写的，得改成 Python3 才能运行。

最终结果：
```
❯ python3 driver.py
Part A: Testing cache simulator
Running ./test-csim
                        Your simulator     Reference simulator
Points (s,E,b)    Hits  Misses  Evicts    Hits  Misses  Evicts
     3 (1,1,1)       9       8       6       9       8       6  traces/yi2.trace
     3 (4,2,4)       4       5       2       4       5       2  traces/yi.trace
     3 (2,1,4)       2       3       1       2       3       1  traces/dave.trace
     3 (2,1,3)     167      71      67     167      71      67  traces/trans.trace
     3 (2,2,3)     201      37      29     201      37      29  traces/trans.trace
     3 (2,4,3)     212      26      10     212      26      10  traces/trans.trace
     3 (5,1,5)     231       7       0     231       7       0  traces/trans.trace
     6 (5,1,5)  265189   21775   21743  265189   21775   21743  traces/long.trace
    27


Part B: Testing transpose function
Running ./test-trans -M 32 -N 32
Running ./test-trans -M 64 -N 64
Running ./test-trans -M 61 -N 67

Cache Lab summary:
                        Points   Max pts      Misses
Csim correctness          27.0        27
Trans perf 32x32           8.0         8         288
Trans perf 64x64           8.0         8        1180
Trans perf 61x67          10.0        10        1993
          Total points    53.0        53
```

---

这一天下来，问了无数次 AI。实测对于这些内容，训练时应该有 Cache Lab 的语料，AI 可以提供一份能通过的代码，但是没法解释清楚（起码我没听懂），未能给出关键矛盾。也许是语料里也没有分析过程吧...那这篇文章说不定也会被拿去训练？~~不过可能因为质量太差被清洗掉吧...~~