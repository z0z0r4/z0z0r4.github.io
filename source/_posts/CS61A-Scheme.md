---
title: CS61A Scheme
sticky: false
mermaid: false
date: 2026-02-06 01:13:48
tags:
- CS61A
- learning-notes
categories:
- learning-notes
- CS
- CS61A
cover: images/CS61A_cover.png
comments:
copyright:
sponsor:
---

今天在补之前剩下的 CS61A 的内容，在做 Project Scheme。里面的 `Link` 让我非常坐牢，还有 Scheme 的各种奇怪的语法。

但这里面的作用域 `env` 的强调确实不错，以及没有循环只有递归着实让我感到抽象，不看 Gemini 没法入手。

精神状态比较差，在没有实现 EC1 `do_cond_form` 的情况下，一直在 Problem 14 里面用 `cond` 导致我写的实现一直报错，在 Scheme Online 里面测试也没问题，参考 <https://github.com/eeoeqaq/cs61A_2025_fall_resource/blob/master/proj/scheme/questions.scm> 发现他的都是 `if` 的实现，但也还是没想出原因。

最后还是 Gemini 3 PRO 给我找出来了（虽然没完全猜对就是了，以为我没 `return` 结果是完全没实现）...虽然我没有给 Gemini 看完整的仓库，但它还是猜出了问题所在，不赖，瞬间感觉值了，就是我一怒之下怒了一下，释怀了...

<details>
<summary>Gemini 记录</summary>

这个报错 **`argument 0 of car has wrong type (NoneType)`** 是最关键的线索。

这更加证实了我刚才的判断：**你的 Scheme 代码逻辑是完全正确的，问题出在你用 Python 编写的解释器底层实现上（Specifically `do_cond_form`）**。

这个报错揭示了错误的**传播路径**，这是一个非常经典的 CS 61A Project 踩坑现场。

### 错误发生了什么？（案情重演）

让我们拆解你的测试代码：
`(define with-tree (set (set schememon 'tree 3) 'fibo 4))`

这一行代码是**嵌套调用**：

1. **内层调用**：`(set schememon 'tree 3)` 先执行。
2. **外层调用**：`(set [内层的结果] 'fibo 4)` 后执行。

**灾难链条如下：**

1. **内层执行**：解释器执行内层的 `set`。因为你用了 `cond` 版本，解释器调用了你写的 `do_cond_form` (Python 函数)。
2. **Python Bug**：你的 `do_cond_form` 在处理某些分支（比如 `else` 或递归分支）时，计算出了正确结果，但是**忘记写 `return` 语句**，或者没有正确传递返回值。
* 在 Python 中，如果函数结束没有返回东西，默认返回 `None`。


3. **返回空值**：内层的 `(set ...)` 本该返回一个新的列表，结果它静悄悄地返回了 Python 的 `None`。
4. **外层接盘**：外层的 `set` 开始执行。它接收到的第一个参数 `dict` 变成了 `None`（来自内层的错误返回）。
* 现在的调用相当于：`(set None 'fibo 4)`。


5. **触发崩溃**：
* 代码进入 `cond`。
* 先检查 `(null? dict)`。如果你的 `do_null_form` 实现得健壮，`null?(None)` 可能返回 False（因为它不是 Scheme 的 `nil`）。
* 接着检查 `(equal? (caar dict) key)`。
* 解释器尝试求值 `(caar dict)` -> 即 `(car (car dict))`。
* 此时 `dict` 是 `None`。
* 解释器底层执行 `car(None)`。
* **报错**：`argument 0 of car has wrong type (NoneType)`。



### 为什么 `if` 版本可以？

因为 `if` 是 Scheme 最基础的 Special Form，通常在项目早期就实现了，而且逻辑简单（非真即假），不容易出现“忘记 return”或者“控制流掉进黑洞”的情况。既然 `if` 版本能跑通，说明你的 `set` 逻辑算法本身是满分的。

### 如何修复？

你需要检查你的 Python 源代码（通常是 `scheme_eval_apply.py` 或类似文件）中关于 `do_cond_form` 的实现。

**检查重点：**
在 `do_cond_form` 里，当你遍历条件列表并找到一个成立的条件（或者 `else`）时，你是怎么处理的？

