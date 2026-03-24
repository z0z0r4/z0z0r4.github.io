---
title: CLRS Elementary Data Structure
sticky: false
mermaid: false
date: 2026-03-19 13:59:34
tags:
  - CLRS
  - study-notes
categories:
  - study-notes
  - CS
  - CLRS
cover: covers/CLRS_cover.jpg
comments:
copyright:
sponsor:
---

数据结构部分将结合 [CS61B](/2026/01/18/CS61B-Note-Collection/) 部分补充复杂度证明。

以下内容参考过 [Solutions to Introduction to Algorithms Third Edition](https://walkccc.me/CLRS/)

> CS61B 怎么好像没有专门的栈与队列章节...

## Stack

栈（Stack）是一种后进先出（LIFO）的数据结构，支持以下基本操作：

- `push(x)`: 将元素 `x` 压入栈顶。

- `pop()`: 移除并返回栈顶元素。

可以用数组或链表实现栈，前者定长，后者动态长度但需要为每个节点维护 `next` 指针。

试图弹出空栈会导致下溢（underflow），而试图压入满栈会导致上溢（overflow）。

很显然，栈的 `push` 和 `pop` 操作的时间复杂度都是 O(1)。

## Queue

队列（Queue）是一种先进先出（FIFO）的数据结构，支持以下基本操作：

- `enqueue(x)`: 将元素 `x` 加入队尾。

- `dequeue()`: 移除并返回队头元素。

可以用数组或链表实现队列，前者定长，后者动态长度但需要为每个节点维护 `next` 指针。

> 注意 `next` 指向的是出队时的下一个元素。

队列的 `enqueue` 和 `dequeue` 操作的时间复杂度都是 O(1)。

队列的数组实践中，规定从 `head` 弹出，`tail` 插入。每次添加元素时，`tail` 向后移动；每次删除元素时，`head` 向后移动。若 `tail` 超过数组末尾，则回绕到数组开头继续使用。当 `head` 和 `tail` 重合时，队列为空；当 `tail` 的下一个位置是 `head` 时，队列为满。

> 为什么要循环？
>
> 因为如果不循环，队列没法利用有元素弹出后 `head` 前面的空间。或者只能在 `tail` 超过数组末尾时将所有元素向前移动，但每个空出来的位置都分摊到一次 `enqueue` 操作上，也许依旧是 O(1)，但常数因子变大了。

## Stack <-> Queue

> 10.1-6 用两个栈实现一个队列

栈的写入和读取顺序相反，而队列要求顺序相同，所以先压入一个栈 A，再弹出压入到另一个栈 B，再从栈 B 弹出就是队列的弹出的顺序了。

具体来说应该在栈 B 为空时才将栈 A 所有元素弹出压入栈 B，以免顺序被污染。

每个元素都被压入栈 A、弹出栈 A、压入栈 B、弹出栈 B 各一次，所以总共 4 次操作，所以 `enqueue` 和 `dequeue` 的时间复杂度都是 O(1)。

> 10.1-7 用两个队列实现一个栈

假设队列 A 的弹出顺序已经是栈的弹出顺序了，那么如果要压入一个元素，就应该压入到队列 A 的 `head` 前面。但由于队列只能在 `tail` 插入，所以需要先将新元素放在队列 B，然后逐个将队列 A 的元素弹出压入队列 B，即可得到所需的顺序，最后交换队列 A 和 B 的角色。

由于每次插入都需要移动队列 A 中的所有元素，所以 `push` 的时间复杂度是 O(n)；

而 `pop` 直接弹出即可，时间复杂度是 O(1)。

> 类比，以上是 `push` 昂贵的实现，也有 `pop` 昂贵的实现。若直接将元素顺序放入队列，那么应该弹出的元素在队列末尾，弹出时，先弹出前面所有元素到另一个队列，然后弹出最后一个元素，然后交换两个队列的角色。那么 `push` 的时间复杂度是 O(1)，而 `pop` 的时间复杂度是 O(n)。

## Linked List

链表有指针 `head` 和 `tail` 记录头尾节点，节点只有 `next` 的是单链表，节点有 `next` 和 `prev` 的是双链表。

关于循环链表和 NIL 节点见 [CS61B](/2026/01/18/CS61B-Note-Collection/#sentinel-node)。

> 10.2-1 单链表能否在 O(1) 时间内在任意位置插入和删除节点？

~~单链表只能在 O(1) 时间内在头部插入和删除节点，因为需要知道前一个节点才能在任意位置插入和删除节点。~~

对于插入操作，可以插入到指定位置的后面，但是不能在 O(1) 插入到指定位置的前面，因为必须修改前驱节点的指针。

对于删除节点 Z，虽然我们不知道前驱节点 X，没法修改 X 的 `next` 指针到被删除节点的后面，但是可以将下一个节点 Y 的值复制到节点 Z，然后删除节点 Y。缺点是拷贝开销和无法删除尾节点、潜在的野指针。

> 10.2-2 用单链表实现栈。要求 `push` 和 `pop` 的时间复杂度都是 O(1)。

单链表就是个栈，`push` 就是将新节点插入到头部，`pop` 就是将头节点弹出。

> 10.2-3 用单链表实现队列。要求 `enqueue` 和 `dequeue` 的时间复杂度都是 O(1)。

~~和上文 [Stack <-> Queue](#stack---queue) 部分一样，用两个单链表构成栈 A 和 B 即可。~~

单链表的 `head` 是队头，`tail` 是队尾，`enqueue` 就是将新节点插入到 `tail` 后面，`dequeue` 就是将 `head` 弹出。

> 10.2-4 搜索迭代每次都要测试 `x != NIL` 和 `x.key != k`，能否忽略 `x != NIL` 的测试？

在确定头节点 `x.key != k` 之后，将头节点的 `key` 赋值为 `k`，这样当搜索循环回到头节点时，`x.key == k` 就会终止循环。

记得最后要将头节点的 `key` 恢复原值。

如果有 NIL 节点，显然直接将 NIL 节点的 `key` 赋值为 `k` 就好了。

> 10.2-5 使用单向循环实现字典，`search`、`insert` 和 `delete` 的时间复杂度是？

如果是不可重复字典，那么三者都是 O(n)，其中 `insert` 需要遍历链表才能决定是否头插。

如果是可重复字典，`insert` 直接头插，时间复杂度是 O(1)，而 `search` 和 `delete` 都是 O(n)。

> 10.2-6 两个不相交集合的 `Union` 操作总是销毁两个集合，能否在 O(1) 时间内实现 `Union` 操作？

很显然如果集合是链表的话，直接将 S1 的 `tail` 的 `next` 指向 S2 的 `head`，然后将 S1 的 `tail` 更新为 S2 的 `tail` 就好了。

> 10.2-7 不用递归，只用常量额外空间将单链表反转

```
          n1       n2       n3
          |         |        |
Node1 -> Node2 -> Node3 -> Node4 -> ...
```

```cpp
n1 = L.NIL
n2 = L.NIL.next

while n2 != L.NIL:
    n3 = n2.next
    n2.next = n1
    n1 = n2
    n2 = n3
L.NIL.next = n1 // 注意 NIL 的 next 还指向原来的第一个元素，需要更新它的 next 指向反转后的第一个元素
```

虽然如果将 `n1` 和 `n2` 反向链接之后，会丢失原来的 `n2.next`，但如果循环的时候提前记录为 `n3` 就可以了。

> 10.2-8 设 $$x.np = \text{prev} \oplus \text{next}$$，其中 NIL 的地址为 0，试用这种方法实现双链表，并在 O(1) 时间内实现反转。

由于有 $$x.np = \text{prev} \oplus \text{next}$$

所以有 $$\text{prev} = x.np \oplus \text{next}$$ 和 $$\text{next} = x.np \oplus \text{prev}$$

没法从 `x.np` 直接计算得出 `x.next` 或者 `x.prev` 所有操作都必须从头开始，利用已知 NIL 为 0 来计算。

此外对于反转，由于 $$ x.np = \text{prev} \oplus \text{next} = \text{next} \oplus \text{prev} $$ 所以反转后 `x.np` 不变，所以反转操作只需要交换链表的 `head` 和 `tail` 就好了。

~~我一直在想有没有办法能直接从 `np` 解出 `next` 和 `prev`~~

## Implementing Pointers and Objects

离开了对象和指针一样可以只用数组来构建它们。

在 OOP 语言中可以创建对象，存储到内存堆，同样也可以在数组中存储这些对象的成员。

比如

```cpp
struct Node{
  int value;
  Node *next;
  Node *prev;
};
```

一种方法是为每个成员创建一个数组，存储所有对象的该成员的值，比如 `value[]`、`next[]` 和 `prev[]`，对象 `i` 的成员值就存储在 `value[i]`、`next[i]` 和 `prev[i]` 中。

另一种方法是为每个对象创建一个数组，由于每个对象都占用固定大小的内存，所以对象 `i` 的成员值就存储在 `array[i * size + offset]` 中，其中 `size` 是每个对象占用的内存大小，`offset` 是成员在对象中的偏移量。

实际上把内存当成数组看，那这就是在做和编译器一样的事情。

---

对于内存分配，或者说数组分配，如果对象永不销毁，那么只要从头到尾填满数组即可，空间利用率为 100%。

但对象销毁后就会留下空位，如果不继续利用，很快内存就会耗尽。一般由 garbage collector 来回收，下面用自由表来维护分配和回收。

自由表是单链表，在数组上记录下一个自由空位将空位穿起来，`free` 指针指向第一个空位。当需要分配对象时，从 `free` 指针指向的空位分配，并将 `free` 更新为下一个空位；当对象销毁时，将其位置加入自由表中。

~~这些概念已经见过好几次了~~

> 10.3-4 如何使得 `free` 指针指向的空位总是数组中最早的空位？使得数组紧凑

每次释放空间后，将最后一个分配的对象移动到被释放的位置，并更新 `free` 指针到最后一个分配的对象的位置。

> 10.3-5 Let $L$ be a doubly linked list of length $n$ stored in arrays $key$, $prev$, and $next$ of length $m$. Suppose that these arrays are managed by $\text{ALLOCATE-OBJECT}$ and $\text{FREE-OBJECT}$ procedures that keep a doubly linked free list $F$. Suppose further that of the $m$ items, exactly $n$ are on list $L$ and $m - n$ are on the free list. Write a procedure $\text{COMPACTIFY-LIST}(L, F)$ that, given the list $L$ and the free list $F$, moves the items in $L$ so that they occupy array positions $1, 2, \ldots, n$ and adjusts the free list $F$ so that it remains correct, occupying array positions $n + 1, n + 2, \ldots, m$. The running time of your procedure should be $\Theta(n)$, and it should use only a constant amount of extra space. Argue that your procedure is correct.

由于这是个数组，可以任意访问节点，且目标是将 $L$ 的元素划分到 $[1, n]$，自由表划分到 $[n + 1, m]$，所以要处理的是 $[n + 1, m]$ 中的 $L$ 的元素以及 $[1, n]$ 中的自由表元素。

那么就和快速排序中的分区一样，两两交换直到 $[1, n]$ 中没有自由表元素，$[n + 1, m]$ 中没有 $L$ 的元素。

此处的“交换”，必须要考虑修改被交换元素的指针，以及指针指向的节点的指针，保证链表结构不被破坏。

## Representing Rooted Trees

有根树显然可以用链表来表示，其中分为分支有限树和分支无限树。

### k-ary Tree

假设每个节点有 k 个子节点，比如 $k = 2$ 是二叉树

```cpp
struct Node{
  int value;
  Node *left_child;
  Node *right_child;
};
```

但如果 k 很大，可以用指针数组存储子节点的指针。

```cpp
struct Node{
  int value;
  Node *children[k];
};
```

### General Tree

对于这些树，可以用左孩子右兄弟表示法来表示，其中 `left_child` 指向第一个子节点，`right_sibling` 指向下一个兄弟节点。

```cpp
struct Node{
  int value;
  Node *left_child;
  Node *right_sibling;
};
```

对于这种树，若目标节点是父节点的第 i 个子节点，那么需要从父节点的 `left_child` 开始，沿着 `right_sibling` 向右移动 i-1 次才能找到目标节点。

> 10.4-4 不利用递归和栈，直接 O(n) 实现树的遍历

```cpp
void traverse(Node *root){
  Node *current = root;
  while(current != NULL){
    // 访问 current
    if(current->left_child != NULL){
      current = current->left_child;
    } else if(current->right_child != NULL){
      current = current->right_child;
    } else { // 没有子节点，开始回退
      backtracking:
      if (current == root) break; // 回退到根节点，遍历结束
      else if (current == current->parent->left_child) { // 是父节点的左子节点
        if (current->parent->right_child != NULL) {
          current = current->parent->right_child; // 回退到父节点的右子节点
        } else { // 没有右子节点
          current = current->parent; // 回退到父节点
          goto backtracking;
        }
      } else { // 是父节点的右子节点
          current = current->parent; // 回退到父节点
          goto backtracking;
      }
    }
  }
}
```

但如上的 `goto` 实现很丑陋，<https://walkccc.me/CLRS/Chap10/10.4/#104-5-star> 提供了一份维护 `prev` 指针的实现。

```cpp
void traverse(Node *root) {
    if (root == nullptr) return;

    Node *current = root;
    Node *prev = nullptr;

    while (current != nullptr) {
        if (prev == nullptr || prev == current->parent) {
            if (current->left_child != nullptr) {
                prev = current;
                current = current->left_child;
            } else if (current->right_child != nullptr) {
                prev = current;
                current = current->right_child;
            } else {
                prev = current;
                current = current->parent;
            }
        }
        else if (prev == current->left_child) {
            if (current->right_child != nullptr) {
                prev = current;
                current = current->right_child;
            } else {
                prev = current;
                current = current->parent;
            }
        }
        else {
            prev = current;
            current = current->parent;
        }
    }
}
```

> 10.4-6 将左孩子右兄弟法的三个指针改为两个指针和一个布尔值，使其节点的父节点或者所有其孩子节点可以在其孩子树的线性时间内到达

将 `parent` 指针换为 `is_final_left_child` 布尔值，表示当前节点是否是父节点的最右子节点。

如果是最右子节点，那么它的 `right_sibling` 就指向父节点；如果不是最右子节点，那么它的 `right_sibling` 就指向下一个兄弟节点。

*`parent` 字段一直重复，而最右子节点的 `right_sibling` 总是 `null` 显然应该从它俩下手*

## 10-3 Searching a sorted compact list

根据前文，我们可以得到一个有序紧凑数组，10-3 给出思路将其搜索时间复杂度降低到 $O(\sqrt{n})$。

<!-- COMPACT-LIST-SEARCH(L, n, k)
    i = L
    while i != NIL and key[i] < k
        j = RANDOM(1, n)
        if key[i] < key[j] and key[j] ≤ k
            i = j
            if key[i] == k
                return i
        i = next[i]
    if i == NIL or key[i] > k
        return NIL
    else return i -->

```cpp
int COMPACT_LIST_SEARCH(int L, int n, int k) {
    int i = L;
    while (i != NIL && key[i] < k) {
        int j = RANDOM(1, n);
        if (key[i] < key[j] && key[j] <= k) {
            i = j;
            if (key[i] == k) {
                return i;
            }
        }
        i = next[i];
    }
    if (i == NIL || key[i] > k) {
        return NIL;
    } else {
        return i;
    }
}
```

以及为了方便分析而简化的版本：

<!-- COMPACT-LIST-SEARCH'(L, n, k, t)
    i = L
    for q = 1 to t
        j = RANDOM(1, n)
        if key[i] < key[j] and key[j] ≤ k
            i = j
            if key[i] == k
                return i
    while i != NIL and key[i] < k
        i = next[i]
    if i == NIL or key[i] > k
        return NIL
    else return i -->

```cpp
int COMPACT_LIST_SEARCH_PRIME(int L, int n, int k, int t) {
    int i = L;
    for (int q = 1; q <= t; q++) {
        int j = RANDOM(1, n);
        if (key[i] < key[j] && key[j] <= k) {
            i = j;
            if (key[i] == k) {
                return i;
            }
        }
    }
    while (i != NIL && key[i] < k) {
        i = next[i];
    }
    if (i == NIL || key[i] > k) {
        return NIL;
    } else {
        return i;
    }
}
```

假设随机变量 $X \tag{t}$ 为经过 $t$ 次随机跳跃后，`COMPACT-LIST-SEARCH` 中 `i` 到目标 `k` 的距离。

题目给出的论证过程分为：

1. 假设 `COMPACT-LIST-SEARCH(L, n, k)` 的 `while` 循环执行了 $t$ 次，论证 `COMPACT-LIST-SEARCH'(L, n, k, t)` 会返回一样的结果，且 `COMPACT-LIST-SEARCH'(L, n, k, t)` 的 `while` 和 `for` 循环的迭代次数之和至少为 $t$。

由于两者的 `RANDOM` 返回序列相同，设 $i_m$ 为 `CLS` 在第 $m$ 次循环开始时的指针，$i'_m$ 为 `CLS'` 在第 $m$ 次循环开始时的指针。

考虑循环不变式 $key[i'_m] \le key[i_m]$ 始终成立。

基础情况：$m = 1$，两者都从头节点开始，所以 $key[i'_1] = key[i_1]$，不变式成立。

假设第 $m$ 次循环开始时 $key[i'_m] \le key[i_m]$ 成立，考虑第 $m$ 次生成的随机索引 $j$：

- 如果 $j$ 对两者都有效 ($key[i_m] < key[j] \le k$)：`CLS` 会先跳到 $j$，然后执行 next，最终 $i_{m+1} = next[j]$。而 `CLS'` 只跳到 $j$，即 $i'_{m+1} = j$。因为链表是递增的，所以 $key[i'_{m+1}] = key[j] < key[next[j]] = key[i_{m+1}]$，不变式成立。

- 如果 $j$ 对两者都无效 ($key[j] \le key[i'_m]$ 或 $key[j] > k$)：两者都不跳跃。`CLS` 仅执行 next ($i_{m+1} = next[i_m]$)，`CLS'` 原地不动 ($i'_{m+1} = i'_m$)。因为 $key[i'_m] \le key[i_m] < key[next[i_m]]$，所以 $key[i'_{m+1}] < key[i_{m+1}]$，不变式成立。

- 如果 $j$ 对 `CLS'` 有效，对 `CLS` 无效 (正如你分析的)：说明 $key[i'_m] < key[j] \le key[i_m]$。跳跃后 $i'_{m+1} = j$，而 `CLS` 执行 next，$i_{m+1} = next[i_m]$。因此 $key[i'_{m+1}] = key[j] \le key[i_m] < key[i_{m+1}]$，不变式依然成立。

- 如果 $j$ 对 `CLS` 有效，对 `CLS'` 无效：这种情况不可能发生。因为如果 $key[i_m] < key[j]$，由归纳假设 $key[i'_m] \le key[i_m]$，必然推导出 $key[i'_m] < key[j]$，所以 `CLS'` 必定也会认为它有效。

所以 `COMPACT-LIST-SEARCH'(L, n, k, t)` 的 `while` 和 `for` 循环的迭代次数之和至少为 $t$。

2. 论证 `COMPACT-LIST-SEARCH'(L, n, k, t)` 的期望运行时间为 $O(t + \text E[X_t])$。

`COMPACT-LIST-SEARCH'` 的运行时间由两部分组成：`for` 循环的 $t$ 次迭代，以及 `while` 循环的迭代次数 $X_t$，其中 $X_t$ 是经过 $t$ 次随机跳跃后指针距离目标 `k` 的距离，也就是 `while` 循环的迭代次数。

3. 证明 $\text E[X_t] \le \sum_{r = 1}^n (1 - r / n)^t$。

有公式 C.25:

$$\text E[X_t] = \sum_{r = 1}^n P(X_t \ge r)$$

其中 $P(X_t \ge r)$ 是在 $t$ 次随机跳跃后，指针距离目标 `k` 的距离至少为 $r$ 的概率。

每次随机跳跃成功的概率是 $r / n$，所以 $t$ 次失败的概率 $P(X_t \ge r) = (1 - r / n)^t$。

4. 证明 $\sum_{r = 0}^{n - 1} r^t \le n^{t + 1} / (t + 1)$。

5. 证明 $\text E[X_t] \le n / (t + 1)$。

6. 证明 `COMPACT-LIST-SEARCH'(L, n, k, t)` 的期望运行时间为 $O(t + n / t)$。

7. 证明 `COMPACT-LIST-SEARCH` 的期望运行时间为 $O(\sqrt n)$。

8. 讨论为什么在 `COMPACT-LIST-SEARCH` 中假设所有键值都不同，以及当列表中包含重复键值时，随机跳跃不一定能在渐近意义上提供帮助。

TODO: Morris 遍历

TODO：LCRS 平均时间复杂度分析