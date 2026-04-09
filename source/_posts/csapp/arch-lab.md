---
title: CSAPP Arch Lab
sticky: false
mermaid: false
tags:
  - CSAPP
  - study-notes
categories:
  - study-notes
  - CS
  - CSAPP
cover: covers/chibi_goomba_agad-t8aatsbaek.png
comments:
copyright:
sponsor:
---

这是 CSAPP Lab 记录的第四弹————ArchLab。

!未完成

<!-- more -->

有参考 <https://www.caiwen.work/post/csapp-4>

从 <https://csapp.cs.cmu.edu/3e/labs.html> 上下载 <https://csapp.cs.cmu.edu/3e/archlab-handout.tar>，参考资料 <https://csapp.cs.cmu.edu/3e/archlab.pdf>。

---

CSAPP 定义了一套类似 x86-64 的指令集架构 Y86-64。

从 `0x0` 到 `0xf` 有 15 个寄存器，分别是 `%rax`, `%rcx`, `%rdx`, `%rbx`, `%rsp`, `%rbp`, `%rsi`, `%rdi`, `%r8`, `%r9`, `%r10`, `%r11`, `%r12`, `%r13` 和 `%r14`，`0xf` 代表无寄存器。

有以下指令：

- `halt` -> `0 0`
- `nop` -> `1 0`
- `rrmovq rA, rB` -> `2 0 rA rB`
- `irmovq V, rB` -> `3 0 F rB V`
- `rmmovq rA, D(rB)` -> `4 0 rA rB D`
- `mrmovq D(rB), rA` -> `5 0 rA rB D`
- `OPq rA, rB` -> `6 fn rA rB`
- `jXX Dest` -> `7 fn Dest`
- `cmovXX rA, rB` -> `2 fn rA rB`
- `call Dest` -> `8 0 Dest`
- `ret` -> `9 0`
- `push rA` -> `A 0 rA F`
- `pop rA` -> `B 0 rA F`

> `V` 和 `D` 是 8 字节的立即数，`fn` 是功能码，`F` 代表无寄存器。

其中操作指令 `OPq` 包括：

- `addq` -> `6 0`
- `subq` -> `6 1`
- `andq` -> `6 2`
- `xorq` -> `6 3`

分支指令 `jXX` 包括：

- `jmp` -> `7 0`
- `jle` -> `7 1`
- `jl` -> `7 2`
- `je` -> `7 3`
- `jne` -> `7 4`
- `jge` -> `7 5`
- `jg` -> `7 6`

移动指令 `cmovXX` 包括：

- `rrmovq` -> `2 0`
- `cmovle` -> `2 1`
- `cmovl` -> `2 2`
- `cmove` -> `2 3`
- `cmovne` -> `2 4`
- `cmovge` -> `2 5`
- `cmovg` -> `2 6`

此外还有条件寄存器：

- `ZF` -> zero flag（当结果为零时置位）
- `SF` -> sign flag（当结果为负数时置位）
- `OF` -> overflow flag（当结果溢出时置位）

还有 `PC` 寄存器，保存下一个指令的地址。

---

逻辑门没有状态，只有输入和输出，但运算是有状态的，可以用寄存器来实现状态的保存。

但与此同时，逻辑门的耗时并不相同：假如有 `xor` 门，输入 A 的逻辑电路耗时 1s 输出为 1，输入 B 的逻辑电路耗时 2s 输出为 1（在前 2s 还是 0），那么在 1.5s 的时候，`xor` 门的输出会是 `1 xor 0 = 1`，在 2s 的时候，输出才会变成 `1 xor 1 = 0`。

设计寄存器在控制端高电平时触发采样，低电平即使输入端变更了也不更新寄存器的值。控制端接上脉冲电路，让周期为最长的逻辑门耗时，使得所有的输入都稳定了之后再更新寄存器的值。这就是时序电路。

> 形象来说，就是在电路稳定时，在寄存器内保存快照。

将指令都分为六个阶段：

- 取指（Fetch）：根据 PC 寄存器中的地址，从内存中取出吓一跳要执行的指令

