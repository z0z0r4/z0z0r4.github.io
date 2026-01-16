---
title: Python Magic Method
sticky: false
mermaid: false
date: 2025-12-14 01:02:08
tags: 
- python
- learning-notes
categories: 
- learning-notes
- coding
- python
cover: covers/python-magic-method.jpeg
comments:
copyright:
sponsor:
---

*选择了哈利波特里的这张图，但可惜没找到带蛇的 haha。*

没怎么用过 Python 的魔法方法，只用过几个 `__init__` 和上下文管理器的几个，今天记录一下。

> **magic method** 
> An informal synonym for special method.
> 一个非正式的同义词，指的是特殊方法。

官方的名称是 `special method`.

> **special method**
> A method that is called implicitly by Python to execute a certain operation on a type, such as addition. Such methods have names starting and ending with double underscores. Special methods are documented in Special method names.
> 特殊方法是 Python 隐式调用的，用于执行某种操作（如加法）的类型方法。这些方法的名称以双下划线开头和结尾。特殊方法在特殊方法名称中有文档说明。

比如 `__add__` 用于实现加法操作，`__len__` 用于实现 `len()` 函数。

假如自定义一个 `CustomList` 类，想让它支持 `len()` 函数，但是要返回负数，就可以实现 `__len__` 方法：

```python
class CustomList:
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return -len(self.items)

my_list = CustomList([1, 2, 3, 4])
print(len(my_list))  # 输出: -4
```
在这个例子中，`CustomList` 类实现了 `__len__` 方法，当调用 `len(my_list)` 时，实际上是调用了 `my_list.__len__()` 方法，返回了负数的长度。

魔法方法有时候被函数调用，有时候被运算符调用，还有时候被内置语句调用。

魔法方法还有很多，在这里列出一些常见的：

1. `__init__(self, ...)`：对象初始化方法，在初始化对象时调用。

2. `__new__(cls, ...)`：对象创建方法，返回一个实例。注意：它不需要 `self` 参数，因为它是一个静态方法。

3. `__str__(self)`：定义对象的字符串表示形式，当使用 `str()` 或 `print()` 时调用。

4. `__repr__(self)`：定义对象的官方字符串表示形式，通常用于调试。

5. `__add__(self, other)`：定义加法操作符 `+` 的行为。当然也有 `__sub__`、`__mul__`、`__truediv__`、等，这类运算符相关的内容，详见 [Emulating numeric types](https://docs.python.org/3/reference/datamodel.html#emulating-numeric-types)

6. `__eq__(self, other)`：定义相等操作符 `==` 的行为。还有 `__ne__`、`__lt__`、`__gt__` 等比较相关的方法，详见 [Emulating container types](https://docs.python.org/3/reference/datamodel.html#object.__eq__)

7. `__hash__(self)`：定义对象的哈希值，用于提供一个对象的唯一标识，通常用于字典的键或集合的元素的去重。

8. `__del__(self)`：对象销毁方法，或称析构函数，在对象被垃圾回收时调用。

其中重点说说上下文管理器要用的几个：

1. `__enter__`：进入上下文管理器时调用的函数，将它的返回值绑定到 target 上面，后续则可以在代码块中使用这个 target。

2. `__exit__`：退出上下文管理器时调用的函数。在上下文有异常的情况下，会传入 `exc_type`, `exc_value`, `traceback` 三个包含异常信息的参数

在异步调用的情况下，则是 `__aenter__` 和 `__aexit__`，和同步的没什么区别，只是返回的是可等待对象（awaitable）。

在这里补充一下 `with`、上下文管理器的用法：

> A context manager is an object that defines the runtime context to be established when executing a with statement. The context manager handles the entry into, and the exit from, the desired runtime context for the execution of the block of code. Context managers are normally invoked using the with statement (described in section The with statement), but can also be used by directly invoking their methods.

> 上下文管理器是一个定义在执行 with 语句时需要建立的运行时上下文的对象。上下文管理器处理代码块执行时进入和退出所需运行时上下文的过程。上下文管理器通常使用 with 语句（在 The with statement 部分中描述）来调用，但也可以通过直接调用其方法来使用。

```python
with EXPRESSION as TARGET:
    ...
```

上下文管理器设计出来，是为了简化程序的。如果没有它，就必须显式的在执行要执行的语句前，手动调用 `__enter__` 的语句，在调用完之后手动调用 `__exit__` 里面的语句，这会很繁琐且容易遗漏。

```python
cm = ContextManager()
value = cm.__enter__()
try:
    ...  # 这里是要执行的代码块
except Exception as e:
    cm.__exit__(type(e), e, e.__traceback__)
finally:
    cm.__exit__(None, None, None)
```

很多情况下，构造上下文管理器是为了资源的获取和释放，比如文件操作、数据库连接等。这种情况下，`__enter__` 方法通常用于获取资源，而 `__exit__` 方法则用于释放资源。手动处理的话，很容易忘记释放资源，导致资源泄漏。

```python
with open('file.txt', 'r') as file:
    data = file.read()
# 这里文件已经自动关闭了

f = open('file.txt', 'r')
try:
    data = f.read()
except Exception as e:
    print(f"An error occurred while reading the file: {e}")
finally:
    f.close()

# 假如忘记调用 f.close()，就会导致文件资源泄漏
```

除此之外，还有一些魔法方法是和容器类型相关的，比如：

1. `__getitem__(self, key)`：定义获取容器中元素的行为，比如 `obj[key]`。

2. `__setitem__(self, key, value)`：定义设置容器中元素的行为，比如 `obj[key] = value`。

3. `__delitem__(self, key)`：定义删除容器中元素的行为，比如 `del obj[key]`。

4. `__iter__(self)`：定义返回一个迭代器对象，用于迭代容器中的元素。

5. `__contains__(self, item)`：定义检查容器中是否包含某个元素的行为，比如 `item in obj`。

还有的是关于类的，比如：

1. `__getattr__(self, name)`：定义当访问不存在的属性时的行为。首先会尝试 `__getattribute__` 正常获取属性，如果找不到才会调用 `__getattr__`。

2. `__setattr__(self, name, value)`：定义设置属性的行为。

3. `__delattr__(self, name)`：定义删除属性的行为。

4. `__call__(self, ...)`：定义对象被调用时的行为，使实例可以像函数一样被调用。

魔法方法还有很多，具体可以参考官方文档的 [Special method names](https://docs.python.org/3/reference/datamodel.html#special-method-names) 一节。