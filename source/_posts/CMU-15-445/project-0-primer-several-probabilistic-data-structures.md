---
title: "CMU 15-445 Project 0 Primer: Several Probabilistic Data Structures"
sticky: false
mermaid: false
date: 2026-06-07 14:59:06
tags:
  - study-notes
  - CS
  - CMU 15-445
categories:
  - study-notes
  - CMU 15-445
cover: /covers/cmu_15445_project_0_primer.png
comments:
copyright:
sponsor:
---

关于 CMU 15-445 Project 0 Primer，记录几个概率性数据结构。

<!-- more -->

最近一直在看 [CMU 15-445](https://15445.courses.cs.cmu.edu/fall2025) 的 [YT 课程视频](https://www.youtube.com/playlist?list=PLSE8ODhjZXjYMAgsGH-GtY5rJYZ6zjsd5)（[B站中文精翻](https://www.bilibili.com/video/BV1otB4BaE9y)）和完成 [BusTub 项目](https://github.com/cmu-db/bustub)。我觉得课程很好，但视频内容经常需要辅助 AI 具体了解才能看懂，Bustub 项目也**非常**有挑战性~~好难~~。总体上是我太菜，课程非常好。

[Andy Pavlo](https://github.com/apavlo) 和他的助教们，每年都会更新 BusTub 的内容（因为 BusTub 是公开的，大概是为了避免抄袭、以及提前完成？），按 [Git History](https://github.com/cmu-db/bustub/graphs/contributors?from=2019%2F9%2F1&to=2026%2F5%2F31) 是秋季（暑假）更新 BusTub，春季基本不会动。

![BusTub Contributors](/images/cmu_15445/bustub_contributors.png)

---

以下实现了 2025 和 2024 的 Project 0 Primer 的数据结构：

- [Count-min sketch](https://15445.courses.cs.cmu.edu/fall2025/project0/)

- [HyperLogLog](https://15445.courses.cs.cmu.edu/fall2024/project0/)

以及最基础的 Bloom Filter 和可扩展的 Scalable Bloom Filter。

> 由于 [Trie](https://15445.courses.cs.cmu.edu/fall2023/project0/) 和 Skip List 感觉会比较麻烦，今天先不写。

## Bloom Filter

布隆过滤器可用于检索一个元素是否在一个集合中，具有空间效率高和查询速度快的特点，但存在一定的假阳率，取决于哈希函数的数量和过滤器占用空间的大小。

若用哈希表，可以精确的判断，原因在于会处理冲突的情况。但如果不处理冲突，只要有一个元素映射到某个位置，就设置这个位置被占用，那么其他映射到相同位置的，不存在的元素就会被误判，这就是假阳率的来源。

那么进一步改进，则可以使用多个哈希函数，只有当所有对应位置都被占用时，才认为元素存在，以降低假阳率。

插入和查询的时间复杂度都是 $O(k)$，可惜缺陷在于无法删除元素，以及假阳率的存在（但这是不可避免的，Andy 也总是在课程里面说没有免费的午餐）。

---

对于一个实际不存在的元素，当其每个对应的 $k$ 个位置全部都刚好被置为了 1 时，就会被误判为存在，又因为假设哈希函数是均匀分布的，所以可以独立考虑每个位置被置为 1 的概率。

其中 $m$ 是 Bloom Filter 的位数组大小，$n$ 是插入的元素数量，$k$ 是哈希函数的数量。

插入一个元素时，对于一个特定位置，被单一哈希函数选中的概率是，

$$\frac{1}{m}$$

没有选中的概率则是 

$$1 - \frac{1}{m}$$

插入一个元素需要经过 $k$ 个哈希函数的置 1，所以某个位置仍然为 0 的概率是 

$$(1 - \frac{1}{m})^k$$

那么插入 $n$ 个元素后，某个位依然为 0 的概率是

$$ P_0 = \left(1 - \frac{1}{m}\right)^{kn}$$

根据重要极限，$$\lim_{m \to \infty} \left(1 - \frac{1}{m}\right)^{m} = e^{-1}$$

所以对于较大的 $m$ 可以近似为（在指数补一个 $1/m$）：

$$ P_0 \approx e^{-\frac{kn}{m}} $$

所以某个位置被置为 1 的概率是

$$ P_1 = 1 - P_0 \approx 1 - e^{-\frac{kn}{m}} $$

则误判时，$k$ 个位置都被置为 1 的概率是

$$ P_{fp} = P_1^k \approx \left(1 - e^{-\frac{kn}{m}}\right)^k $$

---

一般来说，预期元素数量 $n$ 和 位数组大小 $m$ 是给定的，那么应该向最小化 $ P_{fp} $ 的方向找出 $k$ 的最优解。

$$ \ln P_{fp} = k \ln \left(1 - e^{-\frac{kn}{m}}\right) $$

取 $x = e^{-\frac{kn}{m}}$，则 $k = -\frac{m}{n} \ln x$，代入上式：

$$ \ln P_{fp} = -\frac{m}{n} \ln x \cdot \ln (1 - x) $$

实质上是求 $f(x) = \ln x \cdot \ln (1 - x)$ 的最大值，使得 $P_{fp}$ 最小。

易得 $f(x)$ 在 $x = 0.5$ 处取得最大值，此时 $k = -\frac{m}{n} \ln 0.5 = \frac{m}{n} \ln 2$。

所以 $$ k^* = \frac{m}{n} \ln 2 $$

> 当然在实际应用中，$k$ 只能取整数

---

Bloom Filter 无法自动拓展，随着元素数量的增加，假阳率会逐渐升高。为了解决这个问题，可以使用 Scalable Bloom Filter，它通过维护多个 Bloom Filter 来实现动态扩展。

![Bloom filter false positive probability](/images/cmu_15445/Bloom_filter_fp_probability.png)

当一个 Bloom Filter 的容量达到预设的阈值时，Scalable Bloom Filter 会创建一个新的 Bloom Filter，并将新元素插入到新的 Bloom Filter 中。

查询时，Scalable Bloom Filter 会依次查询所有 Bloom Filter，只要其中一个 Bloom Filter 返回存在，就认为元素存在。

创建新 Bloom Filter 时，可以设置一个缩放因子 $r$，每次创建新 Bloom Filter 时，其大小是前一个 Bloom Filter 的 $r$ 倍（以免 filters 数量线性增长，查询时要遍历检查的 filter 太多）。

以下是 Bloom Filter 的实现（完整见 [Bloom Filter Gist](https://gist.github.com/z0z0r4/915e4343ee88858b5a4af206a8a06cfb)）：

```cpp
template <typename T>
class BloomFilter {
public:
    BloomFilter(const int filter_size, const int hash_count)
        : filter_size_(filter_size), hash_count_(hash_count), inserted_count(0) {
        bits_.assign(filter_size_, false);
    }

    void Insert(const T &value) {
        for (int i = 0; i < hash_count_; i++) {
            const auto idx = double_hash<T>(value, i, filter_size_);
            bits_[idx] = true;
        }
        inserted_count++;
    }

    auto Lookup(const T &value) -> bool {
        for (int i = 0; i < hash_count_; i++) {
            const auto idx = double_hash<T>(value, i, filter_size_);
            if (!bits_[idx]) {
                return false;
            }
        }
        return true;
    }

    auto GetCapacity() const -> int {
        return static_cast<int>(filter_size_ * 0.693 / hash_count_);
    }

    auto GetFilterSize() const -> int {
        return filter_size_;
    }

    auto GetHashCount() const -> int {
        return hash_count_;
    }

    auto GetInsertedCount() const -> int {
        return inserted_count;
    }

private:
    int filter_size_;
    int hash_count_;
    int inserted_count;
    std::vector<bool> bits_;
};

template <typename T>
class ScalableBloomFilter {
public:
    ScalableBloomFilter(const double capacity_threshold = 0.8) : capacity_threshold_(capacity_threshold) {
        filters_.emplace_back(base_filter_size_, base_hash_count_);
    }

    void Insert(const T &value) {
        const int capacity = filters_.back().GetCapacity();
        const int items_in_current_filter_ = filters_.back().GetInsertedCount();
        const int current_filter_size_ = filters_.back().GetFilterSize();
        const int current_hash_count_ = filters_.back().GetHashCount();

        if (items_in_current_filter_ >= capacity * capacity_threshold_) {
            filters_.emplace_back(current_filter_size_ * 2, current_hash_count_ + 1);
        }

        filters_.back().Insert(value);
    }

    auto Lookup(const T &value) -> bool {
        for (auto &filter: filters_) {
            if (filter.Lookup(value)) {
                return true;
            }
        }
        return false;
    }

    auto GetFilterCount() const -> int {
        return filters_.size();
    }

private:
    std::vector<BloomFilter<T>> filters_;
    int base_filter_size_{1024};
    int base_hash_count_{8};
    double capacity_threshold_;
};
```

可以参考 [Wikipedia Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter)

---

## Count-min Sketch

上面的 Bloom Filter 是用来判断元素是否存在的，而 [Count-min Sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) 则是用来估计元素出现的次数的。

CMU 15-445 的课程视频里面提到的一个例子是网站 IP 访问量估计，其他情况类似。

Count-min Sketch 使用一个二维数组来存储计数器。

假设二维数组的行数为 $d$，有 $d$ 个哈希函数，每个哈希函数对应一行；列数为 $w$，哈希值取模 $w$。

每个元素添加时，计算 $d$ 个哈希函数映射到不同的行，取其计算出来的列索引，在对应位置的计数器 +1。（总共更新 $d$ 个计数器）

查询元素时，如上找到 $d$ 个计数器，取其中的最小值作为元素添加的次数估计。

---

很显然，由于不同元素可能更新同一个计数器，计数器的值必然是等于或者高估的，所以取所有计数器的最小值作为估计值，是最接近真实值的。

直觉上，二维数组的大小直接决定误差大小。准确的来说，CM Sketch 的误差由两个参数来描述：精度误差 $\epsilon$ 和错误概率 $\delta$。

精度误差指的是估计值与真实值之间的允许误差比例，例如 $\epsilon = 0.01$ 表示估计值与真实值之间的误差不超过 1%。

错误概率 $\delta$ 则是指估计值超过精度误差的概率，例如 $\delta = 0.05$ 表示有 5% 的概率估计值会超过精度误差。

- 宽度 $w = \lceil \frac{e}{\epsilon} \rceil$ 

- 深度 $d = \lceil \ln(\frac{1}{\delta}) \rceil$

> 此处不讨论 $w$ 和 $d$ 的公式哪来的，~~看不懂~~

---

以下是 Count-min Sketch 的实现（完整见 [Count-min sketch Gist](https://gist.github.com/z0z0r4/a25f0f31165a16147760be4b1a149bab)）：

> 基于 Primer 改的，有 `TopK` 的功能，以及 thread-safe 实现 `Insert`

```cpp
#include "count_min_sketch.h"

#include <algorithm>
#include <atomic>
#include <stdexcept>
#include <string>

/**
 * Constructor for the count-min sketch.
 *
 * @param width The width of the sketch matrix.
 * @param depth The depth of the sketch matrix.
 * @throws std::invalid_argument if width or depth are zero.
 */
template <typename KeyType>
CountMinSketch<KeyType>::CountMinSketch(uint32_t width, uint32_t depth)
    : width_(width), depth_(depth), sketch_(std::make_unique<std::atomic<size_t>[]>(width * depth)) {
  if (width == 0 || depth == 0) {
    throw std::invalid_argument("Width and depth must be greater than zero.");
  }
  for (size_t i = 0; i < depth_ * width_; ++i) {
    sketch_[i].store(0, std::memory_order_relaxed);
  }
  // Initialize seeded hash functions
  hash_functions_.reserve(depth_);
  for (size_t i = 0; i < depth_; i++) {
    hash_functions_.push_back(this->HashFunction(i));
  }
}

template <typename KeyType>
CountMinSketch<KeyType>::CountMinSketch(CountMinSketch &&other) noexcept : width_(other.width_), depth_(other.depth_) {
  sketch_ = std::move(other.sketch_);
  hash_functions_ = std::move(other.hash_functions_);
}

template <typename KeyType>
auto CountMinSketch<KeyType>::operator=(CountMinSketch &&other) noexcept -> CountMinSketch & {
  for (size_t i = 0; i < depth_ * width_; ++i) {
    sketch_[i].store(other.sketch_[i].load(std::memory_order_relaxed), std::memory_order_relaxed);
  }
  hash_functions_ = std::move(other.hash_functions_);
  return *this;
}

template <typename KeyType>
void CountMinSketch<KeyType>::Insert(const KeyType &item) {
  for (size_t row_index = 0; row_index < depth_; row_index++) {
    size_t col_index = hash_functions_[row_index](item);
    sketch_[row_index * width_ + col_index].fetch_add(1, std::memory_order_relaxed);
  }
}

template <typename KeyType>
void CountMinSketch<KeyType>::Merge(const CountMinSketch<KeyType> &other) {
  if (width_ != other.width_ || depth_ != other.depth_) {
    throw std::invalid_argument("Incompatible CountMinSketch dimensions for merge.");
  }
  for (size_t i = 0; i < depth_ * width_; ++i) {
    sketch_[i].fetch_add(other.sketch_[i].load(std::memory_order_relaxed), std::memory_order_relaxed);
  }
}

template <typename KeyType>
auto CountMinSketch<KeyType>::Count(const KeyType &item) const -> uint32_t {
  size_t min_count = SIZE_MAX;
  for (size_t row_index = 0; row_index < depth_; row_index++) {
    size_t col_index = hash_functions_[row_index](item);
    size_t value = sketch_[row_index * width_ + col_index].load(std::memory_order_relaxed);
    min_count = std::min(min_count, value);
  }
  return static_cast<uint32_t>(min_count);
}

template <typename KeyType>
void CountMinSketch<KeyType>::Clear() {
  for (size_t i = 0; i < depth_ * width_; ++i) {
    sketch_[i].store(0, std::memory_order_relaxed);
  }
}

template <typename KeyType>
auto CountMinSketch<KeyType>::TopK(uint16_t k, const std::vector<KeyType> &candidates)
    -> std::vector<std::pair<KeyType, uint32_t>> {
  std::vector<std::pair<KeyType, uint32_t>> result;
  result.reserve(candidates.size());
  for (const auto &item : candidates) {
    result.emplace_back(item, Count(item));
  }
  std::sort(result.begin(), result.end(), [](const auto &a, const auto &b) { return a.second > b.second; });
  if (result.size() > k) {
    result.resize(k);
  }
  return result;
}

// Explicit instantiations for all types used in tests
template class CountMinSketch<std::string>;
template class CountMinSketch<int64_t>;
template class CountMinSketch<int>;
```

```cpp
#pragma once

#include <atomic>
#include <cstdint>
#include <functional>
#include <memory>
#include <utility>
#include <vector>

/**
 * @brief Combines two hash values to create a new hash.
 * Uses the boost hash_combine algorithm.
 */
inline size_t CombineHashes(size_t h1, size_t h2) {
  return h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2));
}

template <typename KeyType>
class CountMinSketch {
 public:
  /** @brief Constructs a count-min sketch with specified dimensions
   * @param width Number of buckets
   * @param depth Number of hash functions
   */
  explicit CountMinSketch(uint32_t width, uint32_t depth);

  CountMinSketch() = delete;                                            // Default constructor deleted
  CountMinSketch(const CountMinSketch &) = delete;                      // Copy constructor deleted
  auto operator=(const CountMinSketch &) -> CountMinSketch & = delete;  // Copy assignment deleted

  CountMinSketch(CountMinSketch &&other) noexcept;                      // Move constructor
  auto operator=(CountMinSketch &&other) noexcept -> CountMinSketch &;  // Move assignment

  /**
   * @brief Inserts an item into the count-min sketch
   *
   * @param item The item to increment the count for
   * @note Updates the min-heap at the same time
   */
  void Insert(const KeyType &item);

  /**
   * @brief Gets the estimated count of an item
   *
   * @param item The item to look up
   * @return The estimated count
   */
  auto Count(const KeyType &item) const -> uint32_t;

  /**
   * @brief Resets the sketch to initial empty state
   *
   * @note Clears the sketch matrix, item set, and top-k min-heap
   */
  void Clear();

  /**
   * @brief Merges the current CountMinSketch with another, updating the current sketch
   * with combined data from both sketches.
   *
   * @param other The other CountMinSketch to merge with.
   * @throws std::invalid_argument if the sketches' dimensions are incompatible.
   */
  void Merge(const CountMinSketch<KeyType> &other);

  /**
   * @brief Gets the top k items based on estimated counts from a list of candidates.
   *
   * @param k Number of top items to return (will be capped at initial k)
   * @param candidates List of candidate items to consider for top k
   * @return Vector of (item, count) pairs in descending count order
   */
  auto TopK(uint16_t k, const std::vector<KeyType> &candidates) -> std::vector<std::pair<KeyType, uint32_t>>;

 private:
  /** Dimensions of the count-min sketch matrix */
  uint32_t width_;  // Number of buckets for each hash function
  uint32_t depth_;  // Number of independent hash functions
  /** Pre-computed hash functions for each row */
  std::vector<std::function<size_t(const KeyType &)>> hash_functions_;

  constexpr static size_t SEED_BASE = 15445;

  /**
   * @brief Seeded hash function generator
   *
   * @param seed Used for creating independent hash functions
   * @return A function that maps items to column indices
   */
  inline auto HashFunction(size_t seed) -> std::function<size_t(const KeyType &)> {
    return [seed, this](const KeyType &item) -> size_t {
      auto h1 = std::hash<KeyType>{}(item);
      auto h2 = CombineHashes(seed, SEED_BASE);
      return CombineHashes(h1, h2) % width_;
    };
  }

  std::unique_ptr<std::atomic<size_t>[]> sketch_;  // size = depth_ * width_
};
```

## HyperLogLog

HyperLogLog 与以上两种的生态位也不同，目的是估计一个集合中不同元素的数量（基数估计）。

若要精确统计，则需要记录所有元素以供查询是否重复，但这会占用大量内存。

考虑一个抛硬币的情景，可以发现当第四次才抛出正面，前面三次都是反面时，那么这个序列的概率是 $\frac{1}{16}$。那么逆向过来可以理解为：要想得出这个序列，平均需要抛 16 次硬币。

那么对于元素取 Hash，记录所有元素的前导零的最大值 $R$，由于特定比特位只有 0 和 1 两个可能，就可以估计出不同元素的数量大约是 $2^(R+1)$。

但是很显然，单次伯努利试验的随机性太高，容易因为某个极端哈希值（例如一开始就连续出现很多个 0）导致估算结果出现巨大偏差。

为了降低误差，HyperLogLog 将哈希值分成 $m = 2 ^{b}$ 个桶（有 $b$ 个位用于分桶），每个桶记录前导零的最大值 $R_i$（前导零不算用于分桶的 $b$ 位）。

计算 HyperLogLog 的估计值时，先计算每个桶的 $2^{R_i}$ 的估计值的调和平均值，乘以总共 $m$ 个分桶。

实际上看，会再乘一个修正因子 $\alpha _{m}$ 来调整估计值，具体的修正因子取值可以参考 [HyperLogLog Wikipedia](https://en.wikipedia.org/wiki/HyperLogLog#Practical_considerations) 的相关内容。

> HLL 相比 LL（LogLog）算法的改进：LL 计算几何平均值，而 HLL 则是计算调和平均值，这样可以更好地抵消极端值的影响。

$$\displaystyle Z= {(\sum _{j=1}^{m}{2^{-M[j]}})}^{-1}$$

$$\displaystyle E=\alpha _{m}m^{2}Z$$

其中 $M[j]$ 就是分桶的前导零的最大值，$Z$ 是分桶的调和平均值，$E$ 则是最终的估计值。

[实现](https://gist.github.com/z0z0r4/3ee6cc408c958b760b39a19a13d17263)如下：

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <cmath>

using hash_t = std::size_t;

template <typename T>
class HyperLogLog {
    public:
    HyperLogLog(size_t b): b_(b), m_(1 << b), registers(m_, 0) {}

    void Add(const T& value) {
        hash_t hash = std::hash<T>{}(value);
        size_t index = hash & (m_ - 1);

        hash_t remaining = hash >> b_;
        int rank;
        if (remaining != 0) {
            int leading_zeros = __builtin_clzll(remaining) - static_cast<int>(b_);
            rank = leading_zeros + 1;
        } else {
            // 高位全为 0，前导零为最大有效位数
            rank = (sizeof(hash_t) * 8 - b_) + 1;
        }

        registers[index] = std::max(registers[index], rank);
    }

    auto ComputeCardinality() -> double {
        constexpr auto constant = 0.79402;

        double sum = 0;
        for (auto index = 0; index < m_; index++) {
            sum += std::pow(2.0, -registers[index]);
        }

        return constant * (m_ * (m_ / sum));
    }

    auto Merge(const HyperLogLog& other) {
        if (b_ != other.b_) {
            throw std::invalid_argument("HyperLogLog instances must have the same b value to merge.");
        }

        for (size_t i = 0; i < m_; i++) {
            registers[i] = std::max(registers[i], other.registers[i]);
        }
    }

private:
    size_t b_;
    size_t m_;
    std::vector<int> registers;
};

std::vector<std::string> generate(const int count, const std::string &prefix = "item") {
    std::vector<std::string> res;
    res.reserve(count);
    for (int i = 0; i < count; ++i) {
        res.push_back(prefix + std::to_string(i));
    }
    return res;
}

int main () {
    HyperLogLog<std::string>hll(14);
    auto items = generate(100000000);
    for (const auto& item : items) {
        hll.Add(item);
    }

    std::cout << "Estimated cardinality: " << hll.ComputeCardinality() << std::endl;
}
```

结果为：

```
Estimated cardinality: 1.11156e+08
```

> 哈希函数的质量很重要，用之前 Bloom Filter 的那个 [D. E. Knuth 的简单 Hash](https://github.com/greenplum-db/gpos/blob/b53c1acd6285de94044ff91fbee91589543feba1/libgpos/src/utils.cpp#L126) 比 `std::hash` 的误差会大不小。但不想花时间在处理哈希上，之前的就没改。

此外，如果考虑时间窗口，比如通过时间段内的访问用户数量（日活、月活），可以维护多个 HyperLogLog 实例来实现时间窗口的滑动，每个实例对应一个时间段。当时间窗口滑动时，旧的实例被丢弃，新的实例被创建。