- 译码（Decode）：按照指令，取出指令中指定的寄存器的值

- 执行（Execute）：根据指令的功能码，执行相应的运算（包括条件寄存器、计算有效地址、计算栈指针）

- 访存（Memory）：RAW，读取内存和写入内存

- 写回（Write Back）：将结果写回寄存器堆

- 更新 PC（PC Update）：根据指令的类型，更新 PC 寄存器的值

需要六个周期才能完成一条指令的执行。


---

CSAPP 用自己设计的 HCL 语言来设计 Y86-64 的时序电路。

要具体设计这六个阶段，首先要考虑以上的各个指令在各个阶段做了什么。

各个指令的设计是：

| 阶段 | `OPq rA, rB` | `rrmovq rA, rB` | `irmovq V, rB` |
| :--- | :--- | :--- | :--- |
| **取指** | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valC \leftarrow M_8[PC+2]$<br>$valP \leftarrow PC+10$ |
| **译码** | $valA \leftarrow R[rA]$<br>$valB \leftarrow R[rB]$ | $valA \leftarrow R[rA]$ | |
| **执行** | $valE \leftarrow valB \text{ OP } valA$<br>**Set CC** | $valE \leftarrow 0 + valA$ | $valE \leftarrow 0 + valC$ |
| **访存** | | | |
| **写回** | $R[rB] \leftarrow valE$ | $R[rB] \leftarrow valE$ | $R[rB] \leftarrow valE$ |
| **更新 PC** | $PC \leftarrow valP$ | $PC \leftarrow valP$ | $PC \leftarrow valP$ |

---

| 阶段 | `pushq rA` | `popq rA` |
| :--- | :--- | :--- |
| **取指** | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ |
| **译码** | $valA \leftarrow R[rA]$<br>$valB \leftarrow R[\%rsp]$ | $valA \leftarrow R[\%rsp]$<br>$valB \leftarrow R[\%rsp]$ |
| **执行** | $valE \leftarrow valB + (-8)$ | $valE \leftarrow valB + 8$ |
| **访存** | $M_8[valE] \leftarrow valA$ | $valM \leftarrow M_8[valA]$ |
| **写回** | $R[\%rsp] \leftarrow valE$ | $R[\%rsp] \leftarrow valE$<br>$R[rA] \leftarrow valM$ |
| **更新 PC** | $PC \leftarrow valP$ | $PC \leftarrow valP$ |

---

| 阶段 | `jXX Dest` | `call Dest` | `ret` |
| :--- | :--- | :--- | :--- |
| **取指** | $icode:ifun \leftarrow M_1[PC]$<br>$valC \leftarrow M_8[PC+1]$<br>$valP \leftarrow PC+9$ | $icode:ifun \leftarrow M_1[PC]$<br>$valC \leftarrow M_8[PC+1]$<br>$valP \leftarrow PC+9$ | $icode:ifun \leftarrow M_1[PC]$<br>$valP \leftarrow PC+1$ |
| **译码** | | $valB \leftarrow R[\%rsp]$ | $valA \leftarrow R[\%rsp]$<br>$valB \leftarrow R[\%rsp]$ |
| **执行** | $Cnd \leftarrow Cond(CC, ifun)$ | $valE \leftarrow valB + (-8)$ | $valE \leftarrow valB + 8$ |
| **访存** | | $M_8[valE] \leftarrow valP$ | $valM \leftarrow M_8[valA]$ |
| **写回** | | $R[\%rsp] \leftarrow valE$ | $R[\%rsp] \leftarrow valE$ |
| **更新 PC** | $PC \leftarrow Cnd ? valC : valP$ | $PC \leftarrow valC$ | $PC \leftarrow valM$ |

---

