---
title: CLRS Disjoint Set
sticky: false
mermaid: false
date: 2026-04-20 21:28:39
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

这里记录 CLRS 中的 Disjoint Set（并查集）笔记。

<!-- more -->

我想并查集的名字来源于它的 `union` 和 `find` 操作，即合并和查找。

## 基础实现

以下实现并没有用链表而是用的数组。

> TLDR;
>
> 数组中的索引表示元素，数组中的值为 `-1` 时表示该元素未被添加，为非负数且不等于自身索引时指向父节点的索引，如果等于自身索引则已为根节点。

索引 `i` 的值情况：
- `-1`：未被添加
- `i`：根节点
- 其他：指向父节点的索引

> 以下实现中，`connect` 对应 CLRS 中的 `union`。（因为 `union` 是保留字）

- `make_set(i)`：将索引 `i` 的值设置为 `i`（新建独立集合，只有一个元素 `i`）
- `find_set(i)`：递归/循环查找索引 `i` 的父节点直到根节点
- `connect(a, b)`：`a` 和 `b` 分别两次 `find_set` ，将其中一个集合的根节点的值修改为另一个集合的根节点的（若相同自然不用修改）
- `isconnected(a, b)`：同理，`a` 和 `b` 分别两次 `find_set` 然后比较根节点是否相同

```cpp
class NaiveDisjointSet
{
    vector<int> data;

public:
    NaiveDisjointSet(int n) : data(n, -1) {}
    void make_set(int i) { data[i] = i; }
    int find_set(int i)
    {
        while (i != data[i])
            i = data[i];
        return i;
    }
    void connect(int a, int b)
    {
        int rootA = find_set(a);
        int rootB = find_set(b);
        if (rootA != rootB)
            data[rootB] = rootA;
    }
    bool isconnected(int a, int b)
    {
        return find_set(a) == find_set(b);
    }
};
```

## 按秩合并

树的高度决定每次 `find_set` 的耗时，`connect` 时当前总是 `data[rootB] = rootA;`，这样容易产生单链。可以通过记录树的高度（或秩）来优化 `connect`，每次将较矮的树连接到较高的树上，这样可以保证树的高度不会过大。

书上有 Union by Rank，这里的 Rank 指的是高度的上界，并不是精确值。（因为接下来的路径压缩不会实时更新 Rank，而路径压缩当然越压高度越低）

按照按秩合并，只有当两棵树的高度相同时，新的树的高度才会 +1，以及每次高度增加时，树中的节点都会翻倍。

考虑最坏情况，构造一棵包含所有元素的树，每次 `connect` 都是两颗高度相同的树，其高度最高会为 $log N$。

> $h = 1, n$ -> $h = 2, n/2$ -> $h = 3, n/4$ -> ... -> $h = log N, n/2^{log N} = 1$

$h_1 = h_2 = 2$ 合并之后，看起来是

```
  2   3
 / \ / \    
4  5 6  7
```

变成

```
    2
  / | \
 4  5  3
      / \
     6   7
```

## 路径压缩

`find_set` 的过程会访问路径上的所有节点，而最后会找到根节点，显然将路径上的节点都重新连接到根节点可以大幅提高效率。

可以用递归/循环实现，但无论如何都得存储路径上的节点，或者干脆遍历两次。

```cpp
int root = i;
while (root != data[root])
{
    root = data[root];
}

while (i != root)
{
    int next_node = data[i];
    data[i] = root;
    i = next_node;
}
```

## 优化实现

这是增加路径压缩和按秩合并的优化版本。

```cpp
class OptimizedDisjointSet
{
    vector<int> data;
    vector<int> rank;

public:
    OptimizedDisjointSet(int n) : data(n, -1), rank(n, 0) {}

    void make_set(int i)
    {
        if (i >= 0 && i < data.size())
            data[i] = i;
    }

    int find_set(int i)
    {
        if (i < 0 || i >= data.size() || data[i] == -1)
            throw "Error";

        int root = i;
        while (root != data[root])
        {
            root = data[root];
        }

        while (i != root)
        {
            int next_node = data[i];
            data[i] = root;
            i = next_node;
        }

        return root;
    }

    bool isconnected(int a, int b)
    {
        return find_set(a) == find_set(b);
    }

    void connect(int a, int b)
    {
        int rootA = find_set(a);
        int rootB = find_set(b);
        if (rootA != rootB)
        {
            if (rank[rootA] > rank[rootB])
            {
                data[rootB] = rootA;
            }
            else if (rank[rootA] < rank[rootB])
            {
                data[rootA] = rootB;
            }
            else
            {
                data[rootB] = rootA;
                rank[rootA]++;
            }
        }
    }
};
```

下面是测试结果（测试方式是随机 M Ops，其中 50% 是 connect 操作，剩下 50% 是 isconnected 操作）：

