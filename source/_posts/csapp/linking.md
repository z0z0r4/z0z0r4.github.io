---
title: CSAPP Linking
sticky: false
mermaid: false
date: 2026-04-14 19:18:00
tags:
  - CSAPP
  - study-notes
categories:
  - study-notes
  - CS
  - CSAPP
cover: covers/suzumi_bili_2_agaddw4aaqthcvq.png
comments:
copyright:
sponsor:
---

这里讲链接，没有 Lab。

<!-- more -->

## Overview

```c
// file: sum.c
int sum(int *a, int *b, int size) {
    int result = 0;
    for (int i = size; i > 0; i--) {
        result += a[i] + b[i];
    }
    return result;
}

// file: main.c
int sum(int *a, int *b, int size);

int main(){
    int a[2] = {1,3};
    int b[2] = {2,4};
    int size = 2;
    sum(a, b, size);
    return 0;
}
```

首先有以上源代码，用 `gcc sum.c main.c -o prog` 编译，得到可执行文件 `prog`。

而细看可以通过 `gcc sum.c main.c -o prog -v` 可以得到以下编译过程：

```
z0z0r4@DESKTOP-862S1HV:~/link$ gcc sum.c main.c -o prog -v
Using built-in specs.
COLLECT_GCC=gcc
COLLECT_LTO_WRAPPER=/usr/libexec/gcc/x86_64-linux-gnu/14/lto-wrapper
OFFLOAD_TARGET_NAMES=nvptx-none:amdgcn-amdhsa
OFFLOAD_TARGET_DEFAULT=1
Target: x86_64-linux-gnu
Configured with: ../src/configure -v --with-pkgversion='Debian 14.2.0-19' --with-bugurl=file:///usr/share/doc/gcc-14/README.Bugs --enable-languages=c,ada,c++,go,d,fortran,objc,obj-c++,m2,rust --prefix=/usr --with-gcc-major-version-only --program-suffix=-14 --program-prefix=x86_64-linux-gnu- --enable-shared --enable-linker-build-id --libexecdir=/usr/libexec --without-included-gettext --enable-threads=posix --libdir=/usr/lib --enable-nls --enable-bootstrap --enable-clocale=gnu --enable-libstdcxx-debug --enable-libstdcxx-time=yes --with-default-libstdcxx-abi=new --enable-libstdcxx-backtrace --enable-gnu-unique-object --disable-vtable-verify --enable-plugin --enable-default-pie --with-system-zlib --enable-libphobos-checking=release --with-target-system-zlib=auto --enable-objc-gc=auto --enable-multiarch --disable-werror --enable-cet --with-arch-32=i686 --with-abi=m64 --with-multilib-list=m32,m64,mx32 --enable-multilib --with-tune=generic --enable-offload-targets=nvptx-none=/build/reproducible-path/gcc-14-14.2.0/debian/tmp-nvptx/usr,amdgcn-amdhsa=/build/reproducible-path/gcc-14-14.2.0/debian/tmp-gcn/usr --enable-offload-defaulted --without-cuda-driver --enable-checking=release --build=x86_64-linux-gnu --host=x86_64-linux-gnu --target=x86_64-linux-gnu --with-build-config=bootstrap-lto-lean --enable-link-serialization=3
Thread model: posix
Supported LTO compression algorithms: zlib zstd
gcc version 14.2.0 (Debian 14.2.0-19) 
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog-'
 /usr/libexec/gcc/x86_64-linux-gnu/14/cc1 -quiet -v -imultiarch x86_64-linux-gnu sum.c -quiet -dumpdir prog- -dumpbase sum.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -fasynchronous-unwind-tables -o /tmp/ccuoguQK.s
GNU C17 (Debian 14.2.0-19) version 14.2.0 (x86_64-linux-gnu)
        compiled by GNU C version 14.2.0, GMP version 6.3.0, MPFR version 4.2.1, MPC version 1.3.1, isl version isl-0.27-GMP

warning: MPFR header version 4.2.1 differs from library version 4.2.2.
GGC heuristics: --param ggc-min-expand=100 --param ggc-min-heapsize=131072
ignoring nonexistent directory "/usr/local/include/x86_64-linux-gnu"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/include-fixed/x86_64-linux-gnu"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/include-fixed"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/../../../../x86_64-linux-gnu/include"
#include "..." search starts here:
#include <...> search starts here:
 /usr/lib/gcc/x86_64-linux-gnu/14/include
 /usr/local/include
 /usr/include/x86_64-linux-gnu
 /usr/include
End of search list.
Compiler executable checksum: 0051dfc1fa4e89ba97760da93f2546f3
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog-'
 as -v --64 -o /tmp/ccUjNHE1.o /tmp/ccuoguQK.s
GNU assembler version 2.44 (x86_64-linux-gnu) using BFD version (GNU Binutils for Debian) 2.44
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog-'
 /usr/libexec/gcc/x86_64-linux-gnu/14/cc1 -quiet -v -imultiarch x86_64-linux-gnu main.c -quiet -dumpdir prog- -dumpbase main.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -fasynchronous-unwind-tables -o /tmp/ccuoguQK.s
GNU C17 (Debian 14.2.0-19) version 14.2.0 (x86_64-linux-gnu)
        compiled by GNU C version 14.2.0, GMP version 6.3.0, MPFR version 4.2.1, MPC version 1.3.1, isl version isl-0.27-GMP

warning: MPFR header version 4.2.1 differs from library version 4.2.2.
GGC heuristics: --param ggc-min-expand=100 --param ggc-min-heapsize=131072
ignoring nonexistent directory "/usr/local/include/x86_64-linux-gnu"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/include-fixed/x86_64-linux-gnu"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/include-fixed"
ignoring nonexistent directory "/usr/lib/gcc/x86_64-linux-gnu/14/../../../../x86_64-linux-gnu/include"
#include "..." search starts here:
#include <...> search starts here:
 /usr/lib/gcc/x86_64-linux-gnu/14/include
 /usr/local/include
 /usr/include/x86_64-linux-gnu
 /usr/include
End of search list.
Compiler executable checksum: 0051dfc1fa4e89ba97760da93f2546f3
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog-'
 as -v --64 -o /tmp/ccthHRqg.o /tmp/ccuoguQK.s
GNU assembler version 2.44 (x86_64-linux-gnu) using BFD version (GNU Binutils for Debian) 2.44
COMPILER_PATH=/usr/libexec/gcc/x86_64-linux-gnu/14/:/usr/libexec/gcc/x86_64-linux-gnu/14/:/usr/libexec/gcc/x86_64-linux-gnu/:/usr/lib/gcc/x86_64-linux-gnu/14/:/usr/lib/gcc/x86_64-linux-gnu/
LIBRARY_PATH=/usr/lib/gcc/x86_64-linux-gnu/14/:/usr/lib/gcc/x86_64-linux-gnu/14/../../../x86_64-linux-gnu/:/usr/lib/gcc/x86_64-linux-gnu/14/../../../../lib/:/lib/x86_64-linux-gnu/:/lib/../lib/:/usr/lib/x86_64-linux-gnu/:/usr/lib/../lib/:/usr/lib/gcc/x86_64-linux-gnu/14/../../../:/lib/:/usr/lib/
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog.'
 /usr/libexec/gcc/x86_64-linux-gnu/14/collect2 -plugin /usr/libexec/gcc/x86_64-linux-gnu/14/liblto_plugin.so -plugin-opt=/usr/libexec/gcc/x86_64-linux-gnu/14/lto-wrapper -plugin-opt=-fresolution=/tmp/ccxspefs.res -plugin-opt=-pass-through=-lgcc -plugin-opt=-pass-through=-lgcc_s -plugin-opt=-pass-through=-lc -plugin-opt=-pass-through=-lgcc -plugin-opt=-pass-through=-lgcc_s --build-id --eh-frame-hdr -m elf_x86_64 --hash-style=gnu --as-needed -dynamic-linker /lib64/ld-linux-x86-64.so.2 -pie -o prog /usr/lib/gcc/x86_64-linux-gnu/14/../../../x86_64-linux-gnu/Scrt1.o /usr/lib/gcc/x86_64-linux-gnu/14/../../../x86_64-linux-gnu/crti.o /usr/lib/gcc/x86_64-linux-gnu/14/crtbeginS.o -L/usr/lib/gcc/x86_64-linux-gnu/14 -L/usr/lib/gcc/x86_64-linux-gnu/14/../../../x86_64-linux-gnu -L/usr/lib/gcc/x86_64-linux-gnu/14/../../../../lib -L/lib/x86_64-linux-gnu -L/lib/../lib -L/usr/lib/x86_64-linux-gnu -L/usr/lib/../lib -L/usr/lib/gcc/x86_64-linux-gnu/14/../../.. /tmp/ccUjNHE1.o /tmp/ccthHRqg.o -lgcc --push-state --as-needed -lgcc_s --pop-state -lc -lgcc --push-state --as-needed -lgcc_s --pop-state /usr/lib/gcc/x86_64-linux-gnu/14/crtendS.o /usr/lib/gcc/x86_64-linux-gnu/14/../../../x86_64-linux-gnu/crtn.o
COLLECT_GCC_OPTIONS='-o' 'prog' '-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'prog.'
```

