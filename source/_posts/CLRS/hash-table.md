---
title: CLRS Hash Tables
sticky: false
mermaid: false
date: 2026-03-21 11:42:54
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

CLRS 第 11 章 Hash Tables 记录。

<!-- more -->

以下内容参考过 [Solutions to Introduction to Algorithms Third Edition](https://walkccc.me/CLRS/)

散列表是支持动态集合操作的数据结构，支持以下操作：

- INSERT，将一个新的元素放入集合中。

- DELETE，从集合中移除一个特定的元素。

- SEARCH，在集合中查找一个特定的元素。

> 以下的定义和 CLRS 的定义略不同，CLRS 中的散列表就是动态集合，键是元素，值是卫星数据。

或者说，散列表是一种通过散列函数（Hash Function）将特定的键（Key）映射到表中的一个位置来访问记录的数据结构。

键值对是由一个键和一个值组成的数据项，其中键是唯一的标识符，而值是与该键相关联的数据。


## Direct-address tables

全域 $U = \{0, 1, ..., m-1\}$ 指的是键的所有取值集合。

直接寻址法是一种简单的散列表实现方法，适用于全域范围较小且连续的情况。它使用一个数组来存储键值对，其中数组的索引直接对应于键的值。

```cpp
class DirectAddressTable{
    int table[m]

    public:

    void insert(int key, int value):
        table[key] = value
    
    void delete(int key):
        table[key] = null

    int search(int key):
        return table[key]
}
```

显然三个操作时间复杂度为 O(1)。然而，直接寻址法的空间复杂度为 O(M)。如果键范围很大但实际使用的键较少，这种方法会浪费大量的空间。

---

> 11.1-1
> Suppose that a dynamic set S isrepresented byadirect-address table T of length m.
> Describe a procedure that finds the maximum element of S. What is the worst-case
> performance of your procedure?

要找到动态集合 S 中的最大元素，可以直接从后向前遍历表 T，第一个非空元素就是最大的元素，索引就是顺序

> 11.1-2
> A bit vector is simply an array of bits (0s and 1s). A bit vector of length m takes
> much less space than an array of m pointers. Describe how to use a bit vector
> to represent a dynamic set of distinct elements with no satellite data. Dictionary
> operations should run in $O(1)$ time.

因为不需要存储指向卫星数据的指针，直接用 0 表示该值为索引值的元素不存在，用 1 表示存在，其他和直接寻址法一样。

> 11.1-3
> Suggest how to implement a direct-address table in which the keys of stored el
> ements do not need to be distinct and the elements can have satellite data. All
> three dictionary operations (INSERT, DELETE, and SEARCH) should run in $O(1)$
> time. (Don’t forget that DELETE takes as an argument a pointer to an object to be
> deleted, not a key.)

直接寻址法且允许键不唯一，那么可以在每个索引位置创建一个双向链表，存储具有相同键的元素。

INSERT 操作将新元素添加到列表中，DELETE 操作直接删除该链表节点，SEARCH 操作返回链表中第一个匹配的元素。显然符合 O(1) 时间复杂度。

> 11.1-4 ?
> Wewish to implement a dictionary by using direct addressing on a huge array. At
> the start, the array entries may contain garbage, and initializing the entire array
> is impractical because of its size. Describe a scheme for implementing a direct
> address dictionary on a huge array. Each stored object should use $O(1)$ space;
> the operations SEARCH, INSERT, and DELETE should take $O(1)$ time each; and
> initializing the data structure should take $O(1)$ time. (Hint: Use an additional array,
> treated somewhat like a stack whose size is the number of keys actually stored in
> the dictionary, to help determine whether a given entry in the huge array is valid or
> not.)

**TLDR: $dense[sparse[key]] = key$**

新建一个栈 $S$，存储实际的键值对，在大数组 $T$ 上按照直接寻址法存储指向 $S$ 的对应索引的指针。初始时，栈 $S$ 为空，大数组 $T$ 不需要处理。

通过检查 $S$ 所存的键是否与 $T$ 上的索引匹配来判断 $T$ 上的索引是否有效。（或者简单点，不在 $S$ 中存键只存值，直接以指针有效与否来判断，但脏数据可能意外与有效的指针碰撞）

- INSERT 操作将键值对添加到栈顶，然后在大数组 $T$ 上存储指向该键值对的指针。

- DELETE 操作将栈顶元素与要删除的元素交换，然后弹出栈顶元素，并在大数组 $T$ 上将待删除索引置空，将交换后的元素的索引更新为新的位置。

- SEARCH 操作直接访问大数组 $T$ 上的对应索引，如果指针有效则返回对应的键值对。

> 我没想出来，尽管我在 [Double-Array Trie](/2026/01/18/CS61B-Note-Collection/#double-array-trie) 中已经见过类似的 “check” 机制...

这种东西似乎叫做 Sparse Set，稀疏集合。

除了 INSERT、DELETE 和 SEARCH 操作之外，实际上还有个隐含的操作是初始化。虽然一般而言，分配到的总是会已经清空的内存块，但在编译器优化方面非常有用，例如寄存器分配等。

见 <https://www.geeksforgeeks.org/dsa/sparse-set/> <https://research.swtch.com/sparse>

## Hash Table

显然直接寻址法的空间复杂度对于全域 $U = \{0, 1, ..., m-1\}$ 来说是 $O(M)$。

显然压缩的方法是将多个键映射到同一个索引位置，也就是散列函数 $h: U \to \{0, 1, ..., m-1\}$，其中 $m \ll |U|$。

那么显然会有冲突（Collision），也就是不同的键被映射到同一个索引位置。

除了如何使得散列函数分布均匀之外，接下来的问题就剩下如何处理冲突了。下面会提供两种常见的处理冲突的方法：链地址法（Separate Chaining）和开放地址法（Open Addressing）。

### Collision resolution by chaining

顾名思义，就是在每个索引位置创建一个链表，存储所有被映射到该位置的键值对。

> 以下 $n$ 为链表长度

- INSERT 操作将新元素添加到链表中，时间复杂度为 $O(1)$。

- SEARCH 操作需要遍历链表，最坏情况下时间复杂度为 $O(n)$。

- DELETE 操作：

- - 已知元素指针：

- - - 若双向链表，则直接删除，时间复杂度为 $O(1)$。

- - - 若单向链表，则需要遍历链表找到前驱节点，时间复杂度为 $O(n)$。

- - 已知元素键，必须先进行 SEARCH 操作找到元素指针，然后再按已知元素指针的方式删除，时间复杂度为 $O(n)$。

下面进行具体分析：

> 以下 $n$ 为散列表 $T$ 的总元素数量，$m$ 为槽位的数量。

假设描述链的平均长度——散列表 $T$ 的装载因子 $\alpha = \frac{n}{m}$，其中 $n$ 是存储的元素数量，$m$ 是散列表的大小。

若所有键存储在一个槽位（Solt）中，则装载因子 $\alpha = n, (0 \leq \alpha \leq 1)$，时间复杂度为 $O(n)$。

假设散列函数 $h$ 将每个键均匀地随机分布在 $m$ 个槽位中，称为简单均匀散列（Simple Uniform Hashing）。

那么，对于 $j = 0, 1, ..., m-1$，槽位 $T[j]$ 中的元素数量 $n_j$ 的期望值为 $E[n_j] = \frac{n}{m} = \alpha$。

假设计算散列函数 $h(k)$ 的时间复杂度为 $O(1)$，那么：

1. 在简单均匀散列的假设下，对于链表法，一次**不成功** SEARCH 操作的期望时间复杂度为 $O(1 + \alpha)$。

由于任意键均匀分布在任意槽位上，而任意槽位的链表长度为 $\alpha$，而遍历完链表才能确定不成功，所以包括计算散列函数的时间复杂度在内，时间复杂度为 $O(1 + \alpha)$。

2. 在简单均匀散列的假设下，对于链表法，一次**成功** SEARCH 操作的期望时间复杂度为 $O(1 + \alpha)$。

设 $x_i$ 是第 $i$ 个被插入的元素，$i = 1, 2, ..., n$，设 $k_i = x_i.key$ 是元素 $x_i$ 的键，定义 $ X_ij = I\{h(k_i) = h(k_j)\}$，在简单均匀散列的假设下，两个元素冲突的期望值为 $E[X_ij] = P\{h(k_i) = h(k_j)\} = \frac{1}{m}$。

由于比 $x_i$ 早插入的元素不可能在 $x_i$ 的查找路径上，只有比 $x_i$ 后插入的才可能在查找路径上（因为链表是头插法），但不一定会在查找路径上，只有当 $x_i$ 和 $x_j$ 冲突时才会在查找路径上，所以：

$$ \sum_{j=i+1}^n E[X_ij] = \sum_{j=i+1}^n P\{h(k_i) = h(k_j)\} = \sum_{j=i+1}^n \frac{1}{m} = \frac{n - i}{m} $$

那么所有元素的期望查找长度为：

$$
\begin{equation}
\begin{aligned}
E &= \frac{1}{n} \sum_{i=1}^n (1 + \sum_{j=i+1}^n E[X_ij]) \\ &= 1 + \frac{1}{nm} \sum_{i=1}^n (n - i) \\ &= 1 + \frac{1}{nm} ( \sum_{i=1}^n n - \sum_{i=1}^n i ) \\ &= 1 + \frac{1}{nm} ( n^2 - \frac{n(n+1)}{2} ) \\ &= 1 + \frac{n-1}{2m} \\ &= 1 + \frac{\alpha}{2}  - \frac{\alpha}{2n} 
\end{aligned}
\end{equation}
$$

所以一次成功 SEARCH 操作的期望时间复杂度为 $O(1 + \frac{\alpha}{2}  - \frac{\alpha}{2n}) = O(1 + \alpha)$。

若散列表的槽数至少与元素数量成正比，也就是动态调整散列表大小以保持装载因子 $\alpha$ 在一个常数范围内，那么 $\alpha = \frac{n}{m} = \frac{O(m)}{m} = O(1)$，使得采用双向链表的情况下，三种操作的平均时间复杂度为 $O(1)$。

---

> 11.2-1
> Suppose we use a hash function h to hash n distinct keys into an array T of
> length m. Assuming simple uniform hashing, what is the expected number of
> collisions? More precisely, what is the expected cardinality of $\{\{k, l\}: k \neq l, h(k) = h(l)\}$?

上文提到 $E[X_ij] = P\{h(k_i) = h(k_j)\} = \frac{1}{m}$，所以：

$$ E = \sum_{i=1}^n \sum_{j=i+1}^n E[X_ij] = \sum_{i=1}^n \sum_{j=i+1}^n P\{h(k_i) = h(k_j)\} = \sum_{i=1}^n \sum_{j=i+1}^n \frac{1}{m} = \frac{n(n-1)}{2m} $$

> 11.2-2
> Demonstrate what happens when we insert the keys 5,28,19,15,20,33,12,17,10
> into a hash table with collisions resolved by chaining. Let the table have 9 slots,
> and let the hash function be $h(k) = k \bmod 9$.

$h(k) = k \bmod 9$ 的结果是：

- $h(5) = 5$

- $h(28) = 1$

- $h(19) = 1$

- $h(15) = 6$

- $h(20) = 2$

- $h(33) = 6$

- $h(12) = 3$

- $h(17) = 8$

- $h(10) = 1$

所以槽位上应该是:

- 0: `null`

- 1: `10` -> `19` -> `28`

- 2: `20`

- 3: `12`

- 4: `null`

- 5: `null`

- 6: `33` -> `15`

- 7: `null`

- 8: `17`

> 11.2-3
> Professor Marley hypothesizes that he can obtain substantial performance gains by
> modifying the chaining scheme to keep each list in sorted order. How does the pro
> fessor’s modification affect the running time for successful searches, unsuccessful
> searches, insertions, and deletions?

- 成功搜索没有区别（链表不能二分），是 $\Theta(1 + \alpha)$

- 失败搜索更快（当已搜索值大于/小于可以直接判断失败），但应该依旧是 $\Theta(1 + \alpha)$

- 插入更慢，是 $\Theta(1 + \alpha)$（需要找到插入点）

- 删除和之前相同

> 11.2-4
> Suggest how to allocate and deallocate storage for elements within the hash table
> itself by linking all unused slots into a free list. Assume that one slot can store
> a flag and either one element plus a pointer or two pointers. All dictionary and
> free-list operations should run in $O(1)$ expected time. Does the free list need to be
> doubly linked, or does a singly linked free list suffice?

> 注意 *one slot can store a flag **and** **either** one element plus a pointer **or** two pointers* 指的是一个槽位可以存一个标志位和 **“一个元素+一个指针”** 或者 **“两个指针”**

既然需要自由链表操作为 $O(1)$，那么绕不开 DELETE 需要双向链表，也就是作为自由槽位的时候，将 flag 设置为 0，必须有两个指针指向前驱和后驱节点。

但是当其存储元素，作为冲突链，不作为自由槽位的时候，需要有指向下一个元素的指针。插入时应该从自由链表弹出一个节点，头插到冲突链；删除时如果拿到的是元素（冲突链节点）的指针，没法获得前驱节点，只能作为单链表在 $O(1 + \alpha)$ 删除。

但注意 *allocate and deallocate storage for elements within the hash table itself* 和 *$O(1)$ expected time*

意思是 $n \le m$，那么 $\alpha = \frac{n}{m} \le 1$，确实 $O(1 + \alpha) = O(1)$。

> 这么细...？

---

> 11.2-5
> Suppose that we are storing a set of $n$ keys into a hash table of size $m$. Show that if
> the keys are drawn from a universe $U$ with $|U| \gt nm$,then $U$ hasasubset of size n
> consisting of keys that all hash to the same slot, so that the worst-case searching
> time for hashing with chaining is $\Theta(n)$.

设 $U_j = \{x∈U∣h(x)=j\}$，那么 $ \sum_{j=1}^{m} U_j = |U| \gt nm$

那么 $E(|U_j|) = \frac{\sum_{j=1}^{m} U_j}{m} \gt n$，显然存在 $|U_j| \gt n$

所以确实存在大小为 $n$ 的子集，全部映射到同一个槽。

> 11.2-6
> Suppose wehave stored $n$ keys in ahash table of size $m$, with collisions resolved by
> chaining, and that we know the length of each chain, including the length $L$ of the
> longest chain. Describe a procedure that selects a key uniformly at random from
> among the keys in the hash table and returns it in expected time $O(L \cdot (1 + \frac{1}{\alpha}))$.

查到是类似蒙特卡洛拒绝采样，IGNORED

## Hash functions

> A good hash function satisfies (approximately) the assumption of simple uniform
> hashing: each key is equally likely to hash to any of the m slots, independently of
> where any other key has hashed to. 

> 一个好的哈希函数应（尽可能）满足简单均匀散列假设：每个键等可能映射到任意槽位，且与其他键映射到哪个槽位无关

哈希表的性能主要取决于**冲突的分布情况**。在满足简单均匀散列假设的前提下，对于任意大小为 $n$ 的键子集，哈希值在槽位间均匀分布，保证**期望搜索时间**为 $O(1)$。

然而在实际应用中，输入键往往并非从全域中均匀随机选取，而是可能包含特定模式或高度相似的数据。这意味着哈希函数的设计必须在输入键非常相似或存在规律时，也能将其映射为截然不同的哈希值。

### Interpreting keys as natural numbers

数组索引只能是自然数，但键可能是字符串，需要将其转为自然数。可以用 ASCII 或者 UTF-8 等。

### The division method

简而言之就是 $h(k) = k \mod m$。

重点在于如何选取 $m$。书中提到 $m = 2^p$ 时，$h(k)$ 实际上就是 $k$ 的二进制表示的低 $k$ 位数字；$m = 2^p - 1$ 时，如果字符串是以 $2^p$ 为基数来编码字符，$h(k)$ 就是取所有字符编码的和再模 $m$。（详情见 11.3-3）

### The multiplication method

简而言之是 $h(k) = \lfloor m (k A \mod 1) \rfloor$，其中 $k A \mod 1$ 指的是取 $kA$ 的小数部分。

书中的内容是用位运算代替浮点数计算。首先要求 $m = 2^p$，设字长为 $w$，限制 $A = \frac{s}{2^w}, 0 \lt s \lt 2^w$，$k \cdot s$ 得到 $r_1 2^w + r_0$，两个长度为 $w$ 的整数相乘结果长度为 $2w$，其中 $r_1$ 是乘积的高位字，$r_0 是乘积的低位字，最后取 $r_0$ 的最高 $p$ 位。

~~虽然我不知道为什么~~，书中提到推荐 $A \approx (\sqrt 5 - 1) / 2 = 0.618 \dots$。

### Universal Hashing

以上两种方法都可以针对性的进行碰撞，如果知道 $m$ 或者 $A$ 和 $m$，因为它们是确定性散列函数。

> 这里的 $m$ 为哈希表大小

定义有限散列函数组 $\mathcal{H}$，能将键映射到 $\{0, 1, 2, 3 \dots, m - 1 \}$，且对于不同的键 $k, l \in U$，满足 $h(k) = h(l)$ 的散列函数不超过 $| \mathcal{H} | / m$，也就是任选散列函数，发生 $h(k) = h(l)$ 的概率不超过 $1 / m$。

$n_i$ 表示链表 $T[i]$ 的长度。

定理：如果 $h$ 选自 $ \mathcal{H} $，将 $n$ 个键散列到大小为 $m$ 的表 $T$ 中，用链接法处理冲突。如果 $k$ 不在表中，则 $k$ 被散列到的链表期望长度 $E[n_{h(k)}]$ 至多为 $\alpha = n / m$。如果 $k$ 在表中，则包含 $k$ 的链表的期望长度 $E[n_{h(k)}]$ 至多为 $1 + \alpha$

> 指示器随机变量指的是符合条件则为 1，否则为 0

证明：对于不同的键 $k$ 和 $l$，定义指示器随机变量 $X_kl = I\{ h(k) = h(l)\}$。由于上文关于全域散列函数的定义有一对键发生冲突的概率至多为 $1 / m$，有 $Pr \{ h(k) = h(l)\} \le 1 / m$，所以 $E[X_kl] \le 1/m$。

定义 $Y_k$ 为与键 $k$ 在相同槽位的其他键的数量。

那么 $Y_k = \sum_{l \in T, l \ne k} X_kl$

可得 $$E[Y_k] = E[ \sum_{l \in T, l \ne k} X_kl ] = \sum_{l \in T, l \ne k} E[X_kl] \le \sum_{l \in T, l \ne k} \frac{1}{m}$$

> 注意 $n$ 是总键数，$n_i$ 才是链表 $T[i]$ 的长度

显然符合 $l \in T, l \ne k$ 的 $l$ 的个数应该为 $n$（$n$ 不在 $T$）或者 $n - 1$（$n$ 已经在 $T$ 中）

按 $k$ 是否已经在表中来讨论：

- 如果 $k \notin T$，那么 $n_{h(k)} = Y_k$，并且 $| \{l \in T, l \ne k\}| = n$，于是 $E[n_{h(k)}] = E[Y_k] \le n / m = \alpha$

- 如果 $k \in T$，那么 $n_{h(k)} = Y_k + 1$，因为 $Y_k$ 的条件是 $l \ne k$ 不包括 $n$，于是 $E[n_{h(k)}] = E[Y_k] + 1 \le (n - 1)/m +1 = 1 + (\alpha-1) / m \lt \alpha +1$

综上所述可以得出，在利用有限散列函数组 $\mathcal{H}$ 时，对于恶意选中的子集，映射到哈希表上，依旧可以保证链表期望长度不会达到最坏运行时 $O(n)$。

> 之前的两种方法要求选中的子集是随机的，全域散列不需要

---

> 推论 11.4 对于一个具有 $m$ 个槽位且初始时为空的表，利用全域散列法和链接法解决冲突，需要 $\Theta(n)$ 的期望时间来处理任何包含了 $n$ 个 INSERT、SEARCH 和 DELETE 的操作序列，其中该序列包含了 $O(m)$ 个 INSERT 操作。

首先有 $O(m)$ 个 INSERT 操作说明 $n = O(m)$，所以有负载因子 $\alpha = O(1)$。INSERT 和 DELETE 操作都需要 $O(1)$ 时间。根据上面的证明，SEARCH 的期望时间复杂度为 $O(\alpha + 1)$，代入 $\alpha$，所以加起来为 $\Theta(n)$ 的期望时间。

#### Designing a universal class of hash functions

> 模运算：已知 $x \equiv y \pmod p$，有
>
> 线性运算性质：
> - $x \pm c \equiv y \pm c \pmod p$
> - $xz \equiv yz \pmod p$
>
> 分配律：
> - $(a + b) \bmod p = ((a \bmod p) + (b \bmod p)) \bmod p$
> - $(a \times b) \bmod p = ((a \bmod p) \times (b \bmod p)) \bmod p$

设素数 $p \gt m$ 使得 $k$ 落在 $\{0, 1, 2, \dots, p - 1\}$，设 $Z_p = \{0, 1, 2, \dots, p - 1\}$，$Z_p^{*} = \{1, 2, \dots, p - 1\}$

对于 $a \in Z_p$ 和 $b \in Z_p^{*}$，定义散列函数

$$h_{ab} = ((ak + b) \mod p) \mod m$$

所有这样的散列函数组成函数簇为

$$\mathcal{H} = \{h_{ab} : a \in Z_p, b \in Z_p^{*}\}$$

那么 $\mathcal{H}$ 包含 $p(p - 1)$ 个散列函数。

---

下面开始证明这个函数簇是全域的：

考虑 $Z_p$ 中的任意两个不同的元素 $k$ 和 $l$，对于给定的 $h_{ab}$，设

$$r = (ak + b) \mod p$$

$$s = (al + b) \mod p$$

那么

$$r - s \equiv a(k - l) \pmod p$$

> 因为对于 $c = a \mod p$ 和 $d = b \mod p$，有 $c - d \equiv (a - b) \pmod p$

由于 $p$ 是素数，且 $a$ 和 $k - l$ 模 $p$ 都不为 0（因为 $a$ 和 $k - l$ 都小于 $p$），所以根据定理 31.6，$a(k - l) \mod p$ 也不为 0，所以 $r \ne s$。

> 如果 $p$ 是素数，且 $a$ 不是 $p$ 的倍数，$b$ 也不是 $p$ 的倍数，那么它们的乘积 $ab$ 也一定不是 $p$ 的倍数。

由 $r \ne s$，可知 $k$ 和 $l$ 不可能被 $h_{ab}$ 映射到同一个槽位上，所以 $h_{ab}(k) \ne h_{ab}(l)$。

---

那么，接下来需要证明 $(a, b)$ 和 $(r,s)$ 双射。

由于

$$a = ((r-s) ((k-l)^{-1} \mod p)) \mod p $$

$$b = (r -ak) \mod p$$

其中 $((k-l)^{-1} \mod p)$ 是 $k-l$ 关于模 $p$ 的乘法逆元，存在且唯一。

> 由于 $0 < |k - l| < p$ 且 且 $p$ 是素数，那么 $(k - l)$ 和 $p$ 互素
> 而一个数 $x$ 在模 $p$ 下存在模逆元（Modular Multiplicative Inverse），当且仅当 $x$ 与 $p$ 互素。

所以根据 $(r,s)$ 可以解出唯一的 $(a,b)$，$(r,s)$ 和 $(a,b)$ 单射。

根据全域哈希的定义，数对 $(a, b)$ 共 $p(p-1)$ 种可能，而 $(r,s)$ 也只有 $p(p-1)$ 种可能，所以 $(a,b)$ 和 $(r,s)$ 双射。

> 单射+满射=双射。如果两个有限集的大小相等，那么一个从 A 到 B 的单射映射必然也是满射，反之亦然。

---

由于 $(a,b)$ 是从 $Z_p \times Z_p^{*}$ 中均匀随机选择的，而 $(a,b)$ 与 $(r,s)$ 一一对应，所以产生的 $(r,s)$ 的也是均匀随机分布的。

所以两个不同的键 $k$ 和 $l$ 发生碰撞的概率为 $Pr\{h_{ab}(k) = h_{ab}(l)\} = Pr\{r \equiv s \pmod m\}$。

---

固定 $r$，对于 $s$ 来说，满足 $s \equiv r \pmod m$ 的 $s$ 的数量为 $\lceil p / m \rceil$，排除 $r = s$ 的情况有 $\lceil p / m \rceil - 1$ 个满足 $s \equiv r \pmod m$ 的 $s$。

根据书上的缩放不等式 $\lceil n / m \rceil \le (n + m - 1) / m$，有 $\lceil p / m \rceil - 1 \le (p + m - 1) / m - 1 = (p - 1) / m$。

所以对于不同 $k$ 和 $l$ 冲突的概率为 $Pr\{h_{ab}(k) = h_{ab}(l)\} = Pr\{r \equiv s \pmod m\} \le \frac{\lceil p / m \rceil - 1}{p - 1} \le \frac{(p - 1) / m}{p - 1} = \frac{1}{m}$。

回到定义可见，$\mathcal{H}$ 是一个全域散列函数簇。

## Open addressing

现在的目标是将所有元素存储在哈希表中，而不是外部空间。

11.2-4 确实做到了，将链表存储在哈希表中，但是指针消耗了大量的空间。

而开放寻址法直接计算索引而不是通过指针来访问元素。

扩展散列函数，使其支持 $h: U \times \{0, 1, 2, \dots\} \to \{0, 1, 2, \dots, m - 1\}$，其中 $h(k, i)$ 是键 $k$ 的第 $i$ 个探测位置。

可以得到探测序列 $<h(k, 0), h(k, 1), h(k, 2), \dots, h(k, i)>$

开放寻址法的实现大致如下：

- INSERT 操作：沿着探测序列直到找到一个空槽位，将元素插入。如果 $i \ge m$，说明已经探测了整个表，无法插入。

- SEARCH 操作：沿着探测序列直到找到一个空槽位或者找到键 $k$。如果找到空槽位，说明键 $k$ 不在表中；如果找到键 $k$，则返回对应的值。

- DELETE 操作：沿着探测序列直到找到一个空槽位或者找到键 $k$。

- - 如果找到空槽位，说明键 $k$ 不在表中；

- - 如果找到键 $k$，则将该槽位标记为**DELETED**（而不是直接清空，后续的 SEARCH 操作无法正确地继续探测。）

由于增加了已删除的标记，开放寻址法的查找时间不再依赖 $\alpha$，实践上可能会出现探测序列过长的情况，或改回链表法，或者增加压缩的步骤（例如当 DELETED 数量过多时，重新哈希）。

---

正如前面散列函数有简单均匀散列假设，$h(k,i)$ 也有均匀散列假设（Uniform Hashing），即对于每个键 $k$，探测序列 $<h(k, 0), h(k, 1), h(k, 2), \dots>$ 是 $m$ 个槽位的一个随机排列。

均匀散列应该产生 $m!$ 个不同的探测序列，每个序列的概率为 $1/m!$。

有三种常见的开放寻址法：

- 线性探测（Linear Probing）：$h(k, i) = (h'(k) + i) \mod m$

- 二次探测（Quadratic Probing）：$h(k, i) = (h'(k) + c_1 i + c_2 i^2) \mod m$，其中 $c_1$ 和 $c_2$ 是常数。

- 双重散列（Double Hashing）：$h(k, i) = (h_1(k) + i \cdot h_2(k)) \mod m$，其中 $h_1$ 和 $h_2$ 是两个不同的散列函数。

#### Linear Probing

给定 $h':U -> \{ 0, 1, \dots, m-1 \}$ 为辅助函数，有

$$ h(k,i) = (h'(k) + i) \mod m$$

由于 $h'(k)$ 是固定的，从 $T[h'(k)]$ 、$T[h'(k) + 1]$ 往下到 $T[m - 1]$ 又到 $T[0]$、$T[1]$ 最后回到 $T[h'(k)]$，一开始序列就是决定好的，所以只有 $m$ 种不同的序列。

探测方法的优化目标，直白来说是尽可能少的探测次数就找到空白位置，但线性探测很容易出现**一次聚集**，既然当前位置被占了就会向后挨个探查，那么如果当空白位置前面有 $i$ 个连续被占用则被自身占用的概率就是 $(i+1) / m$。随着连续序列越来越长，平均查找时间就会越来越长。

#### Quadratic Probing

二次探查是

$$h(k,i) = (h'(k) + c_1 i + c_2 i^2) \mod m$$

相比线性探查只要探测到聚集区内就会继续聚集，二次探查得益于 $c_2 i^2$ 只有在 $h'(k)$ 相同的时候才会出现二次群集。

当然，二次探查也只有 $m$ 种序列，因为

$$
\begin{equation}
\begin{aligned}
h(k,i) &= (h'(k) + c_1 i + c_2 i^2) \mod m \\ &= ((h'(k) \mod m) + c_1 i + c_2 i^2) \mod m
\end{aligned}
\end{equation}
$$

#### Double Hashing

双重哈希采用

$$ h(k,i) = (h_1(k) + i h_2(k)) \mod m$$

与前两者不同，偏移量也根据 $k$ 变化，但 $h_2(k)$ 必须和 $m$ 互素，否则偏移量为 0 没法向前探测。

可以将 $m$ 设为 2 的幂，并使得 $h_2(k)$ 总是奇数；

或者 $m$ 是素数，$m'$ 略小于 $m$，比如 $m' = m - 1$，取

$$ h_1(k) = k \mod m $$

$$ h_2(k) = 1 + (k \mod (m - 1)) $$

双重哈希的探测序列数量为 $\Theta(m^2)$，因为 $h_1(k)$ 有 $m$ 种可能，$h_2(k)$ 有 $m-1$ 种可能，每对 $(h_1(k), h_2(k))$ 产生一个探测序列。

例如取 $k = 123456, m = 701, m' = 700$，则有 $h_1(k) = 80$，$h_2(k) == 257$，第一个探测位置是 $h(k, 0) = 80$，每次探测推进 257 个槽位。

---

同样分析开放寻址法的探查期望时间复杂度：

定理：给定 $\alpha = n / m$，假设是均匀散列的，则一次不成功的查找，期望的探查次数至多为 $1/ (1-a)$

设 $X$ 为一次不成功查找的探查次数，再定义事件 $A_i$ 表示第 $i$ 个探查到已占有。

那么 $\{ X\ \gt i\} = A_1 \cap  A_2 \cap  \cdots \cap  A_i$

计算

$$
\begin{aligned}
\Pr\{A_1 \cap A_2 \cap \dots \cap A_{i-1}\} &= \Pr\{A_1\} \cdot \Pr\{A_2 \mid A_1\} \cdot \Pr\{A_3 \mid A_1 \cap A_2\} \cdots \\
&\quad \cdot \Pr\{A_{i-1} \mid A_1 \cap \dots \cap A_{i-2}\}
\end{aligned}
$$

由于有 $m$ 个槽和 $n$ 个元素，对于 $j> 1$，在前 $j-1$ 次探查到的都是已占用槽的前提下，第 $j$ 次探测到依旧占用的概率是 $ \Pr\{A_j\} = (n - j + 1) / (m - j + 1) $（有 $(m - (j-1))$ 个槽未探查，有 $n-(j-1)$ 个元素未被探查到）

又因为 $(n-j)/(m-j) \le n/m = \alpha$ （糖水不等式）

所以 $\Pr\{A_1 \cap A_2 \cap \dots \cap A_{i-1}\} \le \alpha^{i-1}$

然后求

$$
\begin{aligned}
E[X] = \sum_{i=1}^{\infty} \Pr\{X \ge i\} = \sum_{i=1}^{\infty} \Pr\{A_1 \cap A_2 \cap \dots \cap A_{i-1}\} \le \sum_{i=1}^{\infty} \alpha^{i-1} = \frac{1}{1-\alpha}
\end{aligned}
$$

> $\sum_{i=1}^{\infty} \alpha^{i-1}$ 是一个等比数列，公比为 $\alpha$，首项为 $1$，当 $|\alpha| < 1$ 时，级数收敛于 $\frac{1}{1-\alpha}$。

那么，期望的探查次数是 $O(1)$；当 $\alpha \to 1$ 时，期望的探查次数趋近于无穷大。（这和上文 DELETED 占用过多对应）

---

既然 INSERT 操作要先确认没有在表中，那么插入一个元素的最坏探查次数就是 $1 / (1-\alpha)$。

---

查找和插入的探查序列是相同的，那么如果 $k$ 是第 $i+1$ 被插入的键，那么对 $k$ 的一次成功查找的期望探查次数至多为 $1 / (1-i/m)$（前面已经插入了 $i$ 个元素，$\alpha = i / m$）。

对所有 $n$ 个键取平均，得到一次成功查找的期望探查次数至多为

$$
\begin{aligned}
\frac{1}{n} \sum_{i=0}^{n-1} \frac{1}{1 - i/m}

&= \frac{m}{n} \sum_{i=0}^{n-1} \frac{1}{m - i} \\

&= \frac{1}{\alpha} \sum_{k=m-n+1}^{m} \frac{1}{k} \\

&\le \frac{1}{\alpha} \int_{m-n}^{m} \frac{1}{x} dx \\

&= \frac{1}{\alpha} \ln \frac{m}{m-n} \\

&= \frac{1}{\alpha} \ln \frac{1}{1-\alpha}

\end{aligned}
$$

> $\frac{m}{n} \sum_{i=0}^{n-1} \frac{1}{m - i} = \frac{1}{\alpha} \sum_{k=m-n+1}^{m} \frac{1}{k}$
> 
> 这是设 $k = m - i$，然后换元，然后求和次序反转。

如果 $\alpha = 0.5$，则期望数为 $1.387$。

如果 $\alpha = 0.9$，则期望数为 $2.559$。

显然扩容很重要，维持 $\alpha$ 在合理区间内，在空间和时间上取得平衡，见 [CS61B Hash Table](/2026/01/18/CS61B-Note-Collection/#hashtable)。

## Perfect hashing

大致为，对于固定的的键集合 $K$，$|K| = n$，先将其散列到长度为 $n$ 的表中，可能发生碰撞。然后在碰撞的槽位上，再使用一个长度为 $n_i^2$ 的表来存储冲突的元素，其中 $n_i$ 是第 $i$ 个槽位上发生碰撞的元素数量。对于每个槽位，从散列簇中随机选择一个散列函数，直到没有碰撞为止。

可以证明尝试几次就能找到合适的函数。

证明 IGNORED

查到还有 Minimal Perfect Hashing，可以空间做到 100% 利用率，多用于编译器。