| 阶段 | `cmovXX rA, rB` | `rmmovq rA, D(rB)` | `mrmovq D(rB), rA` |
| :--- | :--- | :--- | :--- |
| **取指** | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valC \leftarrow M_8[PC+2]$<br>$valP \leftarrow PC+10$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valC \leftarrow M_8[PC+2]$<br>$valP \leftarrow PC+10$ |
| **译码** | $valA \leftarrow R[rA]$ | $valA \leftarrow R[rA]$<br>$valB \leftarrow R[rB]$ | $valB \leftarrow R[rB]$ |
| **执行** | $valE \leftarrow 0 + valA$<br>$Cnd \leftarrow Cond(CC, ifun)$ | $valE \leftarrow valB + valC$ | $valE \leftarrow valB + valC$ |
| **访存** | | $M_8[valE] \leftarrow valA$ | $valM \leftarrow M_8[valE]$ |
| **写回** | $if(Cnd) R[rB] \leftarrow valE$ | | $R[rA] \leftarrow valM$ |
| **更新 PC** | $PC \leftarrow valP$ | $PC \leftarrow valP$ | $PC \leftarrow valP$ |

那么按照以上来设计各个阶段：

> TODO 咕咕咕

---

接下来是 ArchLab，分为 ABC 三个 Part。

> A 简单，B 也不太难，C 很大坨

首先应该解压 sim.tar `tar xvf sim.tar`，然后 `cd sim && make clean && make` 构建所需的 Y86-64 工具，接下来的任务都在 sim 目录下完成。

> 如果缺少依赖报错可以安装以下软件包：
> ```bash
> sudo apt install tcl tcl-dev tk tk-dev
> sudo apt install flex
> sudo apt install bison
> ```

> 如果提示类似
> ```
> /usr/bin/ld: yas.o:/home/z0z0r4/CSAPP-LAB/archlab/sim/misc/yas.h:13: multiple definition of `lineno'; 
> yas-grammar.o:(.bss+0x0): first defined here
> ```
> 这个重复定义报错，是由于 GCC 10 之前默认 `-fcommon` 选项导致的，GCC 10 之后默认 `-fno-common`，解决方法是将 `-fcommon` 添加到 Makefile 的 CFLAGS 和 LLCFLAGS 中。（注意不止一个地方需要添加）

> 源码兼容的是 tk8.5，但是现在 apt 只有 8.6，有 breaking change，可以参考 [tk.h looks for tcl.h in /usr/include but tcl.h is in /usr/include/tcl. I don't have write tk.h privilege to fix code](https://stackoverflow.com/questions/66291922/tk-h-looks-for-tcl-h-in-usr-include-but-tcl-h-is-in-usr-include-tcl-i-dont-h) 或者从源码编译安装 tk8.5 [tcltk downloadnow85](https://www.tcl-lang.org/software/tcltk/downloadnow85.html)（但还不如直接不用 GUI 了...如果不需要 GUI 则可以在 Makefile 中注释掉 `GUIMODE`、`TKLIBS`、`TKINC`。）


### Part A

Part A 有要实现下面三个函数：

- `sum_list`: 计算链表元素的和
- `rsum_list`: 递归计算链表元素的和
- `copy_block`: 将 src 中的内容复制到 dest 中，并返回 src 的异或校验和

<details>
<summary> <code>examples.c</code> </summary>

```c
/*
 * Architecture Lab: Part A
 *
 * High level specs for the functions that the students will rewrite
 * in Y86-64 assembly language
 */

/* $begin examples */
/* linked list element */
typedef struct ELE
{
    long val;
    struct ELE *next;
} *list_ptr;

/* sum_list - Sum the elements of a linked list */
long sum_list(list_ptr ls)
{
    long val = 0;
    while (ls)
    {
        val += ls->val;
        ls = ls->next;
    }
    return val;
}

/* rsum_list - Recursive version of sum_list */
long rsum_list(list_ptr ls)
{
    if (!ls)
        return 0;
    else
    {
        long val = ls->val;
        long rest = rsum_list(ls->next);
        return val + rest;
    }
}

