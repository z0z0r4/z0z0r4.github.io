---
title: CS61B Note Collection
sticky: false
mermaid: false
draft: true
date: 2026-01-18 12:46:04
tags:
- learning-notes
- CS61B
categories:
- learning-notes
- CS
- CS61B
cover: covers/gobang.png
comments:
copyright:
sponsor:
---

> 为什么我写起来感觉像 C++ 呢，可能是没具体写项目吧... ~~印象中 Java 很恶心啊~~


## Project 0 2048

在给出的框架上实现上下左右倾斜的函数，挺简单的，应该是实现了一份 $O(n)$ 的版本。

[官方的逻辑](https://sp25.datastructur.es/projects/proj0/) 好像是分步骤的，先把所有非零元素挤到一边，然后再合并相邻的相同元素，最后再把非零元素挤到一边，逻辑更清晰吧，但我看的是 [Hard Mode Project](https://sp25.datastructur.es/projects/proj0/hardmode)，就没跟着它思路走了。

![2048](/images/cs61b/proj0_2048.png)

## Linked List

### SLList

单链表，只有 `next` 没有 `prev`，所以只能从头结点开始往后遍历，不能反向遍历。

```java
class Node {
    int item;
    Node next;
}
```

### DLList

双链表，既有 `next` 又有 `prev`，可以正向和反向遍历。

```java
class Node {
    int item;
    Node next;
    Node prev;
}
```


### Sentinel Node

我觉得这个设计非常巧妙，学到了。

在链表的首位添加不记录 `value` 也不计入 `size`，对应 `next` 或者 `prev` 为自身的哨兵节点，只占位，为 Head 节点和 Tail 节点提供了一个的前驱和后继节点，同时应该 `next` 或者 `prev` 为自身，可以一直 `->next` 或者 `->prev`，避免边界条件的问题。

然后还能直接设计成回环，又省一个节点，tql

[sentinel-upgrade](https://cs61b-2.gitbook.io/cs61b-textbook-fall-2025/5.-dllists#improvement-8-sentinel-upgrade)

![图片取自 https://joshhug.gitbooks.io/hug61b/content/chap2/fig23/dllist_double_sentinel_size_0.png](https://joshhug.gitbooks.io/hug61b/content/chap2/fig23/dllist_double_sentinel_size_0.png)


![图片取自 https://joshhug.gitbooks.io/hug61b/content/chap2/fig23/dllist_circular_sentinel_size_2.png](/images/cs61b/dllist_circular_sentinel_size_2.png)

## Array

Java 里面的数组和其他的差不多，不再赘述，这里附上 [CS61B 提供的和其他语言的数组的差别](https://cs61b-2.gitbook.io/cs61b-textbook/6.-arrays#appendix-java-arrays-vs-other-languages)

> Compared to arrays in other languages, Java arrays:
> 对比其他语言的数组，Java 数组：
> 
> Have no special syntax for "slicing" (such as in Python).
> 没有切片的特殊语法（比如 Python）。
> 
> Cannot be shrunk or expanded (such as in Ruby).
> 没有缩小或扩展的能力（比如 Ruby）。
> 
> Do not have member methods (such as in Javascript).
> 没有成员方法（比如 Javascript）。
> Must contain values only of the same type (unlike Python).
> 只能包含相同类型的值（不像 Python）。

## ArrayList

Linked List 的缺点是访问元素需要从头结点开始遍历，时间复杂度是 O(n)，而 Array 可以通过索引直接访问，时间复杂度是 O(1)。

但 Linked List 可以随意扩容，而 Array 一旦创建就不能变更大小。

因此封装一个 ArrayList 类，内部使用 Array 来存储元素，当 Array 满了之后，创建一个更大的 Array，把原来的元素 copy 过去；当 Array 内元素被删除了很多之后，创建一个更小的 Array，把原来的元素 copy 过去。

逻辑非常简单，只是需要考虑合适的扩容和缩容的时机，避免频繁的扩容和缩容导致性能问题。

---

顺便参考了下常见语言的实现：

Go 的 `slice` 扩容会在小容量（小于 256）下翻倍，大容量下平滑增加 25%。但并不会缩容。

$newcap = oldcap + (oldcap + 768) / 2$

参考自 [runtime/slice.go](https://go.dev/src/runtime/slice.go)

<details>
<summary><code>nextslicecap</code> 源码</summary>
```go
// nextslicecap computes the next appropriate slice length.
func nextslicecap(newLen, oldCap int) int {
	newcap := oldCap
	doublecap := newcap + newcap
	if newLen > doublecap {
		return newLen
	}

	const threshold = 256
	if oldCap < threshold {
		return doublecap
	}
	for {
		// Transition from growing 2x for small slices
		// to growing 1.25x for large slices. This formula
		// gives a smooth-ish transition between the two.
		newcap += (newcap + 3*threshold) >> 2

		// We need to check `newcap >= newLen` and whether `newcap` overflowed.
		// newLen is guaranteed to be larger than zero, hence
		// when newcap overflows then `uint(newcap) > uint(newLen)`.
		// This allows to check for both with the same comparison.
		if uint(newcap) >= uint(newLen) {
			break
		}
	}

	// Set newcap to the requested cap when
	// the newcap calculation overflowed.
	if newcap <= 0 {
		return newLen
	}
	return newcap
}
```
</details>

---

Python 的 `list` 也有一套扩容缩容机制，参考 [listobject.c](https://github.com/python/cpython/blob/main/Objects/listobject.c#L94-L139)

- 当 `newsize` 小于 `allocated` 且 `newsize` 大于等于 `allocated / 2` 时，直接修改 `ob_size`，不进行扩容或缩容。（避免频繁缩容）

- 当 `newsize` 大于 `allocated` 时，按照 `newsize + newsize / 8 + 6` 的方式计算新的 `allocated`，并且对齐到 4 的倍数。（大约每次扩容 x1.125，长度为 1 的列表会分配到 4）

- 当 `newsize - Py_SIZE(self) > new_allocated - newsize` 时，即实际新增长度大于过度分配的长度时，推测为一次性增加了很多元素，直接把 `allocated` 设置为 `newsize` 的下一个 4 的倍数。（避免过度分配，这个情况很可能是 `extend` 等操作）

<details>
<summary><code>listobject.c</code> 源码</summary>
```c
/* Ensure ob_item has room for at least newsize elements, and set
 * ob_size to newsize.  If newsize > ob_size on entry, the content
 * of the new slots at exit is undefined heap trash; it's the caller's
 * responsibility to overwrite them with sane values.
 * The number of allocated elements may grow, shrink, or stay the same.
 * Failure is impossible if newsize <= self.allocated on entry.
 * Note that self->ob_item may change, and even if newsize is less
 * than ob_size on entry.
 */
static int
list_resize(PyListObject *self, Py_ssize_t newsize)
{
    size_t new_allocated, target_bytes;
    Py_ssize_t allocated = self->allocated;


    /* Bypass realloc() when a previous overallocation is large enough
       to accommodate the newsize.  If the newsize falls lower than half
       the allocated size, then proceed with the realloc() to shrink the list.
    */
    if (allocated >= newsize && newsize >= (allocated >> 1)) {
        assert(self->ob_item != NULL || newsize == 0);
        Py_SET_SIZE(self, newsize);
        return 0;
    }


    /* This over-allocates proportional to the list size, making room
     * for additional growth.  The over-allocation is mild, but is
     * enough to give linear-time amortized behavior over a long
     * sequence of appends() in the presence of a poorly-performing
     * system realloc().
     * Add padding to make the allocated size multiple of 4.
     * The growth pattern is:  0, 4, 8, 16, 24, 32, 40, 52, 64, 76, ...
     * Note: new_allocated won't overflow because the largest possible value
     *       is PY_SSIZE_T_MAX * (9 / 8) + 6 which always fits in a size_t.
     */
    new_allocated = ((size_t)newsize + (newsize >> 3) + 6) & ~(size_t)3;
    /* Do not overallocate if the new size is closer to overallocated size
     * than to the old size.
     */
    if (newsize - Py_SIZE(self) > (Py_ssize_t)(new_allocated - newsize))
        new_allocated = ((size_t)newsize + 3) & ~(size_t)3;


    if (newsize == 0)
        new_allocated = 0;


    ensure_shared_on_resize(self);


#ifdef Py_GIL_DISABLED
    _PyListArray *array = list_allocate_array(new_allocated);
    if (array == NULL) {
        if (newsize < allocated) {
            // Never fail when shrinking allocations
            Py_SET_SIZE(self, newsize);
            return 0;
        }
        PyErr_NoMemory();
        return -1;
    }
    PyObject **old_items = self->ob_item;
    if (self->ob_item) {
        if (new_allocated < (size_t)allocated) {
            target_bytes = new_allocated * sizeof(PyObject*);
        }
        else {
            target_bytes = allocated * sizeof(PyObject*);
        }
        memcpy(array->ob_item, self->ob_item, target_bytes);
    }
    if (new_allocated > (size_t)allocated) {
        memset(array->ob_item + allocated, 0, sizeof(PyObject *) * (new_allocated - allocated));
    }
     _Py_atomic_store_ptr_release(&self->ob_item, &array->ob_item);
    self->allocated = new_allocated;
    Py_SET_SIZE(self, newsize);
    if (old_items != NULL) {
        free_list_items(old_items, _PyObject_GC_IS_SHARED(self));
    }
#else
    PyObject **items;
    if (new_allocated <= (size_t)PY_SSIZE_T_MAX / sizeof(PyObject *)) {
        target_bytes = new_allocated * sizeof(PyObject *);
        items = (PyObject **)PyMem_Realloc(self->ob_item, target_bytes);
    }
    else {
        // integer overflow
        items = NULL;
    }
    if (items == NULL) {
        if (newsize < allocated) {
            // Never fail when shrinking allocations
            Py_SET_SIZE(self, newsize);
            return 0;
        }
        PyErr_NoMemory();
        return -1;
    }
    self->ob_item = items;
    Py_SET_SIZE(self, newsize);
    self->allocated = new_allocated;
#endif
    return 0;
}
```
</details>

---

Rust 的 `Vec` 不会主动缩容，只有主动调用 `Vec::shrink_to_fit` 或者 `Vec::shrink_to` 才会缩容；在 `Vec::push` 和 `Vec::insert` 时发现 `len == capacity` 才会扩容。

- `let cap = cmp::max(self.cap.as_inner() * 2, required_cap);` 取 `cap` 的两倍和 `required_cap` 的较大值

- `let cap = cmp::max(min_non_zero_cap(elem_layout.size()), cap);` 取 `cap` 和 `min_non_zero_cap(elem_layout.size())` 的较大值，`min_non_zero_cap` 的逻辑是：如果元素大小为 1，则最小容量为 8；如果元素大小不超过 1024，则最小容量为 4；否则最小容量为 1。保证冷启动时有一个合理的初始容量，避免频繁扩容

参考文档 [Capacity and reallocation](https://doc.rust-lang.org/std/vec/struct.Vec.html#capacity-and-reallocation)，源码 [https://doc.rust-lang.org/src/alloc/vec/mod.rs.html](https://doc.rust-lang.org/src/alloc/vec/mod.rs.html) 和 [https://github.com/rust-lang/rust/blob/main/library/alloc/src/raw_vec/mod.rs#L412C1-L552C2](https://github.com/rust-lang/rust/blob/main/library/alloc/src/raw_vec/mod.rs#L412C1-L552C2)

<details>
<summary><code>RawVecInner</code> 源码</summary>

```rust
// Tiny Vecs are dumb. Skip to:
// - 8 if the element size is 1, because any heap allocator is likely
//   to round up a request of less than 8 bytes to at least 8 bytes.
// - 4 if elements are moderate-sized (<= 1 KiB).
// - 1 otherwise, to avoid wasting too much space for very short Vecs.
const fn min_non_zero_cap(size: usize) -> usize {
    if size == 1 {
        8
    } else if size <= 1024 {
        4
    } else {
        1
    }
}

#[rustc_const_unstable(feature = "const_heap", issue = "79597")]
#[rustfmt::skip] // FIXME(fee1-dead): temporary measure before rustfmt is bumped
const impl<A: [const] Allocator + [const] Destruct> RawVecInner<A> {
    #[cfg(not(no_global_oom_handling))]
    #[inline]
    fn with_capacity_in(capacity: usize, alloc: A, elem_layout: Layout) -> Self {
        match Self::try_allocate_in(capacity, AllocInit::Uninitialized, alloc, elem_layout) {
            Ok(this) => {
                unsafe {
                    // Make it more obvious that a subsequent Vec::reserve(capacity) will not allocate.
                    hint::assert_unchecked(!this.needs_to_grow(0, capacity, elem_layout));
                }
                this
            }
            Err(err) => handle_error(err),
        }
    }


    fn try_allocate_in(
        capacity: usize,
        init: AllocInit,
        alloc: A,
        elem_layout: Layout,
    ) -> Result<Self, TryReserveError> {
        // We avoid `unwrap_or_else` here because it bloats the amount of
        // LLVM IR generated.
        let layout = match layout_array(capacity, elem_layout) {
            Ok(layout) => layout,
            Err(_) => return Err(CapacityOverflow.into()),
        };


        // Don't allocate here because `Drop` will not deallocate when `capacity` is 0.
        if layout.size() == 0 {
            return Ok(Self::new_in(alloc, elem_layout.alignment()));
        }


        let result = match init {
            AllocInit::Uninitialized => alloc.allocate(layout),
            #[cfg(not(no_global_oom_handling))]
            AllocInit::Zeroed => alloc.allocate_zeroed(layout),
        };
        let ptr = match result {
            Ok(ptr) => ptr,
            Err(_) => return Err(AllocError { layout, non_exhaustive: () }.into()),
        };


        // Allocators currently return a `NonNull<[u8]>` whose length
        // matches the size requested. If that ever changes, the capacity
        // here should change to `ptr.len() / size_of::<T>()`.
        Ok(Self {
            ptr: Unique::from(ptr.cast()),
            cap: unsafe { Cap::new_unchecked(capacity) },
            alloc,
        })
    }


    /// # Safety
    /// - `elem_layout` must be valid for `self`, i.e. it must be the same `elem_layout` used to
    ///   initially construct `self`
    /// - `elem_layout`'s size must be a multiple of its alignment
    #[cfg(not(no_global_oom_handling))]
    #[inline]
    unsafe fn grow_one(&mut self, elem_layout: Layout) {
        // SAFETY: Precondition passed to caller
        if let Err(err) = unsafe { self.grow_amortized(self.cap.as_inner(), 1, elem_layout) } {
            handle_error(err);
        }
    }


    /// # Safety
    /// - `elem_layout` must be valid for `self`, i.e. it must be the same `elem_layout` used to
    ///   initially construct `self`
    /// - `elem_layout`'s size must be a multiple of its alignment
    /// - The sum of `len` and `additional` must be greater than the current capacity
    unsafe fn grow_amortized(
        &mut self,
        len: usize,
        additional: usize,
        elem_layout: Layout,
    ) -> Result<(), TryReserveError> {
        // This is ensured by the calling contexts.
        debug_assert!(additional > 0);


        if elem_layout.size() == 0 {
            // Since we return a capacity of `usize::MAX` when `elem_size` is
            // 0, getting to here necessarily means the `RawVec` is overfull.
            return Err(CapacityOverflow.into());
        }


        // Nothing we can really do about these checks, sadly.
        let required_cap = len.checked_add(additional).ok_or(CapacityOverflow)?;


        // This guarantees exponential growth. The doubling cannot overflow
        // because `cap <= isize::MAX` and the type of `cap` is `usize`.
        let cap = cmp::max(self.cap.as_inner() * 2, required_cap);
        let cap = cmp::max(min_non_zero_cap(elem_layout.size()), cap);


        // SAFETY:
        // - cap >= len + additional
        // - other preconditions passed to caller
        let ptr = unsafe { self.finish_grow(cap, elem_layout)? };


        // SAFETY: `finish_grow` would have failed if `cap > isize::MAX`
        unsafe { self.set_ptr_and_cap(ptr, cap) };
        Ok(())
    }


    /// # Safety
    /// - `elem_layout` must be valid for `self`, i.e. it must be the same `elem_layout` used to
    ///   initially construct `self`
    /// - `elem_layout`'s size must be a multiple of its alignment
    /// - `cap` must be greater than the current capacity
    // not marked inline(never) since we want optimizers to be able to observe the specifics of this
    // function, see tests/codegen-llvm/vec-reserve-extend.rs.
    #[cold]
    unsafe fn finish_grow(
        &self,
        cap: usize,
        elem_layout: Layout,
    ) -> Result<NonNull<[u8]>, TryReserveError> {
        let new_layout = layout_array(cap, elem_layout)?;


        let memory = if let Some((ptr, old_layout)) = unsafe { self.current_memory(elem_layout) } {
            // FIXME(const-hack): switch to `debug_assert_eq`
            debug_assert!(old_layout.align() == new_layout.align());
            unsafe {
                // The allocator checks for alignment equality
                hint::assert_unchecked(old_layout.align() == new_layout.align());
                self.alloc.grow(ptr, old_layout, new_layout)
            }
        } else {
            self.alloc.allocate(new_layout)
        };


        // FIXME(const-hack): switch back to `map_err`
        match memory {
            Ok(memory) => Ok(memory),
            Err(_) => Err(AllocError { layout: new_layout, non_exhaustive: () }.into()),
        }
    }
}
```
</details>

## Disjoint Sets

不相交集，提供 `connect(a, b)` 和 `isConnected(a, b)` 两个操作，支持合并两个集合和查询两个元素是否在同一个集合中。

最简单的实现是 `List<Set<Integer>>` 通过遍历列表，查询元素是否在相同的集合中，时间复杂度 O(n)。

### Quick Find

将每个元素映射到一个 id，id 相同的元素在同一个集合中。

将每个元素存储到列表中，索引为元素值，值为元素的 id。

这样 `isConnected(a, b)` 操作只需要比较两个元素的 id 是否相同，时间复杂度 $O(1)$。

但 `connect(a, b)` 操作需要遍历整个列表，将所有值为 id_a 的替换为 id_b（或者相反），时间复杂度 $O(n)$。

### Quick Union

Qucik Find 的思路是修改所有 id_a，是扁平的。

假如每个集合是一棵树，那么 `connect(a, b)` 操作只需要先找到 a 和 b 的根节点，然后将 a 的根节点连接到 b 的根节点即可（或者相反），时间复杂度 $O(h)$，$h$ 是树的高度。

这样 `isConnected(a, b)` 操作需要先找到 a 和 b 的根节点，然后比较根节点是否相同，时间复杂度 $O(h)$。

但是如果持续将一个集合的根节点连接到另一个集合的根节点，可能会导致树的高度变得很高，最坏情况下退化成链表，时间复杂度变成 $O(n)$。

例如 `connect(1, 2)`, `connect(2, 3)`, `connect(3, 4)`，最终变成 `1 -> 2 -> 3 -> 4`。

### Weighted Quick Union

树的高度决定了 `connect` 和 `isConnected` 的性能，所以决定 a 的根节点连接到 b 的根节点还是相反，应该根据树的大小来决定，较小的树连接到较大的树，这样可以保证树的高度尽可能小，这样时间复杂度为 $O(\log n)$。

例如 `connect(1, 2)`, `connect(2, 3)`, `connect(4, 5)`, `connect(5, 6)`, `connect(2, 5)`, 最终变成

```
        2 (大根)
      / | \
     1  3  5 (原本的另一个根)
          / \
         4   6
```

而不是
```
        3
       / \
      2   4
     /     \
    1       5
             \
              6
```


### Path Compression

在 `isConnected(a, b)` 操作中，找到 a 和 b 的根节点的过程中，必须遍历整个路径。在遍历到根节点后，将路径上的所有节点直接连接到根节点，这样可以进一步降低树的高度，时间复杂度为 $O(\alpha(N))$，在长期行为上接近常数。

## BST 二叉搜索树

BST 是一种特殊的二叉树，满足以下性质：

- 每个节点的值都小于其左子树中所有节点的值
- 每个节点的值都大于其右子树中所有节点的值

### Insert

从根树往下查询插入值，如果不存在，已经到达叶子节点了，就选择左右插入新节点。

时间复杂度为 $O(h)$，$h$ 是树的高度，最坏情况下退化成链表，时间复杂度变成 $O(n)$。

### Search

从根树往下查询目标值，如果大于当前节点值，就往右子树查询；如果小于当前节点值，就往左子树查询；如果等于当前节点值，就找到了。

时间复杂度为 $O(h)$，$h$ 是树的高度，同样最坏情况下退化成链表，时间复杂度变成 $O(n)$。

### Delete

删除比较麻烦，分三种情况

#### 无子节点

直接删除节点即可。

#### 有一个子节点

将子节点直接连接到父节点上，删除当前节点即可。

#### 有两个子节点

显然删除后只有一个节点能够代替当前节点的位置，应该选择右子树中最小的节点（或者左子树中最大的节点）来代替当前节点的位置，这样可以保证 BST 的性质不被破坏。

因为在数值上与当前节点的值的差的绝对值最小的节点，才能在不改变大小关系下替换当前节点，其一定是左子树的最右边（小的里面最大的）或者右子树的最左边（大的里面最小的）的节点。

## B Tree

树的高度决定性能，如果树的左右子树高度相同，那么就是平衡树，高度最低。

树不止于二叉，可以有多个叉。

增加时先塞入叶子节点，如果叶子节点满了，就将中间值向上弹，以此类推，绝不在向下增加高度。

## Red-Black Tree

> 我觉得红黑树在这些里面是最难理解的

用二叉树来实现 B Tree，具体的说，CS61B 里面的是左倾红黑树。

规则有：

- 只有左子节点可以是红色
- 没有连续的红色节点
- 每个叶子节点到根节点的黑色节点数量相同
- 是 2-3 树

### Rotation 旋转

旋转有左旋 `rotateLeft` 和右旋 `rotateRight`。

#### `rotateLeft`

对于下面这个树

```
    1
   / \
  5   2
     /  \
    4    3
```

可以通过 `rotateLeft(1)` 变成

```
       2
     /  \
    1    3
   / \
  5   4
```

将 `1` 用 `root` 表示，`2` 用 `newRoot` 表示，则过程是先将 `root.right` 指向 `newRoot.left`，然后将 `newRoot.left` 指向 `root`，最后将 `newRoot` 返回作为新的子树的根节点。

```java
private Node rotateRight(Node root) {
    Node newRoot = root.left;
    root.left = newRoot.right;
    newRoot.right = root;
    return newRoot;
}
```

#### `rotateRight`

对于下面这个树

```
       2
     /  \
    1    3
   / \
  5   4
```

可以通过 `rotateRight(2)` 变成

```
    1
   / \
  5   2
     /  \
    4    3
```

将 `2` 用 `root` 表示，`1` 用 `newRoot` 表示，则过程是先将 `root.left` 指向 `newRoot.right`，然后将 `newRoot.right` 指向 `root`，最后将 `newRoot` 返回作为新的子树的根节点。

```java
private Node rotateLeft(Node root) {
    Node newRoot = root.right;
    root.right = newRoot.left;
    newRoot.left = root;
    return newRoot;
}
```

### Insert

首先像 BST 一样插入节点，注意是红色的，因为不向下增加高度，然后进行自下而上修复。

#### Case 1 右红节点

违反了只有左子节点可以是红色的规则，进行左旋转。

```
    2   add(R4)    2  rotateLeft(3)    2
   / \    ->      / \     ->          / \    
  1   3          1   3               1   R4
                      \                 /
                      R4               3
```

#### Case 2 连续左红节点

违反了没有连续的红色节点的规则，进行右旋转。

```
      2     add(R3)      2   rotateRight(5)   2   flipColors(4)    2
     / \     ->        / \      ->          /  \      ->         / \
   1    5             1   5                1    4               1   R4
       /                 /                     / \                  / \
      R4                R4                    R3  R5               3   5
                       /
                      R3 
```

#### Case 3 两个红子节点（4-node）

违反了只有左子节点可以是红色的规则，将该节点和子节点的颜色反转模拟分裂。

```
      2     add(R5)     2    flipColors(3)   2
     / \     ->        / \      ->          / \
    1   3             1   3                1   R3
       /                 / \                  / \
      R4               R4   R5               4   5
```

```cpp
private Node insert(Node root, int key) {
    if (root == null) {
        return new Node(key, RED);
    }

    if (key < root.key) {
        root.left = insert(root.left, key);
    } else if (key > root.key) {
        root.right = insert(root.right, key);
    } else {
        root.key = key;
    }

    if (isRed(root.right) && !isRed(root.left)) {
        root = rotateLeft(root);
    }
    if (isRed(root.left) && isRed(root.left.left)) {
        root = rotateRight(root);
    }
    if (isRed(root.left) && isRed(root.right)) {
        flipColors(root);
    }

    return root;
}
```

正经的红黑树 TODO

## HashTable

这里的哈希表通过定长数组实现，容量和哈希函数决定了哈希表的性能。

选择一个合适的哈希函数，产生对应的 `hashCode`，然后通过 `hashCode % capacity` 计算出元素在数组中的索引位置，如果位置被占用了，就通过链表或者开放寻址等方式解决冲突。

以链表法为例，哈希表的最差效率由最长的链决定。

### 扩容

可以根据负载因子 $load factor = size / capacity$ 来决定是否扩容，Java 的默认负载因子是 0.75，当负载因子超过 0.75 时，就进行扩容，通常是将容量翻倍。

注意，扩容后需要重新映射所有元素的位置，因为容量变了，`hashCode % capacity` 的结果也会变。

```java
class HashTable {
    private Entry[] table = new Entry[16];
    private int size;
    private final float loadFactor = 0.75f;

    class Node {
        String key;
        String value;
        Node next;

        Node(String key, String value) {
            this.key = key;
            this.value = value;
        }
    }

    private int getHashCode(String key) {
        int hashCode = ...;
        return hashCode;
    }

    private void resize() {
        int newCapacity = table.length * 2;
        Entry[] newTable = new Entry[newCapacity];

        for (Entry entry : table) {
            while (entry != null) {
                int newIndex = entry.key.hashCode() % newCapacity;
                Entry next = entry.next;
                entry.next = newTable[newIndex];
                newTable[newIndex] = entry;
                entry = next;
            }
        }

        table = newTable;
    }

    public void put(String key, String value) {
        if (size >= table.length * loadFactor) {
            resize();
        }

        int index = getHashCode(key) % table.length;
        Node newNode = new Node(key, value);
        newNode.next = table[index];
        table[index] = newNode;
        size++;
    }

    public String get(String key) {
        int index = getHashCode(key) % table.length;
        Node entry = table[index];
        while (entry != null) {
            if (entry.key.equals(key)) {
                return entry.value;
            }
            entry = entry.next;
        }
        return null;
    }
}
```

然而参考 Python 的 `dict` 的实现 [dictobject](https://github.com/python/cpython/blob/main/Objects/dictobject.c) 还有更多优化空间。

Python 的 `dict` 将哈希表分为两个数组，一个是 `indices` 数组，存储哈希值和元素在 `entries` 数组中的索引；另一个是 `entries` 数组，存储实际的键值对。

前者和上面的哈希表设计差不多，后者则是一个紧凑的数组，存储实际的键值对，它的每个元素大小远大于一个 `int` 索引（），将索引和数据分离能大幅节省空间。

同时，`dict` 还有不同于如上的哈希表设计，使用开放寻址法解决冲突，具体来说是线性探测（linear probing），当发生冲突或者与查询 `key` 不符时，继续向后查找下一个空位，直到找到为止，具体如何找到下一个空位可以参考以下源码。

首先 `perturb = hash`，然后每一次循环：

1. `perturb >>= 5;` (不断消耗高位哈希值)

2. `i = (i * 5 + perturb + 1) & mask;` (计算下一个索引位置)

其中通过 `perturb` 来减少聚集现象，即相同低位哈希值的元素聚集在一起，导致冲突频发，利用了哈希值的高位比特来引入随机性。 

```c
/* Internal function to find slot for an item from its hash
   when it is known that the key is not present in the dict.
 */
static Py_ssize_t
find_empty_slot(PyDictKeysObject *keys, Py_hash_t hash)
{
    assert(keys != NULL);

    const size_t mask = DK_MASK(keys);
    size_t i = hash & mask;
    Py_ssize_t ix = dictkeys_get_index(keys, i);
    for (size_t perturb = hash; is_unusable_slot(ix);) {
        perturb >>= PERTURB_SHIFT;
        i = (i*5 + perturb + 1) & mask;
        ix = dictkeys_get_index(keys, i);
    }
    return i;
}
```

当然这个机制对稀疏性要求也不低，Python 中定义的是 `#define USABLE_FRACTION(n) (((n) << 1)/3)`，当哈希表的使用率超过 2/3 时，就进行扩容。

同时对于被删除的元素，贸然设置为空会导致查询链断裂，因此会在 `indices` 对应位置上，设置为一个特殊的 `DUMMY` 标记，表示该位置曾经被占用过，但现在已经被删除了，这样查询时遇到 `DUMMY` 标记时会继续向后查找。

扩容的时候也需要重新映射所有元素的位置，因为容量变了，`hashCode % capacity` 的结果也会变，在此之中会重新压实 `entries` 数组，将所有 `DUMMY` 重新设置为空。

具体来说，`ma_used` 是键值对的数量，`dictresize` 中 `newsize = max(PyDict_MINSIZE, ma_used * 3);` 来决定新的容量，同时 `estimate_log2_keysize` 找到第一个大于等于 `newsize` 的 $2^n$ 作为最终的容量。

初始容量是 `PyDict_MINSIZE` 为 8。

看起来这个设计改进于 [Python-Dev More compact dictionaries with faster iteration]
(https://mail.python.org/pipermail/python-dev/2012-December/123028.html)，这里还产生了个非常有用的副作用————字典的迭代顺序和插入顺序一致了，`entries` 数组的顺序就是插入的顺序。

## Priority Queue

优先队列需要实现 `add(item)`、`getSmallest()` 和 `removeSmallest()` 三个操作。

其中已知数据结构里效率最高的是 BST，然而要用 BST 来实现的话，插入和查找的时间复杂度都是 $O(\log n)$。将最小堆定义为完全二叉树，且每个节点的值都小于等于其子节点的值，这样最小元素就位于根节点，`getSmallest()` 的时间复杂度为 $O(1)$，而 `add(item)` 和 `removeSmallest()` 的时间复杂度为 $O(\log n)$。

### `add(item)` 实现

将新元素添加到堆的末尾，然后进行上浮操作（swim），将新元素与其父节点比较，如果新元素小于父节点，就交换它们的位置，直到新元素不再小于父节点或者到达根节点为止。

### `removeSmallest()` 实现

将堆的最后一个元素移动到根节点的位置，然后进行下沉操作，将根节点与其较小的子节点比较，如果根节点大于较小的子节点，就交换它们的位置，直到根节点不再大于较小的子节点或者到达叶子节点为止。

### Tree Representation

一般的树通过 `Node` 类实现，用指针指向下一个节点，而堆通过保证完全二叉树的性质，可以通过数组来实现，父节点和子节点之间的关系可以通过索引计算出来。

一般的树也可以用数组表示，如果不介意空间利用率低的话，每一层都需要 $2^(n-1)$ 个位置来存储节点，但显然完全二叉树才能充分填满数组。

关于计算索引（以 0 开始）：

- 父节点索引：$parent(i) = (i - 1) / 2$
- 左子节点索引：$left(i) = 2 * i + 1$
- 右子节点索引：$right(i) = 2 * i + 2$

<details>
<summary>粗略计算</summary>

首先假设节点为的索引为 $i$，则该层之前有 $2^n - 1$ 个节点，其中 $n$ 是该层的层数（从 0 开始），其在该层的偏移量从 0 开始是 $k$，因此 

$$i = 2^n - 1 + k$$

$$k = i - 2^n + 1$$

父节点的层数为 $n - 1$，父节点在该层的偏移量为 $k / 2$（向下取整），因此父节点的索引为 

$$i_p =  2^{n-1} - 1 + k_p = 2^{n-1} - 1 + k / 2$$

代入 $k = i - 2^n + 1$，得到

$$i_p = 2^{n-1} - 1 + (i - 2^n + 1) / 2$

$$ 2 i_p = 2^n - 2 + i - 2^n + 1 = i - 1$$

$$ i_p = (i - 1) / 2$$

所以父节点索引：$parent(i) = (i - 1) / 2$

左子节点的层数为 $n + 1$，左子节点在该层的偏移量为 $2k$，因此左子节点的索引为 $$i_l = 2^{n+1} - 1 + 2k = 2^{n+1} - 1 + 2(i - 2^n + 1) = 2 i + 1$$

右子节点为 $$i_r = i_l + 1 = 2 i + 2$$

</details>

### 最大堆

最大堆只需要将上浮和下沉操作中的比较条件改为大于即可。

## Traversals 

树的遍历有四种形式：

- 前序遍历（Pre-order Traversal）：访问根节点，然后访问左子树，最后访问右子树。

- 中序遍历（In-order Traversal）：访问左子树，然后访问根节点，最后访问右子树。

- 后序遍历（Post-order Traversal）：访问左子树，然后访问右子树，最后访问根节点。

- 层序遍历（Level-order Traversal）：按照树的层次从上到下、从左到右访问节点。

以下的输出以下面这个树为例子

```
         1
       /   \
      2     3
     / \   / \
    4   5 6   7 
```

### 前序遍历

```java
void preOrder(Node root) {
    if (root == null) {
        return;
    }

    visit(root);
    preOrder(root.left);
    preOrder(root.right);
}
```

`visit` 顺序是 1 -> 2 -> 4 -> 5 -> 3 -> 6 -> 7

### 中序遍历

```java
void inOrder(Node root) {
    if (root == null) {
        return;
    }

    inOrder(root.left);
    visit(root);
    inOrder(root.right);
}
```

`visit` 顺序是 4 -> 2 -> 5 -> 1 -> 6 -> 3 -> 7

### 后序遍历

```java
void postOrder(Node root) {
    if (root == null) {
        return;
    }

    postOrder(root.left);
    postOrder(root.right);
    visit(root);
}
```

`visit` 顺序是 4 -> 5 -> 2 -> 6 -> 7 -> 3 -> 1

### 层序遍历

```java
void levelOrder(Node root) {
    if (root == null) {
        return;
    }

    Queue<Node> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        Node node = queue.poll();
        visit(node);
        if (node.left != null) {
            queue.offer(node.left);
        }
        if (node.right != null) {
            queue.offer(node.right);
        }
    }
}
```

创建一个优先队列，先添加进 `queue` 之后再 `poll` 出来访问，同时添加它的子节点，那么当最后一个节点被访问后且它没有添加新节点进去，就说明树已经遍历完了。

## Graph

图和树看起来很像，但任意节点之间都能互联，甚至成环，因此树是图的一种特殊情况。

### Graph Representation

有两种常见的图的表示方法：

- 邻接矩阵（Adjacency Matrix）：使用一个二维数组来表示图，其中 `matrix[i][j]` 表示节点 `i` 和节点 `j` 之间是否有边。对于无权图，通常使用布尔值；对于有权图，使用边的权重。

- 邻接表（Adjacency List）：使用一个列表来表示图，其中每个节点都有一个列表，存储与该节点相邻的节点。对于无权图，列表中只存储相邻节点的标识；对于有权图，列表中存储相邻节点的标识和边的权重。

```java
class MatrixGraph {
    private boolean[][] matrix;
    private int numVertices;
    private int numEdges;

    public int getNumVertices() {
        return numVertices;
    }

    public int getNumEdges() {
        return numEdges;
    }

    public MatrixGraph(int numVertices) {
        this.numVertices = numVertices;
        this.numEdges = 0;
        matrix = new boolean[numVertices][numVertices];
    }

    public void addEdge(int i, int j) {
        matrix[i][j] = true;
        matrix[j][i] = true; // 无向图
        numEdges++;
    }

    public boolean hasEdge(int i, int j) {
        return matrix[i][j];
    }

    public List<Integer> getNeighbors(int i) {
        List<Integer> neighbors = new ArrayList<>();
        for (int j = 0; j < numVertices; j++) {
            if (matrix[i][j]) {
                neighbors.add(j);
            }
        }
        return neighbors;
    }
}

class ListGraph {
    private List<List<Integer>> adjacencyList;
    private int numVertices;
    private int numEdges;

    public int getNumVertices() {
        return numVertices;
    }

    public int getNumEdges() {
        return numEdges;
    }

    public ListGraph(int numVertices) {
        this.numVertices = numVertices;
        this.numEdges = 0;
        adjacencyList = new ArrayList<>();
        for (int i = 0; i < numVertices; i++) {
            adjacencyList.add(new ArrayList<>());
        }
    }

    public void addEdge(int i, int j) {
        adjacencyList.get(i).add(j);
        adjacencyList.get(j).add(i); // 无向图
        numEdges++;
    }

    public boolean hasEdge(int i, int j) {
        return adjacencyList.get(i).contains(j);
    }

    public List<Integer> getNeighbors(int i) {
        return adjacencyList.get(i);
    }
}
```

空间复杂度方面，邻接矩阵需要 $O(V^2)$ 的空间，而邻接表需要 $O(V + E)$ 的空间，其中 $V$ 是节点的数量，$E$ 是边的数量，$k$ 是节点 `i` 的邻居数量。

时间复杂度方面：

- `addEdge(i, j)`：邻接矩阵为 $O(1)$，邻接表为 $O(1)$。

- `hasEdge(i, j)`：邻接矩阵为 $O(1)$，邻接表为 $O(k)$

- `getNeighbors(i)`：邻接矩阵为 $O(V)$，邻接表为 $O(k)$

- 整图遍历：邻接矩阵为 $O(V^2)$，邻接表为 $O(V + E)$。

此外查到还有一种思路是 CSR（Compressed Sparse Row），将邻接表压缩成两个数组，一个是 `columns` 数组，存储所有边的目标节点；另一个是 `row_ptr` 数组，存储每个节点的邻居表在 `columns` 数组中的起始位置，若要存储边权，则添加一个 `values` 数组，存储每条边的权重，对应 `columns` 数组的位置。

这个设计的空间复杂度为 $O(V + E)$，时间复杂度方面：

- `addEdge(i, j)`：需要重新构建整个数据结构，时间复杂度为 $O(V + E)$。

- `hasEdge(i, j)`：需要在 `columns` 数组中查找目标节点，时间复杂度为 $O(k)$

- `getNeighbors(i)`：需要根据 `row_ptr` 数组找到邻居表在 `columns` 数组中的位置，时间复杂度为 $O(k)$

- 整图遍历：需要遍历 `columns` 数组，时间复杂度为 $O(V + E)$。

这个设计唯一的缺点是无法动态添加边，因为 `columns` 数组是紧凑的，添加边需要重新构建整个数据结构，但在提供优于邻接矩阵的空间效率的同时，提供了与邻接表相同的查询 `getNeighbors` 时间复杂度，以及比邻接表更友好的缓存性能（内存连续）。

```java
class CSRGraph {
    private int[] columns;
    private int[] rowPtr;
    private int numVertices;
    private int numEdges;

    public int getNumVertices() {
        return numVertices;
    }

    public int getNumEdges() {
        return numEdges;
    }

    public CSRGraph(int numVertices, List<Edge> edges) {
        this.numVertices = numVertices;
        this.numEdges = edges.size();
        columns = new int[numEdges];
        rowPtr = new int[numVertices + 1]; // 顶点 i 的邻居范围是 [rowPtr[i], rowPtr[i + 1]) 需要确定最后一个节点的邻居范围，所以需要多一个位置，去掉末尾判断

        // 构建 rowPtr 数组
        for (Edge edge : edges) {
            rowPtr[edge.source + 1]++;
        }
        for (int i = 1; i <= numVertices; i++) {
            rowPtr[i] += rowPtr[i - 1]; // offset
        }

        // 构建 columns 数组
        for (Edge edge : edges) {
            int index = rowPtr[edge.source]++; // 充当计数器
            columns[index] = edge.target;
        }

        // 还原 rowPtr
        for (int i = numVertices; i > 0; i--) {
            rowPtr[i] = rowPtr[i - 1];
        }
        rowPtr[0] = 0;
    }

    public boolean hasEdge(int i, int j) {
        for (int index = rowPtr[i]; index < rowPtr[i + 1]; index++) {
            if (columns[index] == j) {
                return true;
            }
        }
        return false;
    }

    public List<Integer> getNeighbors(int i) {
        List<Integer> neighbors = new ArrayList<>();
        for (int index = rowPtr[i]; index < rowPtr[i + 1]; index++) {
            neighbors.add(columns[index]);
        }
        return neighbors;
    }
}
```

邻接表在稀疏图中更高效，而邻接矩阵在稠密图中更高效，但实际上测试发现几乎没有差别，可能全存到缓存里面了。


### Graph Traversal

图的遍历有两种常见的方法：

- 深度优先搜索（Depth-First Search, DFS）：从一个节点开始，沿着一个路径一直向下访问，直到无法继续为止，然后回退到上一个节点，继续访问其他路径。DFS 可以使用递归或者栈来实现。

- 广度优先搜索（Breadth-First Search, BFS）：从一个节点开始，先访问所有相邻的节点，然后再访问这些相邻节点的相邻节点，以此类推。BFS 通常使用队列来实现。

两者都需要避免访问已经访问过的节点，以防止死循环，通常使用一个布尔数组或者集合来记录已经访问过的节点。

```java
class DFSHelper {
    private boolean[] visited;

    public DFSHelper(int numVertices) {
        visited = new boolean[numVertices];
    }

    public void dfs(Graph graph, int start) {
        if (visited[start]) {
            return;
        }
        visited[start] = true;
        visit(start);
        for (int neighbor : graph.getNeighbors(start)) {
            dfs(graph, neighbor);
        }
    }

    private void visit(int node) {
        ...
    }
}

class BFSHelper {
    private boolean[] visited;

    public BFSHelper(int numVertices) {
        visited = new boolean[numVertices];
    }

    public void bfs(Graph graph, int start) {
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(start);
        visited[start] = true;

        while (!queue.isEmpty()) {
            int node = queue.poll();
            visit(node);
            for (int neighbor : graph.getNeighbors(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
    }

    private void visit(int node) {
        ...
    }
}
```

## Shortest Paths

首先考虑无权图，使用 BFS 就可以找到最短路径，而 DFS 可能会找到一条路径，但不一定是最短的。

考虑有权图的话，BFS 只考虑路径边数不考虑权重，DFS 也不考虑权重，因此都不适用。

### Dijkstra's Algorithm

假设所有边的权重都是非负的，可以使用 Dijkstra 算法来找到最短路径。

如果我们每次都走已知总路径最短的道路，那么归纳下来，最先到达终点的道路就会是总路程最短的道路。

因为已知的任意未到达终点的道路，加上他们对应的下一条边的权重，都比当前已到达终点的道路更长，所以不可能还有其他的道路更短。

实现方法是维护一个优先队列，存储已知道路长度和对应的节点，每次从优先队列中取出总路径最短的节点，更新其相邻节点的路径长度，将其加入优先队列。

### A* Algorithm

Dijkstra's Algorithm 是一种贪心算法，每次选择当前已知路径最短的节点进行扩展，但这意味着最坏情况下，会探索完所有小于等于目标节点的无用路径，会变成一个圆形的探索范围，效率太低。

A* 算法在 Dijkstra's Algorithm 的基础上引入了启发式函数（heuristic function），通过估计从当前节点到目标节点的距离 $E$，将 $E + D$ 作为优先队列的排序依据，其中 $D$ 是从起点到当前节点的实际距离，这样可以利用已知全局信息引导搜索。

这取决于启发式函数的设计，CS61B 有两点要求：

1. 可接纳性 (Admissibility)：不能高估从当前节点到目标节点的距离，否则可能会错过最短路径。
   定义： $h(v, \text{target}) \le \text{trueDistance}(v, \text{target})$

2. 一致性 (Consistency)：不能违反三角不等式，实际走过的路程不能比估计的路程更短
   定义： $h(v, \text{target}) \le \text{trueDistance}(v, \text{neighbor}) + h(\text{neighbor}, \text{target})$

一致性比可接纳性更严格，因为两点之间直线最短，如果每一次实际走过的路程都不比估计的路程更短，那么从起点到目标点的实际路程也不会比估计的路程更短，因此一致性包含可接纳性。

由于每次走最短的，假设  $ L_1 > L_2 $ 为实际全长，$ l_1$ 和 $ l_2 $ 为已知长度，因为 $ h_1 \le L_1 - l_1 $ 和 $ h_2 \le L_2 - l_2 $，所以在 $L_2$ 走完之前最后必有 $ l_1 + h_1 \le L_1 \le l_2 + h_2 = L_2 $，此时 $ l_2 = L_2， h_2 = 0$，可靠。

## Minimum Spanning Trees (MST)

最小生成树是用于连接图中所有节点的树，且边的总权重最小。

### Cut Property

将图分成两个部分，那么连接这两个部分的最小边一定在最小生成树中。

假设连通加权无向图中有一个割将图分为两部分，且边 $e$ 为最小割边不在最小生成图 $M$ 中，那么 $M$ 中必定存在一条边 $f$ 连接这两部分，且 $w(f) \gt w(e)$，将 $f$ 替换为 $e$ 后得到的生成树的权重不大于 $M$ 的权重，因此 $M$ 不是最小生成树，矛盾，所以边 $e$ 一定在最小生成树中。

### Cycle property

以下有参考 [环定理](https://zh.wikipedia.org/wiki/最小生成树#环定理)

在图中形成一个环路，那么环路中权重最大的边一定不在最小生成树中。

假设边 $e$ 是环路中权重最大的边且在最小生成树 $M$ 中，那么去掉边 $e$ 后，生成树被分成两部分，则环路中必定存在一条边 $f$ 连接这两部分，且 $w(f) \lt w(e)$，将 $e$ 替换为 $f$ 后得到的生成树的权重小于 $M$ 的权重，因此 $M$ 不是最小生成树，矛盾，所以边 $e$ 一定不在最小生成树中。

### Prim's Algorithm

从一个节点开始，逐步将相邻的最小边加入生成树，直到所有节点都被包含在生成树中。

在具体实现中，使用一个优先队列来存储当前生成树的边，每次从优先队列中取出最小边，检查其连接的节点是否已经在生成树中，如果不在，就将其加入生成树，并将该节点的所有相邻边加入优先队列。直到生成树包含所有节点或者边的数量达到 $V - 1$。

注意需要维护一个 `visited` 集合来跟踪哪些节点已经在生成树中。

这里面用到了 [Cut Property](#cut-property)，因为每次选择的边都是连接生成树和未包含节点的最小边，一定在最小生成树中。

参考 [Prim's Algorithm](https://en.wikipedia.org/wiki/Prim%27s_algorithm#Description) 的实现。

> 中文 Wiki 里面那个 “//来源：严蔚敏 吴伟民《数据结构(C语言版)》” 的到底是什么鬼。。看半天才看懂，谁放进来的

### Kruskal's Algorithm

首先将所有边按照权重从小到大排序，然后逐步将边加入生成树，前提是加入该边不会形成环路。

在具体实现中，会先对所有边排序，然后维护一个并查集来跟踪哪些节点已经在同一个集合中，每次考虑一条边时，检查其连接的两个节点是否在同一个集合中，如果不在，就将该边加入生成树，并将两个节点所在的集合合并。直到生成树包含所有节点或者边的数量达到 $V - 1$。

Kruskal's Algorithm 同样利用了 [Cut Property](#cut-property) 确保已连接和未连接之间最小边是在 MST 中的，但也用到了 [Cycle Property](#cycle-property)，由于从小到大来选择边，当前加入的边必是环路中权重最大的边，因此不可能加入环路中。

参考 [克鲁斯克尔算法](https://zh.wikipedia.org/wiki/克鲁斯克尔演算法#C++_实现)

## Trie

HashMap 可以存储任意 key，只要它可以产生合适的哈希值，但对于字符串可以使用前缀树。

每个 `Node` 存一个字符，路径上连接的字符组成一个字符串，所有以该路径为前缀的字符串都在该节点的子树中，在 `Node` 中标记是否为一个完整的字符串。

最简单的实现是在每个 `Node` 中存一个长度为 26 的数组，缺点是空间利用率低，如果字符串比较稀疏的话会有很多空位，优点是时间复杂度为 $O(1)$。

还可以用 BST 来在每一层内部代替这个数组，空间利用率更高，但时间复杂度为 $O(\log k)$，其中 $k$ 是该层的已用字符数量。

> 和 Ternary Tree 差不多。Ternary Tree 提供左中右三个指针，中代表相等字符，跳转到下一层。

或者进一步用红黑树、哈希表来代替 BST 来实现每一层。

这里完全是时间换空间，权衡一下吧。

---

在下面补充一些找到的变体：

- [Radix Tree](https://en.wikipedia.org/wiki/Radix_tree)：和 Trie 类似，但如果节点只有一个子节点，退化成链表，那么则合并这些链表成一个节点，存储整个字符串；同时将每个节点存储的字符改为一个字符串片段，由参数 $r$ 决定分支数量和分片长度。

TODO: Double-Array Trie：[An Implementation of Double-Array Trie](https://linux.thai.net/~thep/datrie/datrie.html)，我看力竭了，等以后有机会再看吧。

## Sorting

TODO

## Compression

TODO