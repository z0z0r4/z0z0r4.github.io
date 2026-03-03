---
title: CSAPP Bomb Lab
sticky: false
mermaid: false
date: 2026-03-03 15:59:34
tags:
  - CSAPP
  - learning-notes
categories:
  - learning-notes
  - CS
  - CSAPP
cover: covers/IMG_20260303_205748_156.png
comments:
copyright:
sponsor:
---

2026-03-03 完成 :D

[材料下载](https://csapp.cs.cmu.edu/3e/bomb.tar)

其中可以将答案写在文件里面，然后运行 `./bomb ans.txt`，可以不用手动输入。

其次注意，必须在文件末尾留一个空行，不然会爆炸...

---

## 参考答案

<details>
<summary>我的一份答案 ans.txt</summary>

Border relations with Canada have never been better.
1 2 4 8 16 32
0 207
7 0 DrEvil
9ON567
4 3 2 1 6 5
20

</details>

我的一份注释 <https://gist.github.com/z0z0r4/32628db54848b181a0dc4b5a0347bd58>

---

## phase1

`0x402400` 里面存了 `Border relations with Canada have never been better.`

这个字符串就是答案。

## phase2

读取六个数字，第一个数字必须为 1，然后要求前一个数字是后一个数字的两倍，即等比数列。

答案是 1 2 4 8 16 32。

## phase3

`phase_3` 读取两个数字到 `%rcx` 和 `%rdx`，要求 `%rcx` 即第一个数字的取值范围为 0~7，然后 `jmp  *0x402470(,%rax,8)` 会按照下面的跳表，跳到 8 种 case。

```
// 0x402470:       0x0000000000400f7c      0x0000000000400fb9
// 0x402480:       0x0000000000400f83      0x0000000000400f8a
// 0x402490:       0x0000000000400f91      0x0000000000400f98
// 0x4024a0:       0x0000000000400f9f      0x0000000000400fa6
```

- `%rax = 0` -> `0x400f7c`
- `%rax = 1` -> `0x400fb9`
- `%rax = 2` -> `0x400f83`
- `%rax = 3` -> `0x400f8a`
- `%rax = 4` -> `0x400f91`
- `%rax = 5` -> `0x400f98`
- `%rax = 6` -> `0x400f9f`
- `%rax = 7` -> `0x400fa6` 

8 种 case 都是对 `%eax` 的赋值，以及跳转到再后面的代码

```asm
// case 0
400f7c:	b8 cf 00 00 00       	mov    $0xcf,%eax // %eax = 0xcf = 207
400f81:	eb 3b                	jmp    400fbe <phase_3+0x7b>

// case 2
400f83:	b8 c3 02 00 00       	mov    $0x2c3,%eax // %eax = 0x2c3 = 707
400f88:	eb 34                	jmp    400fbe <phase_3+0x7b>

// case 3
400f8a:	b8 00 01 00 00       	mov    $0x100,%eax // %eax = 0x100 = 256
400f8f:	eb 2d                	jmp    400fbe <phase_3+0x7b>

// case 4
400f91:	b8 85 01 00 00       	mov    $0x185,%eax // %eax = 0x185 = 389
400f96:	eb 26                	jmp    400fbe <phase_3+0x7b>

// case 5
400f98:	b8 ce 00 00 00       	mov    $0xce,%eax // %eax = 0xce = 206
400f9d:	eb 1f                	jmp    400fbe <phase_3+0x7b>

// case 6
400f9f:	b8 aa 02 00 00       	mov    $0x2aa,%eax // %eax = 0x2aa = 682
400fa4:	eb 18                	jmp    400fbe <phase_3+0x7b>

// case 7
400fa6:	b8 47 01 00 00       	mov    $0x147,%eax // %eax = 0x147 = 327
400fab:	eb 11                	jmp    400fbe <phase_3+0x7b>

// unknown
400fad:	e8 88 04 00 00       	call   40143a <explode_bomb>
400fb2:	b8 00 00 00 00       	mov    $0x0,%eax // %eax = 0
400fb7:	eb 05                	jmp    400fbe <phase_3+0x7b>

// 1
400fb9:	b8 37 01 00 00       	mov    $0x137,%eax // %eax = 0x137 = 311
```

- `%rax = 0` -> `0x400f7c` -> 207
- `%rax = 1` -> `0x400fb9` -> 311
- `%rax = 2` -> `0x400f83` -> 707
- `%rax = 3` -> `0x400f8a` -> 256
- `%rax = 4` -> `0x400f91` -> 389
- `%rax = 5` -> `0x400f98` -> 206
- `%rax = 6` -> `0x400f9f` -> 682
- `%rax = 7` -> `0x400fa6` -> 327

只要把上面对应的组合输入进去就是答案。

> 但我还是不知道标 unknown 的有什么用，没有看到跳转到 0x400fad 的，可能疏忽了

<details>
<summary> phase_3 注释 </summary>


0000000000400f43 <phase_3>:
  400f43:	48 83 ec 18          	sub    $0x18,%rsp
  400f47:	48 8d 4c 24 0c       	lea    0xc(%rsp),%rcx // %rcx = %rsp + 0xc int 4 bytes, num2
  400f4c:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx // %rdx = %rsp + 0x8 int 4 bytes, num1
  400f51:	be cf 25 40 00       	mov    $0x4025cf,%esi // %esi = 0x4025cf (%d %d) (%rdx %rcx)
  400f56:	b8 00 00 00 00       	mov    $0x0,%eax // %eax = 0 (the count of successfully parsed items)
  400f5b:	e8 90 fc ff ff       	call   400bf0 <__isoc99_sscanf@plt>
  400f60:	83 f8 01             	cmp    $0x1,%eax // cmp %eax, 0x1
  400f63:	7f 05                	jg     400f6a <phase_3+0x27> // %eax > 0x1
  400f65:	e8 d0 04 00 00       	call   40143a <explode_bomb> // only one item, explode the bomb
  400f6a:	83 7c 24 08 07       	cmpl   $0x7,0x8(%rsp) // cmp 0x8(%rsp) (num1), 0x7
  400f6f:	77 3c                	ja     400fad <phase_3+0x6a> // num1 > 0x7, if so jump to 400fad, which explodes the bomb
  400f71:	8b 44 24 08          	mov    0x8(%rsp),%eax // %eax = 0x8(%rsp) (%eax = num1)
  400f75:	ff 24 c5 70 24 40 00 	jmp    *0x402470(,%rax,8) // jump to the address stored at 0x402470 + %rax * 8, which is a jump table

  // 0x402470:       0x0000000000400f7c      0x0000000000400fb9
  // 0x402480:       0x0000000000400f83      0x0000000000400f8a
  // 0x402490:       0x0000000000400f91      0x0000000000400f98
  // 0x4024a0:       0x0000000000400f9f      0x0000000000400fa6

  // case 0
  400f7c:	b8 cf 00 00 00       	mov    $0xcf,%eax // %eax = 0xcf = 207
  400f81:	eb 3b                	jmp    400fbe <phase_3+0x7b>
  
  // case 2
  400f83:	b8 c3 02 00 00       	mov    $0x2c3,%eax // %eax = 0x2c3 = 707
  400f88:	eb 34                	jmp    400fbe <phase_3+0x7b>

  // case 3
  400f8a:	b8 00 01 00 00       	mov    $0x100,%eax // %eax = 0x100 = 256
  400f8f:	eb 2d                	jmp    400fbe <phase_3+0x7b>

  // case 4
  400f91:	b8 85 01 00 00       	mov    $0x185,%eax // %eax = 0x185 = 389
  400f96:	eb 26                	jmp    400fbe <phase_3+0x7b>

  // case 5
  400f98:	b8 ce 00 00 00       	mov    $0xce,%eax // %eax = 0xce = 206
  400f9d:	eb 1f                	jmp    400fbe <phase_3+0x7b>

  // case 6
  400f9f:	b8 aa 02 00 00       	mov    $0x2aa,%eax // %eax = 0x2aa = 682
  400fa4:	eb 18                	jmp    400fbe <phase_3+0x7b>

  // case 7
  400fa6:	b8 47 01 00 00       	mov    $0x147,%eax // %eax = 0x147 = 327
  400fab:	eb 11                	jmp    400fbe <phase_3+0x7b>
  
  // unknown
  400fad:	e8 88 04 00 00       	call   40143a <explode_bomb>
  400fb2:	b8 00 00 00 00       	mov    $0x0,%eax // %eax = 0
  400fb7:	eb 05                	jmp    400fbe <phase_3+0x7b>

  // 1
  400fb9:	b8 37 01 00 00       	mov    $0x137,%eax // %eax = 0x137 = 311

  400fbe:	3b 44 24 0c          	cmp    0xc(%rsp),%eax // cmp 0xc + %rsp, %eax
  400fc2:	74 05                	je     400fc9 <phase_3+0x86> // if equal, jump to 400fc9, which ends the phase
  400fc4:	e8 71 04 00 00       	call   40143a <explode_bomb> // if not equal, explode the bomb
  400fc9:	48 83 c4 18          	add    $0x18,%rsp // clean up the stack
  400fcd:	c3                   	ret

</details>

## phase4

phase4 给定 $[0,14]$ 二分查找，用一个寄存器 `%eax` 就可以简单的记录数字树中的路径，向左则 `%eax * 2`，向右则 `%eax * 2 + 1`，`*2` 可以每跳转一次左移一位，最后递归结束后可以得到完整的路径（注意是调用递归后才记录，所以是倒序的，人得从右往左读）

phase4 要求 `%eax` 初始化时 0，`%eax` 结果是 0，也就是一直向左，不向右 +1。

最后要求第二个数字是 0（但我没看懂为什么这里突兀的多这一步，和整个前面的没法衔接起来...）

<details>
<summary> phase_4 注释 </summary>

```asm
0000000000400fce <func4>:
  400fce: 48 83 ec 08           sub    $0x8,%rsp // 分配 0x8 字节
  400fd2: 89 d0                 mov    %edx,%eax // %eax = %edx copy high to eax
  400fd4: 29 f0                 sub    %esi,%eax // %eax = %eax - %esi // high - low
  400fd6: 89 c1                 mov    %eax,%ecx // %ecx = %eax
  400fd8: c1 e9 1f              shr    $0x1f,%ecx // %ecx >>= 31 取符号位
  400fdb: 01 c8                 add    %ecx,%eax // %eax = %eax + %ecx 负数加 1，正数不变
  400fdd: d1 f8                 sar    $1,%eax // %eax >>= 1 除以 2 // %eax = half of (high - low), rounded towards zero
  400fdf: 8d 0c 30              lea    (%rax,%rsi,1),%ecx // %ecx = %rax + %rsi // mid = low + ((high - low) / 2)

  400fe2: 39 f9                 cmp    %edi,%ecx // cmp %ecx, %edi // compare mid and target
  400fe4: 7e 0c                 jle    400ff2 <func4+0x24> // 如果 %ecx <= %edi，跳转到 400ff2

  // mid > target
  400fe6: 8d 51 ff              lea    -0x1(%rcx),%edx // high = mid - 1
  400fe9: e8 e0 ff ff ff        call   400fce <func4> // 递归调用 func4(mid -1, low)
  400fee: 01 c0                 add    %eax,%eax // %eax *= 2
  400ff0: eb 15                 jmp    401007 <func4+0x39> // 跳转到 401007

  // mid <= target
  400ff2: b8 00 00 00 00        mov    $0x0,%eax // %eax = 0
  400ff7: 39 f9                 cmp    %edi,%ecx // cmp %ecx, %edi // compare mid and target

  // mid >= target -> mid == target 结束递归
  400ff9: 7d 0c                 jge    401007 <func4+0x39> // 如果 %ecx >= %edi，跳转到 401007
  
  // mid < target
  400ffb: 8d 71 01              lea    0x1(%rcx),%esi // %esi = %rcx + 1 // low = mid + 1
  400ffe: e8 cb ff ff ff        call   400fce <func4> // 递归调用 func4(mid + 1, high)
  401003: 8d 44 00 01           lea    0x1(%rax,%rax,1),%eax // %eax = %rax * 2 + 1

  401007: 48 83 c4 08           add    $0x8,%rsp // clean up
  40100b: c3                    ret


// 对于 high = 14, low = 0, 二分查找输入的第一个数字，偏高 *2 + 1，偏低 *2 要求最后为 0
000000000040100c <phase_4>:
  40100c: 48 83 ec 18           sub    $0x18,%rsp // 分配 0x18
  401010: 48 8d 4c 24 0c        lea    0xc(%rsp),%rcx // %rcx = 0xc num2
  401015: 48 8d 54 24 08        lea    0x8(%rsp),%rdx // %rdx = 0x8 num1
  40101a: be cf 25 40 00        mov    $0x4025cf,%esi // %esi = 0x4025cf // (gdb) x/s 0x4025cf -> 0x4025cf: "%d %d"
  40101f: b8 00 00 00 00        mov    $0x0,%eax // %eax = 0 读取到的数字个数
  401024: e8 c7 fb ff ff        call   400bf0 <__isoc99_sscanf@plt> // 读取 %d %d 到 %rdx 和 %rcx
  401029: 83 f8 02              cmp    $0x2,%eax // 比较读取到的数字个数和 2
  40102c: 75 07                 jne    401035 <phase_4+0x29> // 数字不够，爆炸
  40102e: 83 7c 24 08 0e        cmpl   $0xe,0x8(%rsp) // 比较 num1 和 0xe (14)
  401033: 76 05                 jbe    40103a <phase_4+0x2e> // 小于等于 0xe，跳转到 40103a
  401035: e8 00 04 00 00        call   40143a <explode_bomb> // 大于 0xe，爆炸
  40103a: ba 0e 00 00 00        mov    $0xe,%edx // %edx = 0xe (14)
  40103f: be 00 00 00 00        mov    $0x0,%esi // %esi = 0
  401044: 8b 7c 24 08           mov    0x8(%rsp),%edi // %edi = num1
  401048: e8 81 ff ff ff        call   400fce <func4>
  40104d: 85 c0                 test   %eax,%eax // 0 比较 %eax
  40104f: 75 07                 jne    401058 <phase_4+0x4c> // 不等于 0，爆炸
  401051: 83 7c 24 0c 00        cmpl   $0x0,0xc(%rsp) // 比较 num2 和 0
  401056: 74 05                 je     40105d <phase_4+0x51> // 等于 0，跳转到 40105d，不爆炸
  401058: e8 dd 03 00 00        call   40143a <explode_bomb>
  40105d: 48 83 c4 18           add    $0x18,%rsp // clean up
  401061: c3                    ret
```
</details>

## phase5

phase5 读取六个字符的字符串，然后取每个字符的低四位（一个 char 有 8 位），四位的取值范围是 0~15，将字符映射到 `0x4024b0` 所存的 `maduiersnfotvbylSo` 的对应字符，然后要求最后结果拼起来是 `0x40245e` 对应的 `flyers`。

<details>
<summary> phase_5 注释 </summary>

```asm
0000000000401062 <phase_5>:
  401062:	53                   	push   %rbx
  401063:	48 83 ec 20          	sub    $0x20,%rsp
  401067:	48 89 fb             	mov    %rdi,%rbx // %rbx = %rdi // readline 的结果在 %rdi
  40106a:	64 48 8b 04 25 28 00 	mov    %fs:0x28,%rax // %rax = canary
  401071:	00 00 
  401073:	48 89 44 24 18       	mov    %rax,0x18(%rsp) // save canary to stack
  401078:	31 c0                	xor    %eax,%eax // %eax = 0
  40107a:	e8 9c 02 00 00       	call   40131b <string_length> // call string_length, %eax = length of input string
  40107f:	83 f8 06             	cmp    $0x6,%eax // compare length with 6
  401082:	74 4e                	je     4010d2 <phase_5+0x70> // jump to 4010d2 if length is 6
  401084:	e8 b1 03 00 00       	call   40143a <explode_bomb> // if length is not 6, explode the bomb
  401089:	eb 47                	jmp    4010d2 <phase_5+0x70> // jump to 4010d2

  40108b:	0f b6 0c 03          	movzbl (%rbx,%rax,1),%ecx  // 取一个字节，零扩展到 %ecx // %ecx = input[rax]
  40108f:	88 0c 24             	mov    %cl,(%rsp) // %cl -> %rcx 的低 8 位，存到栈顶
  401092:	48 8b 14 24          	mov    (%rsp),%rdx // 读取栈顶的值到 %rdx
  401096:	83 e2 0f             	and    $0xf,%edx // %edx = %edx & 0xf // 取低 4 位
  401099:	0f b6 92 b0 24 40 00 	movzbl 0x4024b0(%rdx),%edx // %edx = 0x4024b0 + %rdx 的值 // 0x4024b0 是 maduiersnfotvbylSo
  4010a0:	88 54 04 10          	mov    %dl,0x10(%rsp,%rax,1) // %dl -> %rsp + %rax + 0x10 // %dl 是 %rdx 低八位
  4010a4:	48 83 c0 01          	add    $0x1,%rax // %rax++
  4010a8:	48 83 f8 06          	cmp    $0x6,%rax // compare %rax with 6
  4010ac:	75 dd                	jne    40108b <phase_5+0x29> // if %rax != 6, jump back to 40108b to process the next character

  // after process
  4010ae:	c6 44 24 16 00       	movb   $0x0,0x16(%rsp) // 将 0x0 一字节存到 %rsp + 0x16，字符串结束符
  4010b3:	be 5e 24 40 00       	mov    $0x40245e,%esi // %esi = "flyers"
  4010b8:	48 8d 7c 24 10       	lea    0x10(%rsp),%rdi // %rdi = %rsp + 0x10
  4010bd:	e8 76 02 00 00       	call   401338 <strings_not_equal> // 比较 
  4010c2:	85 c0                	test   %eax,%eax // test %eax, %eax // if not equal, explode the bomb
  4010c4:	74 13                	je     4010d9 <phase_5+0x77>
  4010c6:	e8 6f 03 00 00       	call   40143a <explode_bomb>
  4010cb:	0f 1f 44 00 00       	nopl   0x0(%rax,%rax,1)
  4010d0:	eb 07                	jmp    4010d9 <phase_5+0x77>
  4010d2:	b8 00 00 00 00       	mov    $0x0,%eax // 索引初始化为 0
  4010d7:	eb b2                	jmp    40108b <phase_5+0x29> // 跳到循环开始
  4010d9:	48 8b 44 24 18       	mov    0x18(%rsp),%rax
  4010de:	64 48 33 04 25 28 00 	xor    %fs:0x28,%rax
  4010e5:	00 00 
  4010e7:	74 05                	je     4010ee <phase_5+0x8c>
  4010e9:	e8 42 fa ff ff       	call   400b30 <__stack_chk_fail@plt>
  4010ee:	48 83 c4 20          	add    $0x20,%rsp
  4010f2:	5b                   	pop    %rbx
  4010f3:	c3                   	ret
```

</details>

其中还有 canary，在 `phase_5` 的头尾，这些应该会在 attack lab 用到。

## phase6

phase6 要求输入六个不重复、范围在 1~6 的数字，将其逐个 `7 - n` 映射下，然后按照映射后的数字来重新组合链表，结果要求链表必须是递减的。

我觉得逻辑不是很难，不像上面的进入树的痕迹记录那样的 trick 让我眼前一新（也是记住了），但跳转太多、指令太多了，花了不少时间。

<detials>
<summary> phase_6 注释 </summary>

```asm

00000000004010f4 <phase_6>:
  4010f4:	41 56                	push   %r14 // 压栈，下同
  4010f6:	41 55                	push   %r13
  4010f8:	41 54                	push   %r12
  4010fa:	55                   	push   %rbp
  4010fb:	53                   	push   %rbx
  4010fc:	48 83 ec 50          	sub    $0x50,%rsp // 分配 0x50 空间
  401100:	49 89 e5             	mov    %rsp,%r13 // %r13 = %rsp
  401103:	48 89 e6             	mov    %rsp,%rsi // %rsi = %sp
  401106:	e8 51 03 00 00       	call   40145c <read_six_numbers> // 六个数字存在 %rsi 指向的栈空间，从栈顶开始，0x0 ~ 0x18
  40110b:	49 89 e6             	mov    %rsp,%r14 // %r14 = %rsp
  40110e:	41 bc 00 00 00 00    	mov    $0x0,%r12d // %r12d = 0

  // %r12d 是外层循环 init %r12d = 0, %r12d < 6,%r12d++
  // %ebx 是内层循环，init %ebx = %r12d (此时 %r12d 已经 +1 了), %ebx > 6 (%ebx = 1~6), %ebx++
  // 确保六个数字在 1～6 之间，且没有重复的数字

  401114:	4c 89 ed             	mov    %r13,%rbp // %rbp = %r13
  401117:	41 8b 45 00          	mov    0x0(%r13),%eax // %eax = *(%r13 + 0x0)
  40111b:	83 e8 01             	sub    $0x1,%eax // %eax--
  40111e:	83 f8 05             	cmp    $0x5,%eax // compare %eax with 5
  401121:	76 05                	jbe    401128 <phase_6+0x34> // if %eax <= 5, jump to 401128, else explode the bomb // %eax = 第 %r13 / 4 个数字 <= 5 + 1 = 6 所有数字必须在 1～6 之间
  401123:	e8 12 03 00 00       	call   40143a <explode_bomb>
  401128:	41 83 c4 01          	add    $0x1,%r12d // %r12d++
  40112c:	41 83 fc 06          	cmp    $0x6,%r12d // compare %r12d with 6
  401130:	74 21                	je     401153 <phase_6+0x5f> // if %r12d == 6, jump to 401153 // 验证完了，跳出循环
  401132:	44 89 e3             	mov    %r12d,%ebx // %ebx = %r12d

  401135:	48 63 c3             	movslq %ebx,%rax // %rax = (long) %ebx // 将 %ebx 扩展到 64 位（带符号）
  401138:	8b 04 84             	mov    (%rsp,%rax,4),%eax // %eax = *(%rsp + %rax * 4) // 取出输入的第 %r12d 个数
  40113b:	39 45 00             	cmp    %eax,0x0(%rbp) // compare %eax with *(%rbp + 0x0) // 第 %r12d 和 第 %r13 / 4 个数比较，保证不相等（与前一个数字相比）
  40113e:	75 05                	jne    401145 <phase_6+0x51> // if not equal, jump to 401145, else explode the bomb
  401140:	e8 f5 02 00 00       	call   40143a <explode_bomb>
  401145:	83 c3 01             	add    $0x1,%ebx // %ebx++
  401148:	83 fb 05             	cmp    $0x5,%ebx // compare %ebx with 5
  40114b:	7e e8                	jle    401135 <phase_6+0x41> // if %ebx <= 5, jump to 401135
  40114d:	49 83 c5 04          	add    $0x4,%r13 // %r13 += 4  // %ebx = 6, 且与后面的数字比较完毕，%r13 指向下一个数字
  401151:	eb c1                	jmp    401114 <phase_6+0x20> // jump back to the beginning of the loop


  // 将六个数字设置为 7 - num，存到栈上，准备后续构建链表
  401153:	48 8d 74 24 18       	lea    0x18(%rsp),%rsi // %rsi = %rsp + 0x18 // %rsi 指向第六个数字后面的地址
  401158:	4c 89 f0             	mov    %r14,%rax // %rax = %r14
  40115b:	b9 07 00 00 00       	mov    $0x7,%ecx // %ecx = 7

  401160:	89 ca                	mov    %ecx,%edx // %edx = %ecx
  401162:	2b 10                	sub    (%rax),%edx // %edx = %edx - *(%rax)
  401164:	89 10                	mov    %edx,(%rax) // 将结果存回 %rax 指向的位置 // current_node_value = 7 - current_node_value
  401166:	48 83 c0 04          	add    $0x4,%rax // %rax += 4
  40116a:	48 39 f0             	cmp    %rsi,%rax // compare %rax with %rsi
  40116d:	75 f1                	jne    401160 <phase_6+0x6c> // if not equal, jump back to 401160
  40116f:	be 00 00 00 00       	mov    $0x0,%esi // %esi = 0
  401174:	eb 21                	jmp    401197 <phase_6+0xa3>

  // %ecx > 1，开始在链表中寻找对应的 node
  401176:	48 8b 52 08          	mov    0x8(%rdx),%rdx // %rdx = *(%rdx + 0x8) // 取当前 node 的后 8 bytes next 指针
  40117a:	83 c0 01             	add    $0x1,%eax // %eax++ // id ++
  40117d:	39 c8                	cmp    %ecx,%eax // compare %eax with %ecx // 用 id 和 读取的数字比较 
  40117f:	75 f5                	jne    401176 <phase_6+0x82> // if not equal, jump back to 401176 // 不相等，继续读取链表中的下一个 8 bytes
  401181:	eb 05                	jmp    401188 <phase_6+0x94> // jump to 401188 // 找到相等的，说明已经取到第 node，跳出循环
  401183:	ba d0 32 60 00       	mov    $0x6032d0,%edx // %edx = 0x6032d0 (node1)

  // 0x6032d0 <node1>:       0x000000010000014c      0x00000000006032e0
  // 0x6032e0 <node2>:       0x00000002000000a8      0x00000000006032f0
  // 0x6032f0 <node3>:       0x000000030000039c      0x0000000000603300
  // 0x603300 <node4>:       0x00000004000002b3      0x0000000000603310
  // 0x603310 <node5>:       0x00000005000001dd      0x0000000000603320
  // 0x603320 <node6>:       0x00000006000001bb      0x0000000000000000

  // node1: 332
  // node2: 168
  // node3: 924
  // node4: 691
  // node5: 477
  // node6: 443

  // sorted: 924 691 477 443 332 168
  // 3 4 5 6 1 2
  // 7 - num: 4 3 2 1 6 5

  // 找到了 %ecx 对应的 node，将 node 的值存到栈 0x20 开始的位置上，每 8 bytes 存一个 node 的值，%rsi 每次 += 4
  401188:	48 89 54 74 20       	mov    %rdx,0x20(%rsp,%rsi,2) // 将 %rdx 存到 %rsp + %rsi * 2 + 0x20
  40118d:	48 83 c6 04          	add    $0x4,%rsi // %rsi += 4
  401191:	48 83 fe 18          	cmp    $0x18,%rsi // compare %rsi with 0x18
  401195:	74 14                	je     4011ab <phase_6+0xb7> // if %rsi == 0x18, jump to 4011ab // 存储了六个 node 的值，跳出循环，末尾后是 0x20 + 0x18 = 0x38

  // 开始提取变换后的数字对应的 node 的前 8 bytes 放到链表里面，准备后续比较
  401197:	8b 0c 34             	mov    (%rsp,%rsi,1),%ecx // %ecx = *(%rsp + %rsi) // 取出输入的第 %rsi 个数 // 跳转到这里时候，40116f 将 %rsi 初始化为 0
  40119a:	83 f9 01             	cmp    $0x1,%ecx // compare %ecx with 1
  40119d:	7e e4                	jle    401183 <phase_6+0x8f> // if %ecx <= 1, jump to 401183
  40119f:	b8 01 00 00 00       	mov    $0x1,%eax // %eax = 1 // %ecx > 1, 读取到的数字大于 1
  4011a4:	ba d0 32 60 00       	mov    $0x6032d0,%edx // %edx = 0x6032d0 (node1)
  4011a9:	eb cb                	jmp    401176 <phase_6+0x82>

  // 0x20 开始是 node 指针数组

  4011ab:	48 8b 5c 24 20       	mov    0x20(%rsp),%rbx // %rbx = *(%rsp + 0x20) // 列表头的值
  4011b0:	48 8d 44 24 28       	lea    0x28(%rsp),%rax // %rax = %rsp + 0x28 // %rax 指向存储 node 的值的数组的第二个元素的地址
  4011b5:	48 8d 74 24 50       	lea    0x50(%rsp),%rsi // %rsi = %rsp + 0x50 // 栈尾
  4011ba:	48 89 d9             	mov    %rbx,%rcx // %rcx = %rbx

  4011bd:	48 8b 10             	mov    (%rax),%rdx // %rdx = *(%rax) // 取出下一个 node 的地址
  4011c0:	48 89 51 08          	mov    %rdx,0x8(%rcx) // *(%rcx + 0x8) = %rdx // 将下一个 node 的地址存到第一个 node 的 next 指针上
  4011c4:	48 83 c0 08          	add    $0x8,%rax // %rax += 0x8 // %rax 指向列表中下一个 node 的地址的地址
  4011c8:	48 39 f0             	cmp    %rsi,%rax // compare %rax with %rsi // 如果 %rax == %rsi，说明已经处理完了六个 node，跳出循环
  4011cb:	74 05                	je     4011d2 <phase_6+0xde> // if %rax == %rsi, jump to 4011d2
  4011cd:	48 89 d1             	mov    %rdx,%rcx // %rcx = %rdx // %rcx 设置为下一个 node 的地址，迭代处理
  4011d0:	eb eb                	jmp    4011bd <phase_6+0xc9> // jump back to 4011bd

  4011d2:	48 c7 42 08 00 00 00 	movq   $0x0,0x8(%rdx) // *(%rdx + 0x8) = 0 // 现在 %rdx 是最后一个 node 的地址，将最后一个 node 的 next 指针设置为 0，链表构建完成
  4011d9:	00 

  // 保证链表中的 node 的值是递增的，否则爆炸
  4011da:	bd 05 00 00 00       	mov    $0x5,%ebp // %ebp = 5

  4011df:	48 8b 43 08          	mov    0x8(%rbx),%rax // %rax = *(%rbx + 0x8) // 列表中第二个 node 的地址
  4011e3:	8b 00                	mov    (%rax),%eax // %eax = *(%rax) // 取出第二个 node 的值
  4011e5:	39 03                	cmp    %eax,(%rbx) // compare %eax with *(%rbx) // 将第二个 node 的值和第一个 node 的值比较
  4011e7:	7d 05                	jge    4011ee <phase_6+0xfa> // if %eax >= *(%rbx), jump to 4011ee // 如果第二个 node 的值 >= 第一个 node 的值，不爆炸
  4011e9:	e8 4c 02 00 00       	call   40143a <explode_bomb> // else explode the bomb // 如果第二个 node 的值 < 第一个 node 的值，爆炸

  4011ee:	48 8b 5b 08          	mov    0x8(%rbx),%rbx // %rbx = *(%rbx + 0x8) // %rbx 指向列表中的第二个 node，准备下一轮比较
  4011f2:	83 ed 01             	sub    $0x1,%ebp // %ebp--
  4011f5:	75 e8                	jne    4011df <phase_6+0xeb> // jump back to 4011df // 如果 %ebp != 0，继续比较下一个 node 的值和当前 node 的值，直到比较完了五次（六个 node 之间的比较）
  4011f7:	48 83 c4 50          	add    $0x50,%rsp // clean up
  4011fb:	5b                   	pop    %rbx
  4011fc:	5d                   	pop    %rbp
  4011fd:	41 5c                	pop    %r12
  4011ff:	41 5d                	pop    %r13
  401201:	41 5e                	pop    %r14
  401203:	c3                   	ret
```

</detials>


## secret phase

> `read_line` 会将输入都存入一个数组里

需要在 phase_4 的末尾增加一个 `DrEvil` 来触发 secret_phase。

secret_phase 要求传入一个数字，在给定的二叉树中查找这个数字，和 phase_4 一样记录痕迹，要求痕迹为 2（实际上就是 000...010）

只需要按照这个树找到任意符合的路径就可以了（左右/左右左）

答案可以是 20 和 22。

<detial>
<summary> secret_phase </summary>

```asm

// node: [0x8 value][0x8 left][0x8 right]

// 0x6030f0 <n1>:          0x000024      0x603110
// 0x603100 <n1+16>:       0x603130      0x000000

// 0x603110 <n21>:         0x000008      0x603190
// 0x603120 <n21+16>:      0x603150      0x000000

// 0x603130 <n22>:         0x000032      0x603170
// 0x603140 <n22+16>:      0x6031b0      0x000000

// 0x603150 <n32>:         0x000016      0x603270
// 0x603160 <n32+16>:      0x603230      0x000000

// 0x603170 <n33>:         0x00002d      0x6031d0
// 0x603180 <n33+16>:      0x603290      0x000000

// 0x603190 <n31>:         0x000006      0x6031f0
// 0x6031a0 <n31+16>:      0x603250      0x000000

// 0x6031b0 <n34>:         0x00006b      0x603210
// 0x6031c0 <n34+16>:      0x6032b0      0x000000

// 0x6031d0 <n45>:         0x000028      0x000000
// 0x6031e0 <n45+16>:      0x000000      0x000000

// 0x6031f0 <n41>:         0x000001      0x000000
// 0x603200 <n41+16>:      0x000000      0x000000

// 0x603210 <n47>:         0x000063      0x000000
// 0x603220 <n47+16>:      0x000000      0x000000

// 0x603230 <n44>:         0x000023      0x000000
// 0x603240 <n44+16>:      0x000000      0x000000

// 0x603250 <n42>:         0x000007      0x000000
// 0x603260 <n42+16>:      0x000000      0x000000

// 0x603270 <n43>:         0x000014      0x000000
// 0x603280 <n43+16>:      0x000000      0x000000

// 0x603290 <n46>:         0x00002f      0x000000
// 0x6032a0 <n46+16>:      0x000000      0x000000

// 0x6032b0 <n48>:         0x0003e9      0x000000
// 0x6032c0 <n48+16>:      0x000000      0x000000

//                 0x24
//           /              \
//        0x8              0x32
//       /  \              /  \
//     0x6   0x16       0x2d 0x6b
//    /  \   /  \      /  \   /  \
// 0x1 0x7 0x14 0x23 0x28 0x2f 0x63 0x3e9

0000000000401204 <fun7>:
  401204:	48 83 ec 08          	sub    $0x8,%rsp // 分配 0x8 空间
  401208:	48 85 ff             	test   %rdi,%rdi
  40120b:	74 2b                	je     401238 <fun7+0x34> // if %rdi == 0, jump to 401238 // 代表没有子节点，返回 -1
  40120d:	8b 17                	mov    (%rdi),%edx // %edx = *(%rdi) // 取当前 node 的值
  40120f:	39 f2                	cmp    %esi,%edx // compare %edx with %esi
  401211:	7e 0d                	jle    401220 <fun7+0x1c> // if %edx <= %esi, jump to 401220

  // %edx > %esi
  401213:	48 8b 7f 08          	mov    0x8(%rdi),%rdi // %rdi = *(%rdi + 0x8) // left child node
  401217:	e8 e8 ff ff ff       	call   401204 <fun7>
  40121c:	01 c0                	add    %eax,%eax // %eax = %eax + %eax // %eax * 2
  40121e:	eb 1d                	jmp    40123d <fun7+0x39>

  // %edx <= %esi
  401220:	b8 00 00 00 00       	mov    $0x0,%eax // %eax = 0
  401225:	39 f2                	cmp    %esi,%edx // compare %edx with %esi
  401227:	74 14                	je     40123d <fun7+0x39> // if %edx == %esi, jump to 40123d

  // %edx < %esi
  401229:	48 8b 7f 10          	mov    0x10(%rdi),%rdi // %rdi = *(%rdi + 0x10 (16)) // right child node
  40122d:	e8 d2 ff ff ff       	call   401204 <fun7>
  401232:	8d 44 00 01          	lea    0x1(%rax,%rax,1),%eax // %eax = 1 + %rax + %rax // %eax = 2 * %rax + 1
  401236:	eb 05                	jmp    40123d <fun7+0x39>

  401238:	b8 ff ff ff ff       	mov    $0xffffffff,%eax // %eax = -1 // not found

  40123d:	48 83 c4 08          	add    $0x8,%rsp
  401241:	c3                   	ret

0000000000401242 <secret_phase>:
  401242:	53                   	push   %rbx
  401243:	e8 56 02 00 00       	call   40149e <read_line>
  401248:	ba 0a 00 00 00       	mov    $0xa,%edx // %edx = 0xa (10) 进制
  40124d:	be 00 00 00 00       	mov    $0x0,%esi // %esi = 0
  401252:	48 89 c7             	mov    %rax,%rdi // %rdi = %rax (read_line 的结果)
  401255:	e8 76 f9 ff ff       	call   400bd0 <strtol@plt> // str to long, %rax = 结果
  40125a:	48 89 c3             	mov    %rax,%rbx // %rbx = %rax
  40125d:	8d 40 ff             	lea    -0x1(%rax),%eax // %eax = %rax - 1
  401260:	3d e8 03 00 00       	cmp    $0x3e8,%eax // compare %eax with 0x3e8 (1000) // 输入的数字 - 1 和 1000 比较
  401265:	76 05                	jbe    40126c <secret_phase+0x2a> // if %eax <= 1000, jump to 40126c, else explode the bomb // 输入的数字必须在 1～1001 之间
  401267:	e8 ce 01 00 00       	call   40143a <explode_bomb>
  40126c:	89 de                	mov    %ebx,%esi // %esi = %ebx
  40126e:	bf f0 30 60 00       	mov    $0x6030f0,%edi // root
  401273:	e8 8c ff ff ff       	call   401204 <fun7> // %esi 是输入的数字，%edi 是树的根节点地址
  40127b:	74 05                	je     401282 <secret_phase+0x40> // if %eax == 2, jump to 401282 // %eax = 000000...0010 // left left ... left right left end
  40127d:	e8 b8 01 00 00       	call   40143a <explode_bomb>
  401282:	bf 38 24 40 00       	mov    $0x402438,%edi // Wow! You've defused the secret stage!
  401287:	e8 84 f8 ff ff       	call   400b10 <puts@plt>
  40128c:	e8 33 03 00 00       	call   4015c4 <phase_defused>
  401291:	5b                   	pop    %rbx
  401292:	c3                   	ret
  401293:	90                   	nop
  401294:	90                   	nop
  401295:	90                   	nop
  401296:	90                   	nop
  401297:	90                   	nop
  401298:	90                   	nop
  401299:	90                   	nop
  40129a:	90                   	nop
  40129b:	90                   	nop
  40129c:	90                   	nop
  40129d:	90                   	nop
  40129e:	90                   	nop
  40129f:	90                   	nop
```

</detial>

## TODO

我希望在后续补充记录一些用到的 gdb 调试和寄存器、指令的内容，可能新开 post 或者以后再下面补充。