/* copy_block - Copy src to dest and return xor checksum of src */
long copy_block(long *src, long *dest, long len)
{
    long result = 0;
    while (len > 0)
    {
        long val = *src++;
        *dest++ = val;
        result ^= val;
        len--;
    }
    return result;
}
/* $end examples */
```

</details>

以下是实现，我本来想参考 `gcc -S` 生成的汇编代码来写，但发现它生成的代码也挺难看的，还是对照下指令集开始写了。


#### `sum_list`

<details>
<summary> <code>ans-sum.ys</code> </summary>

```
.pos 0
irmovq stack, %rsp
irmovq ele1, %rdi
call sum_list
halt

.align 8
ele1: .quad 0x00a
      .quad ele2
ele2: .quad 0x0b0
      .quad ele3
ele3: .quad 0xc00
      .quad 0 halt

sum_list:
    xorq %rax, %rax # val = 0
    jmp Test


Loop:
    mrmovq (%rdi), %r10
    addq %r10, %rax
    mrmovq 8(%rdi), %rdi

Test:
    andq %rdi, %rdi # if ls->next == NULL
    jne Loop

    ret

.pos 0x200
stack:
```
</details>


> 注意：先 `./yas ans.ys` 检查、编译，然后再 `./yis ans.yo` 运行。

<details>
<summary> <code>./yis ans-sum.yo</code> 运行结果 </summary>

```
❯ ./yis ans-sum.yo
Stopped in 24 steps at PC = 0x1d.  Status 'HLT', CC Z=1 S=0 O=0
Changes to registers:
%rax:   0x0000000000000000      0x0000000000000cba
%rsp:   0x0000000000000000      0x0000000000000200
%r10:   0x0000000000000000      0x0000000000000c00

Changes to memory:
0x01f8: 0x0000000000000000      0x000000000000001d
```

</details>

#### `rsum_list`

注意多了压栈弹栈。

<details>
<summary> <code>ans-rsum.ys</code> </summary>

```
.pos 0
irmovq stack, %rsp
irmovq ele1, %rdi
call rsum_list
halt

.align 8
ele1: .quad 0x00a
      .quad ele2
ele2: .quad 0x0b0
      .quad ele3
ele3: .quad 0xc00
      .quad 0 halt

rsum_list:
    andq %rdi, %rdi
    je Return0

    mrmovq (%rdi), %r8
    pushq %r8
    mrmovq 8(%rdi), %rdi
    call rsum_list
    popq %r8
    addq %r8, %rax
    ret

Return0:
    xorq %rax, %rax
    ret

.pos 0x200
stack:
```

</details>

<details>
<summary> <code>./yis ans-rsum.yo</code> 运行结果 </summary>

```
❯ ./yis ans-rsum.yo
Stopped in 35 steps at PC = 0x1d.  Status 'HLT', CC Z=0 S=0 O=0
Changes to registers:
%rax:   0x0000000000000000      0x0000000000000cba
%rsp:   0x0000000000000000      0x0000000000000200
%r8:    0x0000000000000000      0x000000000000000a

Changes to memory:
0x01c8: 0x0000000000000000      0x000000000000007a
0x01d0: 0x0000000000000000      0x0000000000000c00
0x01d8: 0x0000000000000000      0x000000000000007a
0x01e0: 0x0000000000000000      0x00000000000000b0
0x01e8: 0x0000000000000000      0x000000000000007a
0x01f0: 0x0000000000000000      0x000000000000000a
0x01f8: 0x0000000000000000      0x000000000000001d
```

</details>

#### `copy_block`

注意不能直接 `addq $8, %rdi`，因为 `addq` 只能是寄存器相加，所以需要先 `irmovq $8, %r9`，再 `addq %r9, %rdi`。

<details>
<summary> <code>ans-copy.ys</code> </summary>

```
.pos 0
irmovq stack, %rsp
irmovq src, %rdi
irmovq dest, %rsi
irmovq $3, %r9
rrmovq %r9, %rdx
call copy_block
halt

.align 8
src:
    .quad 0x00a
    .quad 0x0b0
    .quad 0xc00

dest:
    .quad 0x111
    .quad 0x222
    .quad 0x333

copy_block:
    xorq %rax, %rax # result = 0
    jmp Test


