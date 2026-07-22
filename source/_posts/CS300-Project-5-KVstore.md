---
title: CS300 Project 5 KVstore
sticky: false
mermaid: false
date: 2026-07-22 04:02:09
tags:
- CS300
- study-notes
categories:
- study-notes
- CS
- CS300
cover: covers/CS300_Project5.png
comments:
copyright:
sponsor:
---

[CS300 (CSCI 0300: Fundamentals of Computer Systems，计算机系统基础)](https://csci0300.github.io/) 是一门布朗大学的课程，和 CMU 的 15-213 类似，前半段围绕 C 语言、汇编、内存管理等，后半段则是网络、分布式系统、并发相关，也以 CSAPP 为教材。[3e 书本自带的 Lab](https://csapp.cs.cmu.edu/3e/labs.html)，太过古老了（更新于 2016~2019）~~也没兴趣做了~~，所以 [Proxy Lab](https://csapp.cs.cmu.edu/im/labs/proxylab.tar) 被跳过，~~虽然与 Proxy Lab 关系不大~~在此补上一个感兴趣的并发与分布式相关的 [Project 5 KVstore](https://csci0300.github.io/assign/projects/project5.html)。

Project 5 KVstore 分为 5A 和 5B 两个部分，分别对应并发和分布式两个主题。

## 5A Concurrent KVStore

5A 分为两个 Part，Part 1 分为四个 Steps 逐步实现一个并发桶存储 KVStore：

- Step 1: 实现一个简单的单线程 KVStore，支持 `get`、`put`、`delete`、`append`、`multiget`、`multiput`、`allkeys` 操作。

- Step 2: 实现一个**粗粒度锁**的并发 KVStore，只使用一个全局锁来保护整个 KVStore。

- Step 3: 将 KVStore 分为多个桶，为下一步做准备。

- Step 4: 为每个桶加锁，适配各个操作，最终实现一个细粒度锁的并发 KVStore。

其中值得一提的，~~除了记得为 `Delete` 操作的 `res` 响应填入被删除的 `value` 以外~~，是对于 1 -> 2 -> 3 和 2 -> 1 -> 4 这种循环死锁的情况，可以**按照固定统一的顺序**加锁（比如按照桶的 ID 顺序），这样就可以全都变成 1 -> 2 -> 3 -> 4 的顺序，避免死锁。（前提是预知要加哪些锁，提前进行排序；或者需要加锁时，业务产生的加锁需求本身就是固定顺序的，则不需要预知。并非银弹）

> 主要是冲着并发、锁相关的知识来的，15-445 的经历太折磨了...

至于 Part 2 是调用这些逻辑，实现一个 `GDPRDelete`，非常冗长，全责交给 Gemini 了...直接删除所有 `user` 发布的贴子和回复。

## 5B Distributed KVStore

5B 则是实现分布式 KVStore，主要是划分 `key` 的字典序范围，分配到多个 KVStore 节点上。

以下内容摘自课程：

- A **shardcontroller**, which determines the shards and stores which servers are responsible for each shard,
  碎片控制器负责确定各个碎片的分配情况，并记录下哪台服务器负责处理每个碎片。
- A **sharding-aware server** which periodically queries the shardcontroller to determine if any of its shards have been moved to another server, and if so, moves the key-value pairs for that shard to the new server, and
  这种服务器具备分片感知功能：它会定期向分片控制器查询，以确定是否有某个分片被移动到了另一台服务器上。如果确实如此，该服务器会将该分片对应的键值对同步到新的服务器上。
- A **sharding-aware client** which, for each request, queries the shardcontroller to determine which server(s) have the key(s) relevant to its request, then directs its request to those server(s).
  这种具备分片处理功能的客户端在处理每个请求时，都会先向分片控制器查询，以确定哪台或哪些服务器拥有与该请求相关的键值数据。之后，该客户端会将请求发送到这些服务器上。

由 **shardcontroller** 维护分发一个 `ShardControllerConfig`，客户端根据这个 `ShardControllerConfig` 计算 `key` 所在的 `server` 去发送请求，服务器持续请求新的 `ShardControllerConfig`，如果发现自己不再负责某个 `shard`，就将该 `shard` 的数据迁移到新的服务器上（客户端<->服务端、服务端<->服务端都是直接通信传输，**shardcontroller** 仅作为配置维护，没有请求转发和数据转移的功能）。

## 测试结果

```
cs300-user@731e8e338cf4:~/cs300-s26-projects/kvstore/build$ make check
 === A1 ===
 == kvstore_sequential_tests ==
1. [  PASSED  ] test_allkeys
2. [  PASSED  ] test_bad_multiput_req
3. [  PASSED  ] test_multiget_not_all_exists
4. [  PASSED  ] test_multiput_multiget
5. [  PASSED  ] test_multiput_overwrite
6. [  PASSED  ] test_put_get_delete
7. [  PASSED  ] test_put_overwrite
8. [  PASSED  ] test_simple_append
9. [  PASSED  ] test_simple_put_get

 === A2 ===
 == kvstore_parallel_tests ==
10. [  PASSED  ] test_atomic_multiput_multiget
11. [  PASSED  ] test_parallel_allkeys_delete
12. [  PASSED  ] test_parallel_append
13. [  PASSED  ] test_parallel_mixed_operations
14. [  PASSED  ] test_parallel_multiput_multiget
15. [  PASSED  ] test_parallel_phased_put_get_delete
16. [  PASSED  ] test_parallel_put_delete

 === A3 ===
 == kvstore_sequential_tests ==
17. [  PASSED  ] test_allkeys
18. [  PASSED  ] test_bad_multiput_req
19. [  PASSED  ] test_multiget_not_all_exists
20. [  PASSED  ] test_multiput_multiget
21. [  PASSED  ] test_multiput_overwrite
22. [  PASSED  ] test_put_get_delete
23. [  PASSED  ] test_put_overwrite
24. [  PASSED  ] test_simple_append
25. [  PASSED  ] test_simple_put_get

 === A4 ===
 == kvstore_parallel_tests ==
26. [  PASSED  ] test_atomic_multiput_multiget
27. [  PASSED  ] test_parallel_allkeys_delete
28. [  PASSED  ] test_parallel_append
29. [  PASSED  ] test_parallel_mixed_operations
30. [  PASSED  ] test_parallel_multiput_multiget
31. [  PASSED  ] test_parallel_phased_put_get_delete
32. [  PASSED  ] test_parallel_put_delete

 === A5 ===
 == kvstore_performance_tests ==
33. [  PASSED  ] test_performance_multiput_multiget
34. [  PASSED  ] test_performance_put_get

 === B1 ===
 == shardcontroller_tests ==
35. [  PASSED  ] test_complex_moves
36. [  PASSED  ] test_concurrent_joins_and_leaves
37. [  PASSED  ] test_concurrent_moves
38. [  PASSED  ] test_handout_example_moves
39. [  PASSED  ] test_join
40. [  PASSED  ] test_leave_after_move
41. [  PASSED  ] test_leave_before_move

 === B2 ===
 == server_tests ==
42. [  PASSED  ] test_get_server
43. [  PASSED  ] test_join_leave
44. [  PASSED  ] test_process_config

 === B3 ===
 == shardkv_client_tests ==
45. [  PASSED  ] test_multiget
46. [  PASSED  ] test_multiput

=======================
Tests Passed: 46 / 46
=======================
cs300-user@731e8e338cf4:~/cs300-s26-projects/kvstore/build$ python3 plot_performance.py
Performance Test Results
========================
single_thread_multiput  ❚❚❚❚❚❚❚❚ 32921.8 keys/second (2430ms)
multi_thread_multiput   ❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚ 99378.9 keys/second (805ms, 3.0x speedup)
single_thread_multiget  ❚❚❚❚❚❚❚❚ 33085.2 keys/second (2418ms)
multi_thread_multiget   ❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚ 82051.3 keys/second (975ms, 2.5x speedup)
single_thread_put       ❚❚❚❚❚❚❚❚ 33798.1 keys/second (2367ms)
multi_thread_put        ❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚ 86393.1 keys/second (926ms, 2.6x speedup)
single_thread_get       ❚❚❚❚❚❚❚❚ 33195 keys/second (2410ms)
multi_thread_get        ❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚❚ 78817.7 keys/second (1015ms, 2.4x speedup)
single_thread_multiput  ❚ 3028.12 keys/second (26419ms)
multi_thread_multiput   ❚❚ 7650.38 keys/second (10457ms, 2.5x speedup)
single_thread_multiget  ❚ 3199.49 keys/second (25004ms)
multi_thread_multiget   ❚❚❚ 10380.2 keys/second (7707ms, 3.2x speedup)
single_thread_put       ❚ 3482.05 keys/second (22975ms)
multi_thread_put        ❚❚❚ 11187.2 keys/second (7151ms, 3.2x speedup)
single_thread_get       ❚ 2949.2 keys/second (27126ms)
multi_thread_get        ❚❚❚ 10989 keys/second (7280ms, 3.7x speedup)
```

注意到 `Performance Test Results` 提供了两份结果，后一份是在 `TSAN=1` 的情况下，启用了 Thread Sanitizers 的测试结果，会发现性能下降了接近十倍，在启用的情况下，我的 A5 `kvstore_performance_tests` 实际上是无法通过的，TLE。

![CS300_project_5_perf_result.png](/images/CS300_project_5_perf_result.png)

## 后话

整个 Project 5 显然是比较简单的，一点也不复杂，提供的配套代码已经很完善了，对 TODO 进行小修小补填充就算完成了，并没有多少工作量。

有个机制很奇怪，KVStore 节点里面是按 hash 分桶的，但是 shardcontroller 却是按字典序直接分片的，伴随着的是一大坨 `split_into`。我举得直接一点，将 桶直接分配到多个节点上显然会更简洁一点，也更适应 Extra Credit 提出的动态分片的需求。

头一次知道有 TSAN 这种东西，查了下大致是通过线程对内存的读写顺序判断数据竞态，以及锁的加解和信号量等相关的并发控制来判断是否是同步执行的，筛选掉安全的操作，对潜在的竞态进行报告。我挺好奇它具体如果进行判断的，以及测试框架如何判断没有出现竞态等并发问题。

> 以及为什么 CMU 15-445 没有告诉我有这种工具，只说了有 ASAN 来检测内存泄露...我想可能应该有用的啊

以及实际上我觉得缺少了很多内容，虽然它也不是专门学分布式系统的课程：

- 控制器只下发配置，并不考虑执行效果。服务端通过循环请求来获取配置，没有回报生效后才客户端可见的功能，而客户端本身却直接根据最新配置去请求服务端。在服务端与服务端交换数据的期间，会出现数据不可达的情况

- 没有考虑数据交换的耗时，交换期间会直接锁死整个节点，无法处理请求

忽略太多东西了，所以并没有特别多学到什么，一天 5A 一天 5B，摸摸鱼就完成了。

Project 5 实现见：[z0z0r4/cs300-s26-projects](https://github.com/z0z0r4/cs300-s26-projects/tree/main/kvstore)

TODO：寻找一个正式的分布式课程