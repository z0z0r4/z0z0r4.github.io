---
title: CS144 Check6
sticky: false
mermaid: true
date: 2026-09-16 14:35:40
tags:
- study-notes
- CS144
categories:
- study-notes
- CS
- CS144
cover: /covers/pysio_router.svg
comments:
copyright:
sponsor:
---

CS144 Check6 --- Router

<!--more-->

封面由 [pysio](https://github.com/pysio2007) 提供的迷之路由器，下一篇有可爱全貌。

---

Check6 相对简单，由于只需要完成路由表，不涉及路由协议等，也没有性能要求，可以非常简单。

`Router` 管理多个 `NetworkInterface`，负责将每个 `NetworkInterface` 内收到后缓存于 `datagram_received` 内的数据包转发到正确的 `NetworkInterface`，根据 `add_route` 添加的路由规则进行转发。

而路由时遵循最长前缀匹配原则（Longest Prefix Match），例如 `192.168.1.0/24` 代表前缀长度为 24 的路由前缀，匹配时会优先匹配前缀长度更长的规则。

> 关于 [CIDR](https://zh.wikipedia.org/zh-cn/无类别域间路由) 的更多信息可以参考百科。

比如 `10.1.0.0/16` 和 `10.0.0.0/8`，如果数据包的目标地址是 `10.1.2.3`，则会优先匹配到 `10.1.0.0/16`。

唯一困难的地方在于如何快速找到匹配的路由规则，最简单的方式是直接用 `std::vector` 存储规则，查询时遍历所有路由规则，找到最长前缀匹配的规则。这里有实现 [feat: impl router](https://github.com/z0z0r4/minnow-winter-2025/commit/77b9d248a9c437302dbbd52c8ccf845dd9c2db0c)

> 然而没有附带的 Perf 测试，后续添加了一个

实际上会用 Trie 来实现，BSD 用 Radix Trie，而 Linux 在后续更进一步用 LC-trie。以下会提供一个包含 [Patricia Trie 的实现](https://github.com/z0z0r4/minnow-winter-2025/blob/11bf431a592eece31b16355660a86263c6124547/util/trie.hh)（似乎路径压缩的变体叫 Patricia）。

```cpp
#pragma once

#include <array>
#include <bit>
#include <cstdint>
#include <optional>
#include <stdexcept>
#include <utility>
#include <vector>

#include "debug.hh"

template<typename T>
class Trie
{
public:
  Trie() { nodes_.emplace_back(); }

  void insert( uint32_t address, uint8_t prefix_length, T data )
  {
    if ( prefix_length > 32 ) {
      throw std::invalid_argument( "Prefix length cannot be greater than 32 for IPv4 addresses." );
    }

    const uint32_t normalized_address = prefix_bits( address, prefix_length ); // Remove any bits beyond the prefix
    uint32_t current_node = 0; // Root node index 0
    uint32_t parent_node = invalid_node;
    uint8_t parent_bit = 0;

    while ( true ) {
      const Node current = nodes_[current_node];
      const uint8_t common_length = common_prefix_length( normalized_address, prefix_length, current );

      // 如果当前节点已经超过所需的前缀长度，则需要分裂当前节点和父节点之间，创建一个新的中间节点
      if ( common_length < current.prefix_length ) {
        const uint32_t split_node = static_cast<uint32_t>( nodes_.size() );
        Node split;
        split.prefix = prefix_bits( normalized_address, common_length );
        split.prefix_length = common_length;
        split.mask = mask_for( common_length );

        // 添加原来的节点到中间节点的子节点列表
        split.children[bit_at( current.prefix, common_length )] = current_node;

        // 创建 leaf_node，添加到中间节点的另一个子节点槽位，与 current_node 不同的 bit 位
        const uint32_t leaf_node = split_node + 1;
        split.children[bit_at( normalized_address, common_length )] = leaf_node;

        // 将新的中间节点添加进节点列表
        nodes_.push_back( std::move( split ) );

        // 将 leaf_node 添加到节点列表，并存储数据
        const uint32_t data_index = add_data( std::move( data ) );
        nodes_.push_back( Node { normalized_address,
                                 prefix_length,
                                 mask_for( prefix_length ),
                                 { invalid_node, invalid_node },
                                 data_index } );
        index_dirty_ = true;

        // 将中间节点连接到父节点的子节点列表中
        nodes_[parent_node].children[parent_bit] = split_node;
        return;
      }

      // 如果当前节点正好为所需的前缀长度，则添加 data 或者更新现有的 data
      if ( current.prefix_length == prefix_length ) {
        if ( current.data_index == invalid_node ) {
          nodes_[current_node].data_index = add_data( std::move( data ) );
        } else {
          data_[current.data_index] = std::move( data );
        }
        index_dirty_ = true; // 要注意重新构建 index 因为当前节点可能被添加 data 后有效，且在 /8 内，要加入 index
        return;
      }

      // 仍未抵达所需的前缀长度，寻找子节点继续向下遍历
      const uint8_t child_bit = bit_at( normalized_address, current.prefix_length );
      const uint32_t child_node = current.children[child_bit];
      // 子节点不存在，则创建一个新的子节点并添加数据
      if ( child_node == invalid_node ) {
        nodes_[current_node].children[child_bit] = static_cast<uint32_t>( nodes_.size() );
        const uint32_t data_index = add_data( std::move( data ) );
        nodes_.push_back( Node { normalized_address,
                                 prefix_length,
                                 mask_for( prefix_length ),
                                 { invalid_node, invalid_node },
                                 data_index } );
        index_dirty_ = true;
        return;
      }

      parent_node = current_node;
      parent_bit = child_bit;
      current_node = child_node;
    }
  }

  std::optional<T> search( uint32_t address ) const
  {
    const T* result = search_ptr( address );
    return result ? std::optional<T> { *result } : std::nullopt;
  }

  const T* search_ptr( uint32_t address ) const
  {
    if ( index_dirty_ ) {
      rebuild_index();
    }

    // 从 index 找到对应的桶的头节点，如果没有则会退为默认根节点 0
    const auto& entry = index_[address >> 24];
    uint32_t current_node = entry.node;
    uint32_t last_data_index = entry.data_index;

    while ( true ) {
      const Node& node = nodes_[current_node];

      // 规则不匹配
      if ( !matches( address, node ) ) {
        break;
      }

      // 如果当前节点有数据，则更新 last_data_index，说明找到一个规则
      if ( node.data_index != invalid_node ) {
        last_data_index = node.data_index;
      }

      // 已经匹配到底了，没有更细化的规则了，直接返回
      if ( node.prefix_length == 32 ) {
        break;
      }
      const uint32_t child = node.children[bit_at( address, node.prefix_length )];
      if ( child == invalid_node ) {
        break;
      }
      current_node = child;
    }
    return last_data_index == invalid_node ? nullptr : &data_[last_data_index].value();
  }

private:
  struct Node
  {
    uint32_t prefix {};
    uint8_t prefix_length {};
    uint32_t mask {}; // Generates by mask_for(prefix_length)
    std::array<uint32_t, 2> children { invalid_node, invalid_node };
    uint32_t data_index { invalid_node }; // invaild_node at data_index means no data
  };

  static constexpr uint32_t invalid_node = UINT32_MAX;
  std::vector<Node> nodes_ {};
  std::vector<std::optional<T>> data_ {};

  struct IndexEntry
  {
    uint32_t node { 0 };
    uint32_t data_index { invalid_node };
  };

  // Bucketed index for the first 8 bits of the address, allowing for faster lookups.
  mutable std::array<IndexEntry, 256> index_ {};

  // Once a new node is added, the index becomes dirty and needs to be rebuilt before the next search.
  mutable bool index_dirty_ { true };

  // Add data into data_ and return the index of the newly added data.
  uint32_t add_data( T data )
  {
    data_.emplace_back( std::move( data ) );
    return static_cast<uint32_t>( data_.size() - 1 );
  }

  // Generates a mask for the given prefix length. For example, a length of 24 would produce a mask of 0xFFFFFF00.
  static uint32_t mask_for( const uint8_t length )
  { return length == 0 ? 0 : ( length == 32 ? UINT32_MAX : ~UINT32_C( 0 ) << ( 32 - length ) ); }

  // Returns the prefix of the given address limited to the specified length.
  // Example: For an address of 192.128.1.4 (0xC0800104) and a length of 24, this function would return 0xC0800100.
  static uint32_t prefix_bits( const uint32_t address, const uint8_t length )
  { return address & mask_for( length ); }

  // Returns the bit at the specified position. For example, for an address of 192.168.1.1 (0xC0A80101) and a position of 0, this function would return 1 (the most significant bit).
  static uint8_t bit_at( const uint32_t address, const uint8_t position )
  { return static_cast<uint8_t>( ( address >> ( 31 - position ) ) & 1U ); }

  // Calculates the length of the common prefix between the given address and the node's prefix, limited by the provided length.
  static uint8_t common_prefix_length( const uint32_t address, const uint8_t length, const Node& node )
  {
    const auto common_bits = static_cast<uint8_t>( std::countl_zero( address ^ node.prefix ) );
    return std::min( length, std::min( node.prefix_length, common_bits ) );
  }

  // Is the given address equally match node prefix
  static bool matches( const uint32_t address, const Node& node ) { return ( address & node.mask ) == node.prefix; }

  void rebuild_index() const
  {
    for ( uint32_t bucket = 0; bucket < index_.size(); ++bucket ) {
      const uint32_t address = bucket << 24;
      uint32_t current_node = 0;
      uint32_t data_index = nodes_[current_node].data_index;

      uint32_t bucket_range_start = bucket;
      uint32_t bucket_range_end = bucket;

      while ( true ) {
        const Node& node = nodes_[current_node];

        // 细粒度大于 /8 的节点不加入 index，直接跳出
        if ( node.prefix_length >= 8 ) {
          break;
        }

        // 向下找 child，prefix_length 越接近 8 越好
        const uint32_t child = node.children[bit_at( address, node.prefix_length )];
        if ( child == invalid_node || nodes_[child].prefix_length > 8 ) {
          // 显然，如果 child 不存在或者 child 的 prefix_length 大于 8，则不再继续向下找了，当前 node 以下的
          // bucket 都可以设置为当前 node，而不是只设置当前 bucket
          bucket_range_end
            = node.prefix_length < 8 ? bucket + ( ( 1 << ( 8 - node.prefix_length - 1 ) ) - 1 ) : bucket;
          break;
        }

        if ( !matches( address, nodes_[child] ) ) {
          // child 不在该 bucket
          // TODO: 其实这里也可以算出 bucket_range_end，与 child 重合的前缀部分的 index 可以直接设置为当前 node 
          break;
        }

        // 设置为 current_node，继续向下找
        current_node = child;
        if ( nodes_[current_node].data_index != invalid_node ) {
          data_index = nodes_[current_node].data_index;
        }
      }

      // 设置 bucket range 下的所有 bucket
      for ( uint32_t b = bucket_range_start; b <= bucket_range_end; ++b ) {
        // 允许记录没有数据的节点索引，但是只保存有效规则的 data_index
        index_[b] = { current_node, data_index };
      }
      bucket = bucket_range_end; // 跳过已经设置的 bucket
    }

    index_dirty_ = false;
  }
};
```

其中将 `/8` 的前缀作为索引，存储在 `index_` 中，查询时先通过 `index_` 找到对应的节点，然后再向下查找，避免每次从根节点开始查找的开销。以及将 `data` 单独存储在 `data_` vector 中，节点只存储索引，优化内存布局。

> TODO: 更多关于 `std::move` 的用法，注意到移动语义有可观的提升

此外每传递数据包时，要记得将数据包的 TTL 减 1，如果 TTL 为 0，则丢弃该数据包。