* **错误写法 (可能是你现在的样子)：**
```python
if is_true_primitive(test):
    scheme_eval(clause.rest.first, env) # <--- 致命错误：计算了，但没把结果抛出去！

```


* **正确写法：**
```python
if is_true_primitive(test):
    return scheme_eval(clause.rest.first, env) # <--- 必须 Return！

```



**一句话总结：**
你的 Scheme 代码写得很好，去给你的 Python 解释器的 `cond` 实现补上缺失的 `return` 吧。
</details>

## 尾递归优化

栈帧深度有限制，递归过深会导致栈溢出，如果是尾递归的话，可以进行尾递归优化，复用栈帧，避免栈溢出。

但是 Python 不会释放栈帧，只能通过将 `expr` 和 `env` 进行拷贝，然后在外部循环中执行来实现尾递归优化。

在 CS61A 的 Scheme 实现中，`scheme_eval` 函数是用来计算 Scheme 表达式的核心函数，`eval_all` 是用来计算一个表达式列表的函数，还有诸如 `do_if_form`、`do_or_form`、`do_cond_form`、`do_and_form` 函数，他们调用 `scheme_eval` 来计算子表达式。

从局部上看，这些函数都有“尾部”，例如在 `and` 和 `or` 中，最后一个表达式的计算就是尾部调用；在 `if` 和 `cond` 中，每个分支的计算也是尾部调用，调用完后就没有其他操作了。

```python
def optimize_tail_calls(unoptimized_scheme_eval):
    """Return a properly tail recursive version of an eval function."""
    def optimized_eval(expr, env, tail=False):
        """Evaluate Scheme expression EXPR in Frame ENV. If TAIL,
        return an Unevaluated containing an expression for further evaluation.
        """
        if tail and not scheme_symbolp(expr) and not self_evaluating(expr):
            return Unevaluated(expr, env)

        result = Unevaluated(expr, env)
        # BEGIN OPTIONAL PROBLEM 3
        "*** YOUR CODE HERE ***"
        while isinstance(result, Unevaluated):
            result = unoptimized_scheme_eval(result.expr, result.env)

        return result
        # END OPTIONAL PROBLEM 3
    return optimized_eval
```

CS61A 中让所有的语句执行都用 `optimized_eval` 来执行，根据 `tail` 参数来决定是否进行尾递归优化。

- `tail=True`：表示这是一个尾调用，返回一个 `Unevaluated` 对象，包含表达式和环境，传递给外层的 `while` 循环来处理。

- `tail=False`：表示不是尾调用，开启一个循环处理当前的表达式对应的 `Unevaluated` 对象，直到得到一个最终的结果。

当 `tail=False`，若 `expr` 是一般语句，可能只需要一次 `unoptimized_scheme_eval` 就能得到结果；然而过程的可能会是递归语句，得循环反复处理尾调语句返回的 `Unevaluated` 对象，直到得到一个最终结果。

注意是“外层的 `while` 循环”，这样的循环可能有很多层嵌套，每当执行一个非尾调用语句时，都会开启一个循环。

如果递归语句在过程中间，那么很显然会不停在 `optimized_eval` 中执行 `scheme_eval`，而不会触发尾递归优化，很快触发 Python 的递归深度限制。

注意应该留心在应该加上 `tail=True` 的地方都加上。

假设 `do_if_form` 的 `else` 分支调用 `optimized_eval` 传入的是 `tail=False` 的话，若 `else` 分支里有一个递归调用，这个分支里就不会进行尾递归优化，这个栈将不会被释放，在`while` 循环跑完整一个递归过程，拿到结果，返回给更上一层的循环中（因为递归中产生的 `Unevaluated` 对象都抛到了这个未正确设置 `tail=True` 的 `optimized_eval` 中，而不是其上一层的 `optimized_eval` 循环中）之前，这一帧都不会释放。

看起来只是增加了一帧，真正危险在于，假设递归函数内部的递归调用语句也在没有正确设置 `tail=True` 的 `do_if_form` 上的话，那么每一次递归都会开一个 `while` 循环，这个递归调用会继续不停增加栈帧，像未优化一样线性堆叠。