Loop:
    # val -> %8

    # val = *src
    mrmovq (%rdi), %r8
    
    irmovq $8, %r9

    # src++
    addq %r9, %rdi

    # *dest = val
    rmmovq %r8, (%rsi)

    # dest++
    addq %r9, %rsi

    # result ^= val
    xorq %r8, %rax

    # len--
    irmovq $1, %r9
    subq %r9, %rdx

Test:
    andq %rdx, %rdx   
    jg Loop

    ret

.pos 0x200
stack:
```

</details>

<details>
<summary> <code>./yis ans-copy.yo</code> 运行结果 </summary>

```
❯ ./yis ans-copy.yo
Stopped in 42 steps at PC = 0x33.  Status 'HLT', CC Z=1 S=0 O=0
Changes to registers:
%rax:   0x0000000000000000      0x0000000000000cba
%rsp:   0x0000000000000000      0x0000000000000200
%rsi:   0x0000000000000000      0x0000000000000068
%rdi:   0x0000000000000000      0x0000000000000050
%r8:    0x0000000000000000      0x0000000000000c00
%r9:    0x0000000000000000      0x0000000000000001

Changes to memory:
0x0050: 0x0000000000000111      0x000000000000000a
0x0058: 0x0000000000000222      0x00000000000000b0
0x0060: 0x0000000000000333      0x0000000000000c00
0x01f8: 0x0000000000000000      0x0000000000000033
```

</details>

#### Part B

要实现 `iaddq V, %rB` 指令，功能是将立即数 V 加到寄存器 rB 中，并更新条件码。

可以参考 `irmovq` 和 `addq` 来实现。

| 阶段 | `OPq rA, rB` | `irmovq V, rB` | `iaddq V, rB` |
| :--- | :--- | :--- | :--- |
| **取指** | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valP \leftarrow PC+2$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valC \leftarrow M_8[PC+2]$<br>$valP \leftarrow PC+10$ | $icode:ifun \leftarrow M_1[PC]$<br>$rA:rB \leftarrow M_1[PC+1]$<br>$valC \leftarrow M_8[PC+2]$<br>$valP \leftarrow PC+10$ |
| **译码** | $valA \leftarrow R[rA]$<br>$valB \leftarrow R[rB]$  | | $valB \leftarrow R[rB]$ |
| **执行** | $valE \leftarrow valB \text{ OP } valA$<br>**Set CC** | $valE \leftarrow 0 + valC$ | $valE \leftarrow valB + valC$ <br>**Set CC** |
| **访存** | | | | | |
| **写回** | $R[rB] \leftarrow valE$ | $R[rB] \leftarrow valE$ | $R[rB] \leftarrow valE$ |
| **更新 PC** | $PC \leftarrow valP$  | $PC \leftarrow valP$ | $PC \leftarrow valP$ |

按照以上设计更改 `sim/seq/seq-full.hcl`

<details>
<summary> <code>sim/seq/seq-full.hcl</code> </summary>

```hcl
#/* $begin seq-all-hcl */
####################################################################
#  HCL Description of Control for Single Cycle Y86-64 Processor SEQ   #
#  Copyright (C) Randal E. Bryant, David R. O'Hallaron, 2010       #
####################################################################

## Your task is to implement the iaddq instruction
## The file contains a declaration of the icodes
## for iaddq (IIADDQ)
## Your job is to add the rest of the logic to make it work

####################################################################
#    C Include's.  Don't alter these                               #
####################################################################

quote '#include <stdio.h>'
quote '#include "isa.h"'
quote '#include "sim.h"'
quote 'int sim_main(int argc, char *argv[]);'
quote 'word_t gen_pc(){return 0;}'
quote 'int main(int argc, char *argv[])'
quote '  {plusmode=0;return sim_main(argc,argv);}'

####################################################################
#    Declarations.  Do not change/remove/delete any of these       #
####################################################################