其中执行了以下几个命令：

1. 编译阶段：调用了两次 `cc1` 分别处理 `sum.c` 和 `main.c`（集成了预处理器 `ccp`），将 C 代码翻译成汇编代码，输出临时汇编文件，如 `/tmp/cco3ivRm.s`。
  - `/usr/libexec/gcc/x86_64-linux-gnu/14/cc1 -quiet -v -imultiarch x86_64-linux-gnu sum.c -quiet -dumpdir prog- -dumpbase sum.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -fasynchronous-unwind-tables -o /tmp/ccuoguQK.s`
  - `/usr/libexec/gcc/x86_64-linux-gnu/14/cc1 -quiet -v -imultiarch x86_64-linux-gnu main.c -quiet -dumpdir prog- -dumpbase main.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -fasynchronous-unwind-tables -o /tmp/ccuoguQK.s`

2. 汇编阶段：在每次 `cc1` 后调用 `as` 将汇编代码翻译成机器指令，分别生成可重定位目标文件（`.o`）。
  - `as -v --64 -o /tmp/ccUjNHE1.o /tmp/ccuoguQK.s`
  - `as -v --64 -o /tmp/ccthHRqg.o /tmp/ccuoguQK.s`

3. 链接阶段将所有的目标文件和库文件链接成一个可执行文件 `prog`。
    `/usr/libexec/gcc/x86_64-linux-gnu/14/collect2 ... --eh-frame-hdr -m elf_x86_64 ... -dynamic-linker /lib64/ld-linux-x86-64.so.2 -pie -o prog ... /tmp/ccUjNHE1.o /tmp/ccthHRqg.o ...`

