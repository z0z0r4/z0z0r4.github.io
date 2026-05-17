---
title: CMU 15445 Project 0
sticky: false
mermaid: false
date: 2026-05-06 13:39:12
tags:
  - CMU-15-445
  - study-notes
  - Database
categories:
  - study-notes
  - CS
  - Database
cover:
comments:
copyright:
sponsor:
---

完成 CMU 15445 的 Project 0。

<!-- more -->

```
vscode ➜ /workspaces/bustub/build (2025fall) $ ./test/count_min_sketch_test         
Running main() from gmock_main.cc
[==========] Running 13 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 13 tests from CountMinSketchTest
[ RUN      ] CountMinSketchTest.BasicTest1
[       OK ] CountMinSketchTest.BasicTest1 (0 ms)
[ RUN      ] CountMinSketchTest.BasicTest2
[       OK ] CountMinSketchTest.BasicTest2 (10 ms)
[ RUN      ] CountMinSketchTest.EdgeTest1
[       OK ] CountMinSketchTest.EdgeTest1 (0 ms)
[ RUN      ] CountMinSketchTest.EdgeTest2
[       OK ] CountMinSketchTest.EdgeTest2 (0 ms)
[ RUN      ] CountMinSketchTest.MoveTest
[       OK ] CountMinSketchTest.MoveTest (0 ms)
[ RUN      ] CountMinSketchTest.ClearTest
[       OK ] CountMinSketchTest.ClearTest (0 ms)
[ RUN      ] CountMinSketchTest.MergeTest
[       OK ] CountMinSketchTest.MergeTest (0 ms)
[ RUN      ] CountMinSketchTest.ParallelTest
[       OK ] CountMinSketchTest.ParallelTest (397 ms)
[ RUN      ] CountMinSketchTest.ComplexParallelTest
[       OK ] CountMinSketchTest.ComplexParallelTest (30 ms)
[ RUN      ] CountMinSketchTest.TopKBasicTest
[       OK ] CountMinSketchTest.TopKBasicTest (0 ms)
[ RUN      ] CountMinSketchTest.TopKDynamicTest
[       OK ] CountMinSketchTest.TopKDynamicTest (3 ms)
[ RUN      ] CountMinSketchTest.TopKComprehensiveTest
[       OK ] CountMinSketchTest.TopKComprehensiveTest (58 ms)
[ RUN      ] CountMinSketchTest.ContentionRatioTest
This test will see how your CMS insertion performance differs to one that is completely sequential.
If your submission timeout, segfault, or you didn't implement the lock-free version, we will manually deduct all concurrent test points.
<<< BEGIN
Multithreaded Insertion Time: 32262 29553 27340 33450 27455 
Serialized Insertion Time: 98618 86028 79813 82067 88202 
Speedup: 2.89703
>>> END
[       OK ] CountMinSketchTest.ContentionRatioTest (585 ms)
[----------] 13 tests from CountMinSketchTest (1089 ms total)

[----------] Global test environment tear-down
[==========] 13 tests from 1 test suite ran. (1089 ms total)
[  PASSED  ] 13 tests.
```