##### Symbolic representation of Y86-64 Instruction Codes #############
wordsig INOP 	'I_NOP'
wordsig IHALT	'I_HALT'
wordsig IRRMOVQ	'I_RRMOVQ'
wordsig IIRMOVQ	'I_IRMOVQ'
wordsig IRMMOVQ	'I_RMMOVQ'
wordsig IMRMOVQ	'I_MRMOVQ'
wordsig IOPQ	'I_ALU'
wordsig IJXX	'I_JMP'
wordsig ICALL	'I_CALL'
wordsig IRET	'I_RET'
wordsig IPUSHQ	'I_PUSHQ'
wordsig IPOPQ	'I_POPQ'
# Instruction code for iaddq instruction
wordsig IIADDQ	'I_IADDQ'

##### Symbolic represenations of Y86-64 function codes                  #####
wordsig FNONE    'F_NONE'        # Default function code

##### Symbolic representation of Y86-64 Registers referenced explicitly #####
wordsig RRSP     'REG_RSP'    	# Stack Pointer
wordsig RNONE    'REG_NONE'   	# Special value indicating "no register"

##### ALU Functions referenced explicitly                            #####
wordsig ALUADD	'A_ADD'		# ALU should add its arguments

##### Possible instruction status values                             #####
wordsig SAOK	'STAT_AOK'	# Normal execution
wordsig SADR	'STAT_ADR'	# Invalid memory address
wordsig SINS	'STAT_INS'	# Invalid instruction
wordsig SHLT	'STAT_HLT'	# Halt instruction encountered

##### Signals that can be referenced by control logic ####################

##### Fetch stage inputs		#####
wordsig pc 'pc'				# Program counter
##### Fetch stage computations		#####
wordsig imem_icode 'imem_icode'		# icode field from instruction memory
wordsig imem_ifun  'imem_ifun' 		# ifun field from instruction memory
wordsig icode	  'icode'		# Instruction control code
wordsig ifun	  'ifun'		# Instruction function
wordsig rA	  'ra'			# rA field from instruction
wordsig rB	  'rb'			# rB field from instruction
wordsig valC	  'valc'		# Constant from instruction
wordsig valP	  'valp'		# Address of following instruction
boolsig imem_error 'imem_error'		# Error signal from instruction memory
boolsig instr_valid 'instr_valid'	# Is fetched instruction valid?

##### Decode stage computations		#####
wordsig valA	'vala'			# Value from register A port
wordsig valB	'valb'			# Value from register B port

##### Execute stage computations	#####
wordsig valE	'vale'			# Value computed by ALU
boolsig Cnd	'cond'			# Branch test

##### Memory stage computations		#####
wordsig valM	'valm'			# Value read from memory
boolsig dmem_error 'dmem_error'		# Error signal from data memory


####################################################################
#    Control Signal Definitions.                                   #
####################################################################

################ Fetch Stage     ###################################

# Determine instruction code
word icode = [
	imem_error: INOP;
	1: imem_icode;		# Default: get from instruction memory
];

# Determine instruction function
word ifun = [
	imem_error: FNONE;
	1: imem_ifun;		# Default: get from instruction memory
];

bool instr_valid = icode in 
	{ INOP, IHALT, IRRMOVQ, IIRMOVQ, IRMMOVQ, IMRMOVQ,
	       IOPQ, IJXX, ICALL, IRET, IPUSHQ, IPOPQ, IIADDQ };

# Does fetched instruction require a regid byte?
bool need_regids =
	icode in { IRRMOVQ, IOPQ, IPUSHQ, IPOPQ, 
		     IIRMOVQ, IRMMOVQ, IMRMOVQ, IIADDQ };

# Does fetched instruction require a constant word?
bool need_valC =
	icode in { IIRMOVQ, IRMMOVQ, IMRMOVQ, IJXX, ICALL, IIADDQ };

################ Decode Stage    ###################################

## What register should be used as the A source?
word srcA = [
	icode in { IRRMOVQ, IRMMOVQ, IOPQ, IPUSHQ  } : rA;
	icode in { IPOPQ, IRET } : RRSP;
	1 : RNONE; # Don't need register
];

## What register should be used as the B source?
word srcB = [
	icode in { IOPQ, IRMMOVQ, IMRMOVQ, IIADDQ } : rB;
	icode in { IPUSHQ, IPOPQ, ICALL, IRET } : RRSP;
	1 : RNONE;  # Don't need register
];