> 注意 `-dynamic-linker /lib64/ld-linux-x86-64.so.2`，此处是动态链接。

其中有：
- `.c` 文件：源码文件
- `.s` 文件：汇编文件
- `.o` 文件：目标文件（可重定位文件）
- `.a` 文件：静态库文件（归档打包多个 `.o` 文件）
- `.so` 文件：共享库文件（动态链接库，特殊的可重定位文件）
- `prog` ：可执行文件

## Linker

链接器主要有两个作用：
- 符号解析
- 地址重定位

假如只有一个文件，其源码不调用外部函数、变量，那么就不需要链接。

## ELF

ELF（Executable and Linkable Format）是 Linux 系统中常用的目标文件格式，由汇编器和链接器创建。

- 可重定位文件（Relocatable file）：以 `.o` 结尾的目标文件，没有被链接成可执行文件。可以被链接器处理。
- 可执行文件（Executable file）：以没有扩展名或 `.out` 结尾的文件，已经被链接成可执行文件。
- 共享库文件（Shared library file）：以 `.so` 结尾的文件
- - 可以用动态链接器让多个可执行文件共享使用
- - 也可以被链接器处理，和其他目标文件一起，链接成新的目标文件

ELF 的具体文件格式可以参考 [CTF Wiki ELF](https://ctf-wiki.org/executable/elf/structure/basic-info/)

可以通过 `readelf` 命令查看 ELF。

参考 [对象文件格式](https://www.wdxtub.com/blog/csapp/thin-csapp-4#%E5%AF%B9%E8%B1%A1%E6%96%87%E4%BB%B6%E6%A0%BC%E5%BC%8F)

## 符号表

每个可重定位文件 $m$ 都有一个符号表 `.symtab`，记录了该文件中定义的符号和引用的符号。其中分为三种：

- 由 $m$ 定义且能被其他模块引用的全局符号。对应于 C 语言中的非静态全局变量和非静态函数。
- 由其他模块定义且被 $m$ 引用的全局符号（外部符号）。其中包括 `extern` 声明的符号等。
- 由 $m$ 定义但不能被其他模块引用的局部符号。对应于 C 语言中的静态变量和静态函数。

定义以下代码：

```c
// file: sum.c
int var1 = 1;
int var2;

int sum(int *a, int *b, int size) {
    int result = 0;
    for (int i = size; i > 0; i--) {
        result += a[i] + b[i];
    }
    return result;
}

// file: main.c
int sum(int *a, int *b, int size);

int var1;
int var2 = 10;

int main(){
    int a[2] = {1,3};
    int b[2] = {2,4};
    int size = 2;
    sum(a, b, size);
    return 0;
}
```

> [GCC10 Default to -fno-common](https://gcc.gnu.org/gcc-10/porting_to.html#common)。现在应该加上 `-fcommon` 来允许定义重复符号了，或者加上 `extern` 关键字。

其存于 ELF 中，可以通过 `readelf -s /tmp/cc0Eregi.o` 来查看 ELF，以及 `nm /tmp/cc0Eregi.o`。

以 `sum.c` 的为例，其符号表如下：

```
z0z0r4@DESKTOP-862S1HV:~/link$ readelf -s /tmp/cc0Eregi.o

Symbol table '.symtab' contains 6 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS sum.c
     2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1 .text
     3: 0000000000000000    55 FUNC    GLOBAL DEFAULT    1 sum
     4: 0000000000000004     4 OBJECT  GLOBAL DEFAULT  COM var2
     5: 0000000000000000     4 OBJECT  GLOBAL DEFAULT    2 var1
z0z0r4@DESKTOP-862S1HV:~/link$ nm /tmp/cc0Eregi.o
0000000000000000 T sum
0000000000000000 D var1
0000000000000004 C var2
```

其中 `sum` 在 `.text` 节中；已初始化的 `var1` 是强符号，在 `.data` 节中；未初始化的 `var2` 是弱符号，在 `COMMON` 节中。

## 符号解析

对于局部符号，只需要保证它们有唯一的名字即可。

对于在本地找不到定义的符号的解析，会假设符号是在其他模块定义的，为每个模块生成链接器符号表。如果在任何输入模块都找不到这个符号的定义，那么链接器会报错。

比如对于以下代码：

```c
void foo(void);

int main() {
    foo();
    return 0;
}
```

编译器不会有报错，但是链接器无法在本地解析到 `foo` 的定义，也未在其他模块找到 `foo` 的定义，所以链接器会报错。

> C++ 和 Java 支持重载方法，这意味着相同的函数 `foo` 可能有多个定义，此时符号不止函数名，还会包括参数类型，类名等信息，构建唯一符号。比如 `Foo::bar(int, long)` 被编码为 `bar__3Fooil`。（摘自书中原文）

符号有弱符号和强符号之分：

- 强符号：函数或已初始化的变量。
- 弱符号：未初始化的变量。

Linux 链接器按三个规则处理多重定义的符号名：

1. 不允许多个同名的强符号。
2. 如果一个符号有一个强符号和一个或多个弱符号，那么链接器选择强符号。
3. 如果有多个弱符号同名，则随机选择一个。

那么就有以下情况：

- 两个强符号：链接器报错，无法解析。

```c
// file: foo1.c
int main() {
    return 0;
}

// file: foo2.c
int main() {
    return 0;
}
```

- 一个强符号和一个弱符号：链接器选择强符号。

```c
// file: foo1.c
int x = 1;

// file: foo2.c
int x;
```

> 此时不会有报错。可能会有意想不到的 Bug 且难以被发现。

- 两个弱符号：链接器随机选择其中一个

```c
// file: foo1.c
int x;

// file: foo2.c
int x;
```

同时，由于符号不区分类型，你可能遇到第二个情况的特殊案例如下：

```c
// file: foo1.c
#include <stdio.h>
void foo(void);

int x = 1;
int y = 2;

int main() {
    foo();
    printf("x=0x%x  y=0x%x\n", x, y);
    return 0;
}

// file: foo2.c
double y;

void foo() {
    y = -0.0;
}
```

此时先定义了一个强符号 `x` 和一个弱符号 `y`，链接器选择了强符号 `x` 和弱符号 `y`，且内存上 `x` 和 `y` 占用的可能是连续内存。

由于符号不区分类型，`double y` 和 `int y` 视为相同符号，得到相同地址，所以 `foo` 中对 `y` 的内存操作（8字节）会到影响 `x` 的值，输出为 `x=0x80000000  y=0x0`。

## 重定位

显然，在找到符号定义后，需要将符号引用替换为符号定义的地址。

显然，假如 A 依赖 B 的符号定义，那么必须先已知 B 的地址，然后根据符号定义在 B 中的偏移值才能得到最终的地址。

> 以下两种方式都无法实现动态链接，这只能在算出相对模块内的地址，要跨模块还需要后文的 Got。

分为两种：

- 重定位绝对引用
- 重定位 PC 相对引用

绝对引用指的是直接根据可执行文件整体来计算地址，常用于静态链接。

计算公式为：$addr = (unsigned) (ADDR(r.symbol) + r.addend)$

PC 相对引用根据当前 PC 地址位置，为 PC 跳转增加计算好的偏移量，使其跳转到目标地址，常用于动态链接。

计算公式为：$offset = (unsigned) (ADDR(r.symbol) + r.addend - refaddr)$

运行时跳转的地址为 $ PC <- PC + offset $。

其中，$ADDR(r.symbol)$ 是目标符号（函数或变量）在链接完成后，被分配到的绝对虚拟地址，$r.addend$ 是重定位条目的附加值，$refaddr$ 是符号引用的地址。

> 为什么动态链接用 PC 相对地址？
>
> 可执行文件总是加载到虚拟地址空间的某个位置，如果固定到某个地址，那么当然可以在编译时，已知程序加载起始地址，就计算出绝对地址了；如果不固定，那么就只能以 PC 相对的方式来计算地址了。而动态链接是运行时加载的，无法提前知道起始地址。

> 假如用了地址空间布局随机化(ASLR)，每次加载程序时，程序的起始地址都会随机变化，那么就无法使用绝对地址了，只能使用 PC 相对地址了。

> 第9章中会学习到虚拟内存的知识。

## 可执行目标文件

TODO

## 加载可执行文件

TODO

## 静态链接

实际上就是如上的符号解析和地址重定位结合起来，将所有目标文件中的空位填上正确的地址，然后合并起来即可。

注意，链接时有顺序之分。

比如 `main2.c` 调用了 `libvector.a` 中的 `addvec` 函数，运行 `gcc -static ./libvector.a main2.c` 会报错：

```
> gcc -static ./libvector.a main2.c
/tmp/cc9XH6Rp.o: In function 'main':
/tmp/cc9XH6Rp.o(.text+0xl8): undefined reference to 'addvec'
```

要解释这个原因，需要考虑到三个集合：
- 链接器维护一个可重定位目标文件的集合 E (这个集合中的文件会被合并起来形成可执行文件）
- 一个未解析的符号（即引用了但是尚未定义的符号)集合 U
- 以及一个在前面输人文件中已定义的符号集合 D

初始时，E、U 和 D 均为空。

输入文件可能是归档文件 `.a` 或者目标文件 `.o`。

如果是目标文件，那么会加入 E 中，并将该文件中定义的符号加入 D 中，将该文件中引用但未定义的符号加入 U 中，同时匹配 U 中的符号，如果有匹配的符号，则从 U 中删除该符号。

如果是归档文件，遍历其中所有的目标文件，如果其中的目标文件定义了 U 中的符号，那么就将该目标文件加入 E 中，修改 D 和 U 集合。如果没有匹配到任何 U 中的符号，那么就不加入 E 中。

以上流程按照参数输入的顺序进行，那么显然如果先传入 `./libvector.a`，由于 U 中没有任何符号，所以 `addvec` 不会匹配到任何符号，所以 `./libvector.a` 中的目标文件不会被加入 E 中，也就不会将 `addvec` 的定义加入 D 中，那么后续 `main2.c` 则无法找到 `addvec` 的定义了。

静态链接可以在没有依赖的情况下直接运行，但缺点显然也是体积较大，也不会在内存中共享库。

## 动态链接

动态链接顾名思义是在运行时才动态链接的，需要动态链接器。

最简单的方法是为每个进程分配其所需的共享库的内存，在运行开始时遍历整个可执行文件，一次性找到所有地址，当作静态编译直接填进去。

但这样的利用率很低，更好的方式是让内存中只有一份共享库。

实践上，可以分三个阶段看：

1. 编译/链接阶段：生成 `rel.dyn` 和 `rel.plt` 重定位节，指向了哪些地方要改地址

2. 加载/运行阶段：按照 `rel` 表，找到对应的 GOT 位置，填入由动态加载器找到的地址

3. 执行阶段：GOT 表中已经有目标地址，那么从执行的指令跳转到 GOT 表中的地址。

### 延迟绑定

上面填入 GOT 表的阶段是 **加载/运行** 而不只是 **加载**，这是因为代码中分支很多，每个分支调用的符号加起来也很多，而运行时可能只触发到一小部分分支，如果按需加载，用时加载，可以提高速度。

方法是在跳转到 GOT 表之前，先检查是否已经填入地址了，如果没有，则先调用动态链接器来加载符号地址，填入 GOT 表中，最后再去 GOT 表中执行。

从汇编指令看就是如图流程。

![GOT&PLT](/images/csapp/GOT_PLT.png)

## 库打桩

本质上是劫持目标代码中的函数调用，替换为我们自己的函数调用。

分为三种：

- 编译时打桩
- 链接时打桩
- 运行时打桩

以下都劫持 `malloc` 和 `free` 函数为例。

### 编译时打桩

`malloc` 和 `free` 都是在 `malloc.h` 中声明的函数，那么我们可以写一样的函数声明，用 `-I` 参数传入自己的实现，让编译器优先找到我们的实现。

### 链接时打桩

先编译目标代码 `int.c` -> `int.o` 和 `mymalloc.c` -> `mymalloc.o`，然后利用链接器的 `--wrap` 参数来指定 `malloc` 和 `free` 的替换函数。

比如 `gcc -W1, -wrap,malloc -W1, -wrap,free -o int int.o mymalloc.o`

会将 `free` 替换为 `__wrap_free`，将 `malloc` 替换为 `__wrap_malloc`，同时会将原来的 `free` 和 `malloc` 分别重命名为 `__real_free` 和 `__real_malloc`。

那么显然我们只需要实现 `__wrap_malloc` 和 `__wrap_free`，在其中调用 `__real_malloc` 和 `__real_free`，以及完成其他目的即可。

### 运行时打桩

运行时打桩需要用到动态链接库和 `LD_PRELOAD` 环境变量。

`LD_PRELOAD` 可以强制优先在指定的动态链接库中查找符号定义，而不是去系统库中查找。

> 如果是静态编译的，那就没法劫持了。

---

Valgrind 它直接将指令翻译为 IR（中间表示），维护虚拟 CPU 和虚拟内存，有点类似虚拟机的效果了...

---

这一章有思路，但是写出来的细节好乱，也感觉有不少错的...日后有机会再改吧。

---

有如下方便的工具：

- `readelf`：查看 ELF 文件的结构和内容
- `objdump`：常用于反编译二进制文件
- `ldd`：查看可执行文件依赖的共享库
- `nm`：查看目标文件中的符号表