| N Size | M Ops | Naive (ms) | Optimized (ms) | Speedup (N/O) |
| :--- | :--- | :--- | :--- | :--- |
| 25 | 10 | 0.01 | 0.00 | 3.45x |
| 25 | 100 | 0.02 | 0.02 | 1.38x |
| 25 | 1000 | 0.35 | 0.35 | 0.98x |
| 25 | 100000 | 53.93 | 25.54 | 2.11x |
| 25 | 1000000 | 519.01 | 248.01 | 2.09x |
| 25 | 10000000 | 3055.43 | 1428.42 | 2.14x |
| 50 | 10 | 0.01 | 0.00 | 4.71x |
| 50 | 100 | 0.02 | 0.01 | 1.36x |
| 50 | 1000 | 0.29 | 0.13 | 2.25x |
| 50 | 100000 | 38.97 | 16.91 | 2.30x |
| 50 | 1000000 | 298.94 | 130.00 | 2.30x |
| 50 | 10000000 | 2924.20 | 1486.23 | 1.97x |
| 100 | 10 | 0.01 | 0.00 | 4.62x |
| 100 | 100 | 0.02 | 0.01 | 1.22x |
| 100 | 1000 | 0.37 | 0.18 | 2.05x |
| 100 | 100000 | 42.15 | 16.31 | 2.59x |
| 100 | 1000000 | 394.65 | 133.20 | 2.96x |
| 100 | 10000000 | 3779.87 | 1387.43 | 2.72x |
| 1000 | 10 | 0.01 | 0.00 | 4.64x |
| 1000 | 100 | 0.01 | 0.01 | 1.34x |
| 1000 | 1000 | 0.11 | 0.12 | 0.86x |
| 1000 | 100000 | 257.74 | 13.18 | 19.55x |
| 1000 | 1000000 | 2590.73 | 117.09 | 22.13x |
| 1000 | 10000000 | 25825.70 | 1550.24 | 16.66x |
| 10000 | 10 | 0.01 | 0.00 | 4.11x |
| 10000 | 100 | 0.01 | 0.02 | 0.75x |
| 10000 | 1000 | 0.10 | 0.17 | 0.56x |
| 10000 | 100000 | 2171.18 | 12.39 | 175.19x |
| 10000 | 1000000 | 25779.93 | 119.90 | 215.01x |
| 10000 | 10000000 | 238020.86 | 1239.94 | 191.96x |
| 100000 | 10 | 0.01 | 0.00 | 5.60x |
| 100000 | 100 | 0.01 | 0.01 | 1.28x |
| 100000 | 1000 | 0.12 | 0.15 | 0.82x |
| 100000 | 100000 | 12.27 | 12.29 | 1.00x |
| 100000 | 1000000 | 226237.31 | 152.59 | 1482.66x |
| 100000 | 10000000 | N/A | N/A | N/A |

> N/A 说明耗时太长，不想跑了...

![disjoint-set-perf](/images/CLRS/disjoint-set-perf.png)

下面分析三个 OP 的时间复杂度：

- `make_set`：$O(1)$
  毫无疑问，`make_set` 只需要将对应索引的值设置为自己的值即可，所以是 O(1)

- `find_set`：$O(log N)$（路径压缩 $O(α(N))$）
    不考虑路径压缩只考虑按秩合并，`find_set` 最坏情况下，从深度最大的节点开始向上查找，树的高度最多是 $log N$，显然上限是 $O(log N)$。

- `connect`：$O(log N)$（路径压缩 $O(α(N))$）
    `connect` 需要两次 `find_set`，所以同理也是 $O(log N)$。

- `isconnected`：$O(log N)$（路径压缩 $O(α(N))$）
    同理也是 $O(log N)$。

对比朴素的实现，`find_set` 的时间复杂度从 $O(N)$ 降到了 $O(log N)$。

不过从测试中可以看出，样本较小时，效果没那么明显，偶尔因为逻辑更多/抖动（没有多次测试...）还有略慢的可能。

> 该测试仅供参考，我测着玩的。

由于 ~~这里的空白太小~~ 证明太多了没看，不写 $O(α(N))$ 是哪来得的...只需要知道 $α(N)$ 增长很慢，视为 $α(N) \le 4$ 即可。

测试代码见 [Disjoint-Set Performance Test](https://gist.github.com/z0z0r4/a2c24a9cbd06cd97a9e3534a61021713)

> ~~毫无疑问测试部分和绘图脚本都是 AI 生成的~~

## 总结

书上讲述的顺序是链表->森林，我觉得本质上是将链表法本来重 `union` 轻 `find_set` 的开销分布，变成了重 `find_set` 轻 `union`，而路径压缩又优化了 `find_set` 的开销，鱼与熊掌兼得了，Crazy。

| 实现 | 启发式策略          | `Find` 单次最坏 | `union` 单次最坏 | `m` 次操作总复杂度 |
|----------|---------------------|------------------|-------------------|---------------------|
| 树形     | 无（朴素）          | $O(n)$           | $O(n)$            | $O(mn)$             |
| 树形     | 按秩/大小合并       | $O(log n)$       | $O(log n)$        | $O(m log n)$        |
| 链表     | 无（朴素）          | $O(1)$           | $O(n)$            | $O(mn)$             |
| 链表     | 加权合并            | $O(1)$           | 均摊 $O(log n)$*  | $O(m + n log n)$    |

> 链表单次 `union` 最坏仍为 $O(n)$，比如 $n/2$ 与 $n/2$ 合并