## What register should be used as the E destination?
word dstE = [
	icode in { IRRMOVQ } && Cnd : rB;
	icode in { IIRMOVQ, IOPQ, IIADDQ } : rB;
	icode in { IPUSHQ, IPOPQ, ICALL, IRET } : RRSP;
	1 : RNONE;  # Don't write any register
];

## What register should be used as the M destination?
word dstM = [
	icode in { IMRMOVQ, IPOPQ } : rA;
	1 : RNONE;  # Don't write any register
];

################ Execute Stage   ###################################

## Select input A to ALU
word aluA = [
	icode in { IRRMOVQ, IOPQ } : valA;
	icode in { IIRMOVQ, IRMMOVQ, IMRMOVQ, IIADDQ } : valC;
	icode in { ICALL, IPUSHQ } : -8;
	icode in { IRET, IPOPQ } : 8;
	# Other instructions don't need ALU
];

## Select input B to ALU
word aluB = [
	icode in { IRMMOVQ, IMRMOVQ, IOPQ, ICALL, 
		      IPUSHQ, IRET, IPOPQ, IIADDQ } : valB;
	icode in { IRRMOVQ, IIRMOVQ } : 0;
	# Other instructions don't need ALU
];

## Set the ALU function
word alufun = [
	icode == IOPQ : ifun;
	1 : ALUADD;
];

## Should the condition codes be updated?
bool set_cc = icode in { IOPQ, IIADDQ };

################ Memory Stage    ###################################

## Set read control signal
bool mem_read = icode in { IMRMOVQ, IPOPQ, IRET };

## Set write control signal
bool mem_write = icode in { IRMMOVQ, IPUSHQ, ICALL };

## Select memory address
word mem_addr = [
	icode in { IRMMOVQ, IPUSHQ, ICALL, IMRMOVQ } : valE;
	icode in { IPOPQ, IRET } : valA;
	# Other instructions don't need address
];

## Select memory input data
word mem_data = [
	# Value from register
	icode in { IRMMOVQ, IPUSHQ } : valA;
	# Return PC
	icode == ICALL : valP;
	# Default: Don't write anything
];

## Determine instruction status
word Stat = [
	imem_error || dmem_error : SADR;
	!instr_valid: SINS;
	icode == IHALT : SHLT;
	1 : SAOK;
];

################ Program Counter Update ############################

## What address should instruction be fetched at

word new_pc = [
	# Call.  Use instruction constant
	icode == ICALL : valC;
	# Taken branch.  Use instruction constant
	icode == IJXX && Cnd : valC;
	# Completion of RET instruction.  Use value from stack
	icode == IRET : valM;
	# Default: Use incremented PC
	1 : valP;
];
#/* $end seq-all-hcl */
```

</details>

然后 `sim/ptest/README` 中有讲到如何测试：

```
❯ make SIM=../seq/ssim TFLAGS=-h
./optest.pl -s ../seq/ssim -h
Usage  [-h] [-i] [-s <sim>] [-P] [-p <pfile>]
   -h       print Help message
   -i       test iaddq instruction
   -s <sim> Specify simulator
   -d <dir> Specify directory for counterexamples
   -P Generate performance data
   -p <version> Check using performance file <pfile>
   -V       test Verilog implementation
   -m <model> Model for Verilog

❯ make SIM=../seq/ssim TFLAGS=-i
./optest.pl -s ../seq/ssim -i
Simulating with ../seq/ssim
  All 58 ISA Checks Succeed
./jtest.pl -s ../seq/ssim -i
Simulating with ../seq/ssim
  All 96 ISA Checks Succeed
./ctest.pl -s ../seq/ssim -i
Simulating with ../seq/ssim
  All 22 ISA Checks Succeed
./htest.pl -s ../seq/ssim -i
Simulating with ../seq/ssim
  All 756 ISA Checks Succeed
```

`iaddq` implemented successfully!

#### Part C

咕咕咕！