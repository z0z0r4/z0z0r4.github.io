---
title: CSAPP Malloc Lab
sticky: false
mermaid: false
date: 2026-05-03 14:14:01
tags:
  - CSAPP
  - study-notes
categories:
  - study-notes
  - CS
  - CSAPP
cover: images/csapp/chisato_doubt.png
comments:
copyright:
sponsor:
---

做梦都是指针和利用率=-=

<!-- more -->

封面取自莉可莉丝第一季 EP5 02:39，很符合我的精神状态。

参考过以下内容：

- [更适合北大宝宝体质的 Malloc Lab 踩坑记](https://arthals.ink/blog/malloc-lab)

  Amazing！很详细，但我自己实现的时候没细看，不然我吃什么 =-=

- [小土刀 【读厚 CSAPP】VI Malloc Lab](https://www.wdxtub.com/blog/csapp/thick-csapp-lab-6)

  并没有具体的细节，但可以参考指针操作，少走点弯路

- [Github StuartSul/CSAPP3e_MallocLab_Implementation](https://github.com/StuartSul/CSAPP3e_MallocLab_Implementation)

  高达 98/100 分的实现（这里面有些地方我个人觉得并非最优解，但是在最后走投无路时，以他的实现为参考，我终于把 `realloc` 的利用率终于拉上来了...见后文记录）

从 [Malloclab-Handout](https://csapp.cs.cmu.edu/3e/malloclab-handout.tar) 下载本实验，但是这里面缺少了 `traces` 文件夹，可以在我的仓库 [z0z0r4/CSAPP-LAB](https://github.com/z0z0r4/CSAPP-LAB/tree/main/malloclab) 里面下载（我也是从别的仓库下载的=-=）

trace 文件，指的是 `traces` 文件夹里面的 `.rep` 文件，这些文件记录了 `malloc`、`free` 和 `realloc` 的调用序列，测试程序会按照这些序列来调用你的 `malloc` 实现。

其中 `mdriver` 是评测程序：

- `-h` 可以查看帮助
- `-f trace.rep` 可以测试指定的 trace 文件
- `-t <dir>` 可以指定测试文件的文件夹
- `-v` 用于显示评测结果
- `-V` 用于显示额外的调试信息（实际上并没有显示什么有用的信息）
- `-l` 显示 glibc malloc 的测试结果，作为对比（但是如下可见它不显示 glibc malloc 的利用率，只有吞吐量）

```
z0z0r4@DESKTOP-862S1HV:~/CSAPP-LAB/malloclab$ ./mdriver -h
Usage: mdriver [-hvVal] [-f <file>] [-t <dir>]
Options
        -a         Don't check the team structure.
        -f <file>  Use <file> as the trace file.
        -g         Generate summary info for autograder.
        -h         Print this message.
        -l         Run libc malloc as well.
        -t <dir>   Directory to find default traces.
        -v         Print per-trace performance breakdowns.
        -V         Print additional debug info.
```

评测结果会显示每个 trace 的 `util`（利用率）和 `thru`（吞吐量）信息，以及平均利用率和总耗时。

- valid: 是否正确
- util: 利用率，越高越好
- ops: 操作数量，这是根据 trace 文件固定的
- secs: 耗时，越低越好
- Kops: 吞吐量，越高越好

经过长达六天的折磨，终于将利用率凹到了 97%，最终得分 58 (util) + 40 (thru) = 98/100。

```
Team Name:咕咕咕
Member 1 :z0z0r4:z0z0r4@outlook.com
Using default tracefiles in traces/
Measuring performance with gettimeofday().

Results for libc malloc:
trace  valid  util     ops      secs  Kops
 0       yes    0%    5694  0.000414 13767
 1       yes    0%    5848  0.000265 22035
 2       yes    0%    6648  0.001068  6225
 3       yes    0%    5380  0.001067  5041
 4       yes    0%   14400  0.000436 32997
 5       yes    0%    4800  0.000936  5127
 6       yes    0%    4800  0.000587  8177
 7       yes    0%   12000  0.000311 38610
 8       yes    0%   24000  0.000552 43478
 9       yes    0%   14401  0.001392 10349
10       yes    0%   14401  0.000205 70215
Total           0%  112372  0.007233 15536

Results for mm malloc:
trace  valid  util     ops      secs  Kops
 0       yes   99%    5694  0.000453 12570
 1       yes   99%    5848  0.000468 12509
 2       yes   99%    6648  0.000575 11566
 3       yes   99%    5380  0.000443 12153
 4       yes   95%   14400  0.000638 22567
 5       yes   96%    4800  0.000673  7135
 6       yes   95%    4800  0.000634  7569
 7       yes   95%   12000  0.002629  4565
 8       yes   88%   24000  0.002540  9451
 9       yes   99%   14401  0.000453 31811
10       yes   99%   14401  0.000538 26758
Total          97%  112372  0.010042 11190

Perf index = 58 (util) + 40 (thru) = 98/100
```

我使用的是 CSAPP Labs 官网提供的 Handout 自带的评分标准，不同学校的老师和助教可能自行调整了评分标准和测试样例，可能有所差异。

> 北大的 ICS 用的是 CSAPP 欸...有点羡慕，SCNU 何时崛起 =-=

下面是分数的具体计算方式：

- `util`（利用率）的分数根据平均利用率计算，满分为 60 分，利用率越高分数越高。
- `thru`（吞吐量）的分数根据平均吞吐量与 glib malloc 的平均吞吐量的比值计算，满分为 40 分，吞吐量越高分数越高。

注意到实际上 `AVG_LIBC_THRUPUT` 写死为 600Kops/sec，而这个值可能是参考 14 年的算力取的值，在今天怕是已经过时了...

> 难怪这么容易达成满分吞吐量...我是在写完整个 Lab 之后才发现的，就不用 glib malloc 的实时数据为基准了，否则我还得继续凹吞吐量，太累了...

以下取自官网：

> Malloc Lab [Updated 9/2/14]
>
> Students implement their own versions of malloc, free, and realloc. This lab gives students a clear understanding of data layout and organization, and requires them to evaluate different trade-offs between space and time efficiency. One of our favorite labs. When students finish this one, they really understand pointers!

以下分数计算部分的代码：

<details>
<summary>分数计算代码</summary>

```c
/*
* This constant gives the estimated performance of the libc malloc
* package using our traces on some reference system, typically the
* same kind of system the students use. Its purpose is to cap the
* contribution of throughput to the performance index. Once the
* students surpass the AVG_LIBC_THRUPUT, they get no further benefit
* to their score.  This deters students from building extremely fast,
* but extremely stupid malloc packages.
*/
#define AVG_LIBC_THRUPUT      600E3  /* 600 Kops/sec */

/*
    * Accumulate the aggregate statistics for the student's mm package
    */
secs = 0;
ops = 0;
util = 0;
numcorrect = 0;
for (i=0; i < num_tracefiles; i++) {
secs += mm_stats[i].secs;
ops += mm_stats[i].ops;
util += mm_stats[i].util;
if (mm_stats[i].valid)
    numcorrect++;
}
avg_mm_util = util/num_tracefiles;

/*
    * Compute and print the performance index
    */
if (errors == 0) {
avg_mm_throughput = ops/secs;

p1 = UTIL_WEIGHT * avg_mm_util;
if (avg_mm_throughput > AVG_LIBC_THRUPUT) {
    p2 = (double)(1.0 - UTIL_WEIGHT);
}
else {
    p2 = ((double) (1.0 - UTIL_WEIGHT)) *
    (avg_mm_throughput/AVG_LIBC_THRUPUT);
}

perfindex = (p1 + p2)*100.0;
printf("Perf index = %.0f (util) + %.0f (thru) = %.0f/100\n",
        p1*100,
        p2*100,
        perfindex);

}
else { /* There were errors */
perfindex = 0.0;
printf("Terminated with %d errors\n", errors);
}

```

</details>

---

介于显然需要大量操作指针，位读取写入，设计一套可靠的宏/辅助函数是必要的，但是很容易走弯路。

比如我一开始没封装 `GET(ptr)` 和 `PUT(ptr, val)`，这种最基础的操作，而是直接在 `GET_SIZE` 和 `GET_ALLOC` 里面操作，直接导致大量时间花在 DEBUG 上

又比如在写各个函数时，显然会遇到块的指针 `chunk_ptr` 和 `payload_ptr` 的混淆问题，让一开始以 `payload_ptr` 为基准设计函数和宏，那么可有的好受了...

有以下槽点/坑：

- 任何有意义的常量都应该写为 `#define`

- 尽可能不要在函数里直接操作指针，都应该封装为单独的函数/宏

- - 其中多过程的操作应该封装为函数，而且不应该吝啬行数，尽可能写中间变量，方便 DEBUG

- - 要注意 `void *` 不能直接运算，需要先转为比如 `char *` 才能加减

- 每修改完一点并通过测试后，都应该保存版本！

- 适当将判断条件也用 `int xx_flag` 来存储，方便 DEBUG

在具体三个函数的实现之前，我还学到了如何配置 `.vscode` 结合 GDB 调试，记录一下：

<details>
<summary>VSCode 调试配置</summary>

```json
// tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "make build",
            "type": "shell",
            "command": "make clean && make mdriver",
            "options": {
                "cwd": "${workspaceFolder}"
            },
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "problemMatcher": ["$gcc"],
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            }
        }
    ]
}

// launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch Malloc Lab",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/mdriver",
            "args": [
                "-t", "traces",
                "-v",
                "-l"
            ],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
                {
                    "description": "为 gdb 启用整齐打印",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                },
                {
                    "description": "Disable debuginfod to prevent hanging",
                    "text": "set debuginfod enabled off",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "make build",
            "miDebuggerPath": "/usr/bin/gdb"
        }
    ]
}
```

</details>

其中注意 `set debuginfod enabled off` 可能对于编译成功但是 launch 后没有任何输出有帮助（在 ArchLinux 上遇到过，没细看，据说和联网下载某 DEBUG 所需文件有关）

---

## Lab 的内置函数和要求

### 内置函数

Lab 中提供了以下自带函数：

- `mem_sbrk(int incr)`：向系统申请 `incr` 字节的内存，返回指向新内存块的指针，失败时返回 `(void *)-1`

- `mem_heap_lo()`：返回堆的起始地址

- `mem_heap_hi()`：返回堆的结束地址（注意到，这个地址是堆的最后一个字节的地址，而不是最后一个字节的下一个地址）

其他函数没用上，忽略。

### 编程要求

参考 [PDF](https://csapp.cs.cmu.edu/3e/malloclab.pdf) 中的 Programming Rules,这里不再赘述.

> 我天 2001 年的 PDF...

## 具体实现

按照我所经历的思路是先隐式链表，再显式链表，最后改进为分离链表。

### 隐式链表

先设计隐式链表的 Chunk 的结构，包含 Header 和 Footer。

其中 Header 和 Footer 内容一样，要记录 Chunk Size 和 Allocated Flag，这样获得 Header 就可以往下遍历，获得 Footer 就可以往上遍历，用于后续的合并 Chunk。

考虑到 4 字节的 size 足以记录 4GB 的内存，又注意到 Chunk Size 总是 8 字节对齐的，后三位总是 0，那么只需要四字节就可以存 Header 和 Footer，后三位无用，可以用于记录一些用于优化的 Flag，在此先第一位放入 Allocated Flag。

```
  4Bytes             4Bytes
| Header | Payload | Footer |
```

`Chunk Size = ALIGN(Payload Size) + Header Size + Footer Size`

因此构建以下宏：

```c
/* single word (4) or double word (8) alignment */
#define ALIGNMENT 8

/* rounds up to the nearest multiple of ALIGNMENT */
#define ALIGN(size) (((size) + (ALIGNMENT - 1)) & ~0x7)

#define SIZE_T_SIZE (ALIGN(sizeof(size_t)))

#define BUCKET_SIZE 24

#define CHUNK_HEADER_SIZE 4
#define CHUNK_FOOTER_SIZE 4

/* 用 unsigned int (4字节) */
#define GET(p) (*(unsigned int *)(p))
#define PUT(p, val) (*(unsigned int *)(p) = (unsigned int)(val))

#define PACK(size, alloc, prev_alloc) ((size) | (alloc) | ((prev_alloc) << 1))

#define PAYLOAD_TO_CHUNK(bp) ((char *)(bp) - CHUNK_HEADER_SIZE)
#define CHUNK_TO_PAYLOAD(cp) ((char *)(cp) + CHUNK_HEADER_SIZE)

#define GET_SIZE(p) (GET(p) & ~0x7)
#define GET_ALLOC(p) (GET(p) & 0x1)
```

那么可以开始考虑三种操作：

- `mm_malloc`：要么找到空闲块，要么直接 `mem_sbrk` 申请新的内存块

- `mm_free`：将块标记为未分配，并尝试与前后块合并

- `mm_realloc`：先考虑最简单的做法，直接 `mm_malloc` 新的块，然后 `memcpy` 旧块的数据到新块，最后 `mm_free` 旧块

#### `mm_free` Impl

显然相邻的空闲块需要被合并，`mm_free` 应该检查前后块是否为空闲。

检查前块可以通过 `current_chunk_ptr - CHUNK_FOOTER_SIZE` 获得前块的 Footer 地址，然后获取前块的大小，最后获取前块的地址。

检查后块可以通过 `current_chunk_ptr + current_chunk_size` 获得后块的地址。

`mm_free` 的合并可以分为四种情况：

- 前后块都分配：不合并，直接返回
- 前块分配，后块空闲：与后块合并
- 前块空闲，后块分配：与前块合并
- 前后块都空闲：与前后块合并

```c
/*
 * mm_free - Freeing a block does nothing.
 */
void mm_free(void *ptr)
{
    void *chunk_ptr = PAYLOAD_TO_CHUNK(ptr);
    size_t chunk_size = GET_SIZE(chunk_ptr);

    // merge with nearby free chunks
    void *next_chunk_ptr = (char *)chunk_ptr + chunk_size;
    void *prev_chunk_footer_ptr = (char *)chunk_ptr - CHUNK_FOOTER_SIZE;
    void *prev_chunk_ptr = (char *)chunk_ptr - GET_SIZE(prev_chunk_footer_ptr);

    int prev_chunk_free_flag = 0;
    int next_chunk_free_flag = 0;
    size_t prev_chunk_size = 0;
    size_t next_chunk_size = 0;

    void *new_free_chunk_ptr = NULL;

    if (prev_chunk_ptr >= mem_heap_lo())
    {
        prev_chunk_free_flag = !GET_ALLOC(prev_chunk_ptr);
        prev_chunk_size = GET_SIZE(prev_chunk_ptr);
    }

    if (next_chunk_ptr < mem_heap_hi())
    {
        next_chunk_free_flag = !GET_ALLOC(next_chunk_ptr);
        next_chunk_size = GET_SIZE(next_chunk_ptr);
    }

    if (!prev_chunk_free_flag && !next_chunk_free_flag)
    {
        // just set current chunk to free
        set_chunk_meta(chunk_ptr, chunk_size, 0);
        new_free_chunk_ptr = chunk_ptr;
    }
    else if (prev_chunk_free_flag && !next_chunk_free_flag)
    {
        // merge with previous
        size_t merged_chunk_size = chunk_size + prev_chunk_size;
        set_chunk_meta(prev_chunk_ptr, merged_chunk_size, 0);
        remove_chunk_from_free_linked_list(prev_chunk_ptr);
        new_free_chunk_ptr = prev_chunk_ptr;
    }
    else if (!prev_chunk_free_flag && next_chunk_free_flag)
    {
        // merge with next
        size_t merged_chunk_size = chunk_size + next_chunk_size;
        set_chunk_meta(chunk_ptr, merged_chunk_size, 0);
        remove_chunk_from_free_linked_list(next_chunk_ptr);
        new_free_chunk_ptr = chunk_ptr;
    }
    else
    {
        // merge with both
        size_t merged_chunk_size = chunk_size + prev_chunk_size + next_chunk_size;
        set_chunk_meta(prev_chunk_ptr, merged_chunk_size, 0);
        remove_chunk_from_free_linked_list(prev_chunk_ptr);
        remove_chunk_from_free_linked_list(next_chunk_ptr);
        new_free_chunk_ptr = prev_chunk_ptr;
    }

    if (new_free_chunk_ptr != NULL)
    {
        insert_chunk_to_free_linked_list(new_free_chunk_ptr);
    }
}
```

> 注意设置 Allocated Flag。
>
> 并不保证这些参考片段的正确性,都是从 Git History 里面截取的

#### `mm_malloc` Impl

`mm_malloc` 需要找出合适的空闲块，书上有三种方法：

- First Fit：从头开始遍历，找到第一个大小合适的空闲块
- Next Fit：从上次分配的位置开始遍历，找到第一个大小合适的空闲块
- Best Fit：遍历所有空闲块，找到最适合的空闲块

其中 Next Fit 可以通过一个全局变量 `rover_ptr` 来记录上次分配的位置，避免每次都从头开始遍历。

其他两种也只需要分别修改 `start_ptr` 和返回条件即可,很简单.

```c
/* Next-fit search */
void *find_free_chunk(size_t chunk_size)
{
    if (sentinel_chunk_ptr == NULL)
    {
        return NULL;
    }

    if (rover == NULL || rover == sentinel_chunk_ptr)
    {
        rover = GET_NEXT_FREE_CHUNK(sentinel_chunk_ptr);
    }

    void *start_ptr = rover;

    void *ptr = rover;
    do
    {
        size_t current_chunk_size = GET_SIZE(ptr);
        if (current_chunk_size >= chunk_size && !GET_ALLOC(ptr))
        {
            rover = GET_NEXT_FREE_CHUNK(ptr);
            return ptr;
        }
        ptr = GET_NEXT_FREE_CHUNK(ptr);
    } while (ptr != start_ptr);

    return NULL;
}
```

> 以上代码实际上是显式链表后写的。但是无妨

### 显式链表

和链表的知识一样,可以向空闲块中的 Payload 区域内放入前后指针,不再赘述.

区别在于有两种优化方法,将 8 字节的指针改为用 4 字节的 offset 存储:

- 以 `mem_heap_lo()` 为基准

- 以当前当前块的位置为基准 (在 [Github StuartSul/CSAPP3e_MallocLab_Implementation](https://github.com/StuartSul/CSAPP3e_MallocLab_Implementation) 的实现中由 Gemini 发现)

我觉得显然第一种复杂度低,不考虑第二种(理论上可以但很麻烦吧,难道 Gemini 看错了?不管了)

这样块的内存布局就分为:

- 占用块:

  ```
    4 bytes            4 bytes
  | Header | Payload | Footer |
  ```

- 空闲块:
  ```
  4 bytes      4 bytes             4 bytes        4 bytes
  | Header | Prev Free Offset | Next Free Offset | Footer |
  ```

其中 `Prev Free Offset` 和 `Next Free Offset` 分别存储前后空闲块相对于 `mem_heap_lo()` 的偏移量。

注意到这样的话，最小块是 16 字节，可承载 8 字节的 Payload，4 字节的 Header 和 4 字节的 Footer， 刚好可以满足 8 字节对齐的要求。

但这里还有个技巧，那就是实际上 Footer 是空闲块从链表中删除时才需要的，因此只需要在空闲块才写 Footer，占用块的 Footer 可以拿来写 Payload，又节省 4 bytes =-=

与此同时将第二位 Flag 作为 `prev_alloc` 用于记录前一个块是否分配，这样在 `mm_free` 时就不需要通过 Footer 来获取前一个块的占用情况，如果未占用则说明有 Footer， 再进一步读取 size。

考虑 `mem_sbrk` 时新增的块要如何填写 `prev_alloc` 的问题，就会发现需要想哨兵节点一样，在末尾 `mem_heap_hi()` 前添加一个结尾块 Epilogue Chunk，其大小为 0 且只有 Header，其 `prev_alloc` 标志位即为末尾 Chunk 的占用情况，这样新增的块可以和其他块一样的逻辑，直接按照下一个块的 `prev_alloc` 来赋值，注意每次 `mem_sbrk` 后记得要重新维护结尾块。

> 注意，这个操作并不能将最小块限制减为 12 bytes，显然空闲块还是需要 Footer 的

实现完如上几个逻辑后，接下来是提高吞吐量的分离链表优化。

> 注意，可以运用链表的哨兵节点技巧，在 `mm_init` 时向空闲链表添加一个状态为已分配，Payload Size 为 0 的哨兵块，减少边缘情况。

### 分离链表

和哈希表类似的排布，在 `mem_init` 起始创建 `BUCKET_SIZE` 个哨兵节点，每个节点对应一个链表，链表内的块大小可以自行按照所需定义。

比如可以定义为从 `SMALLEST_CHUNK_SIZE` 开始，每个桶比前一个桶大 8 直到一个阈值比如 96，之后则按每个桶大小较前一个翻倍。

```c
#define BUCKET_SIZE 24
#define SMALLEST_CHUNK_SIZE 16
// SmallBin 与 LargeBin 的界限
#define BIN_BOUNDARY 72

static void *bucket[BUCKET_SIZE];

/**
 * 混合桶索引计算 (Smallbins + Largebins)
 */
int get_slot_index(size_t size)
{
    // Smallbins
    // 对于小块，直接按 8 字节对齐划分为 8 个桶 (16, 24, ..., 72)，每个桶内的块大小相差 8 字节
    if (size <= BIN_BOUNDARY)
    {
        return (size - SMALLEST_CHUNK_SIZE) / 8;
    }

    // int class_index = BOUNDARY_SIZE / 8 - 1;
    // size_t class_size = 128;

    // // Largebins
    // // 对于大块，按 2 的幂次划分
    // while (class_index < BUCKET_SIZE - 1 && size > class_size)
    // {
    //     class_size <<= 1;
    //     class_index++;
    // }
    // return class_index;

    // __builtin_clz 返回输入的前导零的数量
    int k = 33 - __builtin_clz(size - 1);
    return k < BUCKET_SIZE ? k : BUCKET_SIZE - 1;
}

void *get_slot_ptr(size_t size)
{
    int slot_index = get_slot_index(size);
    return bucket[slot_index];
}
```

其中逻辑正如注释部分所见，但是 AI 还给出了个 trick，就是利用 `__builtin_clz` 来计算大块的桶索引

> 我本来想不采用，但我记得 Kops 高了整整 1k...就当学到了 =-=

经过尝试后我记得，Best-fit 和 First-fit 在分离链表上的表现差不多，因此没做过多处理。

但在直接根据 `get_slot_index(size)` 匹配到的桶里没有合适的块时，可以继续搜索下一个桶，直到找到为止。

---

到此为止如果我没记错的话，会出现 trace 7~10 的利用率都很难看，甚至 OOM 的情况，因此最后的冲刺就得具体分析下测试样例了：

> 可以较简单的做到 80 分左右，但是继续往上就头大了

- 1~6 没什么印象了。好像没有什么特殊处理，应该只是考验基础的合并空闲块和分配空闲块（如果只 `mem_sbrk` 可能会 OOM）
- 7/8 为 `binary-bal` 和 `binary-bal2`。先交替 `malloc` 16 和 112，然后 `free` 所有 112 的块，最后 `malloc` 128 这种规律，如果不加优化会产生大量蜂窝状的空闲块
- 9/10 是专门针对 `realloc` 的 `realloc-bal` 和 `realloc2-bal`。先 `malloc` 一个大块，然后 `malloc` 小块，最后 `realloc` 大块到更略大一点的块，以此循环，如果不加以处理最后会留下很大个空块。(直接 `malloc+memcpy+free` 的实现会 `mem_sbrk` 失败)

针对 7/8，需要在 `malloc` 时，有”重力“地切割块。具体来说是找到一个大的空闲块之后，如果 `size` 小，那么将其分配在左侧，切割右侧为新的空闲块；如果 `size` 大，那么将其分配在右侧，切割左侧为新的空闲块。

针对 9/10，需要在 `realloc` 时，需要两种策略：

- 如果块位于末尾，直接 `mem_sbrk` 申请额外所需的内存，恰好满足 `realloc` 的需求

- 如果块的两侧有空闲块，向前扩容或者向后扩容后再 `memmove`

这两个策略的优先级有讲究，可以自行调换尝试，可能会出现 trace 9 达到 99% 但是 trace 10 只有 77% 的情况，反之亦然。

但我发现 [Github StuartSul/CSAPP3e_MallocLab_Implementation](https://github.com/StuartSul/CSAPP3e_MallocLab_Implementation) 的实现可以两个都几乎 100%，它的分割策略要比我的谨慎的多，`mem_sbrk` 策略也不同：切割阈值为 4096，以及每次 `mem_sbrk` 的大小也为 4096，当作缓冲块用。而我的切割阈值是大于等于 `SMALLEST_CHUNK_SIZE`，每次 `mem_sbrk` 也是按需分配。

除此之外它还有一个 `has_other_free` 的 flag 来标志是否有两个或以上的空闲块，如果只剩下最后一个则不合并，让 `realloc` 直接向上扩容。

单一修改细节上的策略无法解决 trace 7~10 的问题，必须要一次性分配较大的空闲块，然后在里面进一步优化分配，不能受限于每次都 `mem_sbrk()`，操作余地太小。

---

它的实现有个缺点在于切割方式过于保守，可能产生大量无效占用，解决方案是将 `mem_sbrk` 的 `EXTEND_SIZE` 和切割的阈值分离，有可能找到一对对所有操作都相对较优的取值？（还是尽量不要面向测试设计吧...）

此外里面还有遍历维护 Large Bin 的缺点，看了下文 glibc Malloc 之后显然可知这是能优化的。

以及还有微不足道的一点优化空间，即不需要遍历桶来确认 `has_other_free`，维护一个空闲块数量的全局计数器即可（但复杂度会更高吗？我不好说，毕竟 `realloc` 才有 `has_other_free` 的情况，但我最终补上了实现）

## 辅助函数

为了方便 DEBUG，可以写一个 `mm_checkheap` 和 `print_heap_view`，有助于找出错误和分析内存布局。

这个就不在这里细讲了，~~辅助函数用 AI 生成也没啥毛病，还是别折磨自己了~~。

> 很遗憾改的天昏地暗，我当时没能记录下来上面那些改动的内存视图，也没精力再回头重走了，只能以经验谈的角度来回顾，没法提供证据...

## glibc malloc

我还没来得及取看 glibc 咋实现的，看 `-l` 吞吐量明显要快得多，但没有显示利用率，暂未对比。

但 glibc 的分离链表的方式非常细节，分为四种 Bin：

- Fast Bin：Fast Bin 中每个 Bin 固定大小，一般是最小的 16 字节开始步进为 8 字节，是单向链表，不支持合并
- Unsorted Bin：顾名思义，其中的未分类，任何大小都可以放入
- Small Bin：和 Fast Bin 一样但接受的 Chunk 大小更大，但是是双向链表，支持合并
- Large Bin：存储较大 Chunk 的 Bin，内部是有序的，且步进不一定相同

注意到 Large Bin 是有序的，查了下 glibc 的实现，并非看到有的北大大佬的 Blog 里面手搓平衡树，而是用双重链表达成的高效插入删除：

- 相同大小的块通过双向链表连接在一起，形成一个链表
- 不同大小的块通过另外两个指针 `fd_nextsize` 和 `bk_nextsize` 连接在一起，将前面那个*相同大小链表*的头节点相连，形成一个有序的链表

跳转流程部分不再赘述。但是仍然不如 Fast Bin 和 Small Bin 的 $O(1)$ 插入删除，所以我猜测 Unsorted Bin 的存在是为了进一步减少释放的大块插入 Large Bin 的次数，让其在 Unsorted Bin 里先等待一下，看看能不能被后续的 `malloc` 直接利用掉，若不符合条件则延迟归类 Large Bin（当然其他的块也一样，归类回 F/S Bin），又能减少一部分非 $O(1)$ 操作。

具体细节也许可以参考：[Understanding glibc malloc](https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/)，里面还包含多线程之类，关于实际的工程细节。（我没看）

> 实际上我参考真的了一下之后发现，不仅有点站着说话不腰疼（都是英文），好像还有一点谬误=-=，于是找到了下面这个也许更合适细看的文章

TODO：[glibc 内存分配器](https://jia.je/kb/software/glibc_allocator.html)

---

基本上以上就是我这几天的记录，具体实现可以查看 [z0z0r4/CSAPP-LAB](https://github.com/z0z0r4/CSAPP-LAB)，已转为公开。

预计不会往下开其他的 CSAPP Lab 了，即将到来的是也许是数据库，也许是 CLRS，也许是钝角。