---
title: CS144 TCP Check3&4
sticky: false
mermaid: true
date: 2026-09-22 08:14:05
tags:
- study-notes
- CS144
categories:
- study-notes
- CS
- CS144
cover: /covers/TCP_connection_establishment.png
comments:
copyright:
sponsor:
---

CS144 TCP Receiver and Sender Check3&4

<!--more-->

封面来自 [TCP_connection_establishment.svg](https://en.wikipedia.org/wiki/File:TCP_connection_establishment.svg)

---

## Overview

这两个 Check 都围绕着 TCP 展开，分别实现 `Receiver` 和 `Sender` 的功能。

但是必须要注意到，TCP 的数据包只有一个格式（如下），双方的关系是 Peer-to-Peer 而不是 Client-Server 的关系，这意味着每个 Peer 都在同时扮演着 Sender 和 Receiver 的角色，TCP 是全双工协议。

## Header Format

[Header Format](https://www.rfc-editor.org/rfc/rfc9293.html#name-header-format)

```
    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |          Source Port          |       Destination Port        |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                        Sequence Number                        |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                    Acknowledgment Number                      |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |  Data |       |C|E|U|A|P|R|S|F|                               |
   | Offset| Rsrvd |W|C|R|C|S|S|Y|I|            Window             |
   |       |       |R|E|G|K|H|T|N|N|                               |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |           Checksum            |         Urgent Pointer        |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                           [Options]                           |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                                                               :
   :                             Data                              :
   :                                                               |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

          Note that one tick mark represents one bit position.
```

其中 `Receiver` 接收 `TCPSenderMessage`，能够发送 `TCPReceiverMessage`，而 `Sender` 接收 `TCPReceiverMessage`，能够发送 `TCPSenderMessage`。

```cpp
struct TCPReceiverMessage
{
  std::optional<Wrap32> ackno {};
  uint16_t window_size {};
  bool RST {};
};

struct TCPSenderMessage
{
  Wrap32 seqno { 0 };

  bool SYN {};
  std::string payload {};
  bool FIN {};

  bool RST {};
};
```

但是如上 Header Format 所示，实际上是每次 `Sender` 触发 `push` 时，将其 `TCPSenderMessage` 与即时从 `Receiver` 生成的 `TCPReceiverMessage`，合并为一条 `TCPMessage` 发送出去的。

> 以下是将 `TCPSenderMessage` 与 `TCPReceiverMessage` 序列化为一条 `TCPMessage` 的实现

```cpp

// A TCPMessage (a concept used only in CS144) models the full
// messages sent between TCP endpoints, omitting the multiplexing
// information and checksum.
struct TCPMessage
{
  Ref<TCPSenderMessage> sender {};
  Ref<TCPReceiverMessage> receiver {};
};

// A TCPSegment represents a complete (STD 7 / RFC 9293) TCP segment.
// It includes a TCPMessage plus the UDP-like information included in the TCP header.
struct TCPSegment
{
  TCPMessage message {};
  UserDatagramInfo udinfo {};

  void parse( Parser& parser, uint32_t datagram_layer_pseudo_checksum );
  void serialize( Serializer& serializer ) const;

  void compute_checksum( uint32_t datagram_layer_pseudo_checksum );
};

void TCPSegment::serialize( Serializer& serializer ) const
{
  serializer.integer( udinfo.src_port );
  serializer.integer( udinfo.dst_port );
  serializer.integer( Wrap32Serializable { message.sender->seqno }.raw_value() );
  serializer.integer( Wrap32Serializable { message.receiver->ackno.value_or( Wrap32 { 0 } ) }.raw_value() );
  serializer.integer( uint8_t { ( HEADER_LENGTH >> 2 ) << 4 } ); // data offset
  const bool reset = message.sender->RST or message.receiver->RST;
  const uint8_t flags = ( message.receiver->ackno.has_value() ? 0b0001'0000U : 0 ) | ( reset ? 0b0000'0100U : 0 )
                        | ( message.sender->SYN ? 0b0000'0010U : 0 ) | ( message.sender->FIN ? 0b0000'0001U : 0 );
  serializer.integer( flags );
  serializer.integer( message.receiver->window_size );
  serializer.integer( udinfo.cksum );
  serializer.integer( uint16_t { 0 } ); // urgent pointer
  serializer.buffer( message.sender->payload );
}
```

## Sequence Number

了解到这，我们可以开始看看 `seqno` 和 `ackno` 是什么：

- `seqno`: 表示发送方发送的第一个字节的序号，其中 `SYN` 和 `FIN` 都会占用一个字节的序号
- `ackno`: 表示接收方期望收到的下一个字节的序号（比如发出 ABC 只收到 BC，ackno 依旧应该期望 A）

> Check 里面专门讲了如何将 `seqno` (uint32_t) 和 Absolute Sequence Number (uint64_t) 进行轮转翻译，但是这里不赘述

有了这两个字段，最简单的，我们就可以开始传递信息了：

Sender 发送：seqno = 0, payload = "Hello, World!"

Receiver 回应：ackno = 13

...

Sender 发送：seqno = 114, payload = "FIN, Good bye!"

Receiver 回应：ackno = 128

> 这里显然缺少 EOF，但是 FIN 相关在 SYN 之后再说。下面是 SYN

注意到，我们一开始双方默认了共识 seqno = 0，所以在开始发送数据之前，没有额外的协商环节。但是考虑到一个端口可能有多个 TCP 连接（四元组 `<source_ip, source_port, destination_ip, destination_port>` 区分一个连接，source 相同，dest 不同是可以的），如果大家的 ISN（Initial Sequence Number）都一样，那么无法区分不同的连接，所以我们需要在 `uint32_t` 内随机选择一个 ISN，然后通告给另一侧。这样就在 TCP 连接开始时，要新增一个协商环节，如封面：

![TCP 3-Way Handshake](/covers/TCP_connection_establishment.png)

## SYN

引入 SYN 标志，当 SYN 被置位时，`seqno` 被设置为 ISN，后续继续递增。（注意是 Sender 向 Receiver 发送 SYN 指定 ISN，而不是反过来）

> 以上内容还是 C/S 模式

那么进一步考虑全双工，双方 Sender 都要设置自己的 ISN，所以第一次是发起 TCP 的一侧发出 SYN，然后另一侧回复 ACK 的同时，发送另一侧的 Sender 的 SYN，即 SYN + ACK，最后发起 TCP 侧再回复 ACK，这样就完成了三次握手。

剩下的部分就是发送 payload...了吗？

## FIN

最起码我们肯定需要一个结束标志，否则 Receiver 会一直等待新的数据包，所以我们可以在发完最后一个字节后，附带一个 FIN 标志：

Sender 发送：seqno = 114, payload = "FIN, Good bye!", FIN = true

~~一切都需要 ACK !!!~~ 考虑到 TCP 要求可靠传输，我们还需要考虑丢包重传的情况（没有 ACK 就需要一直传！），所以 Receiver 在接收到 FIN 后也依旧应该回应 ACK：

Receiver 回应：ackno = 129

> 注意到，FIN 也占用一个字节的序号，所以 Receiver 回应的 ackno = 129 而不是之前的 128

这样还没完，又因为全双工，两侧都要发送自己的 FIN 并得到 ACK 回应才能关闭整个 TCP 连接，所以关闭流程是：

1. 一侧发出 FIN

2. 另一侧回应 ACK

（...等待另一侧也发送完数据包）

3. 另一侧也发出 FIN

4. 一侧回应 ACK，**并等待 2MSL**。因为 ACK 可能丢包，而此处之后不再有回应，没法确定 ACK 是否被对端接收，所以等待 2MSL（Maximum Segment Lifetime，最大报文段生存时间）。假如在此期间内未收到新的 FIN，则认为对端已经关闭连接，自己也可以关闭连接了，否则重新发送 ACK。

## RST

此外，还有 RST 标志，RST 是 Reset 的意思，表示 TCP 连接异常。如果 RST 报文**合法**，则立刻释放，不再回复。

合法指的是 `seqno` 完全正确。历史上有过 TCP 被外部攻击者发送 RST 报文干扰正常 TCP 连接的情况，而攻击者不知道双方的 seqno，因此可以以此为依据核验 RST 报文是否合法：

- 完全正确：直接释放连接，不再回复

- 在窗口内：回复 Challenge ACK，要求对端重新发送 RST 报文

- 在窗口外：直接丢弃，不再回复，视为攻击

似乎还有个有趣的 CVE-2016-5696，关于如何利用 Linux 固定的每秒 Challenge ACK 次数上限，去猜测 TCP 连接的 `seqno`，达到恶意 RST 或者进一步注入数据包的目的。

## Window Size

`window_size`，表示接收方的窗口大小。由于 TCP Receiver 的 Buffer 大小有限，需要限定可接收到的最大数据量，这个可以暂时设置为之前实现的 `ByteStream` 的 `avaliable_capacity()`（见下文，还要考虑拥塞窗口），超出窗口范围的部分应该直接丢弃。

## Congestion Control

> CS144 的 Lab 中没有实现这些

> As one example, implementing congestion control (e.g., [8]) is a TCP requirement, but it is a complex topic on its own and not described in detail in this document, as there are many options and possibilities that do not impact basic interoperability. (From [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html#section-2))

显然网络容量有限，如果不限制发包，会导致网络拥塞。又因为 TCP，很可能进入正反馈，越是拥塞，越是重试，就越拥塞。所以不能够只按照 `rwnd`（Receive Window，接收窗口）来设置 `window_size`，还得参考网络的拥塞情况来限制 `window_size`，这就是 `cwnd`（Congestion Window，拥塞窗口）的概念。

`cwnd` 的大小由 Sender 动态决定，而 Sender 手上的信息有限，思路大致有观测特征和主/被动和网络交换信息。为了让 Breaking Change 最小，首选当然是观测特征，包括 RTT 往返时间、丢包记录、数据包重传，实际上可以拿到的信息并不多，更何况网络容量是动态变化的。

总体上来说是尽可能在不影响 RTT 和 Loss 的情况下，尽可能多的发送数据包。TCP 连接的拥塞控制算法有很多种，其中一种简单的是 AIMD（Additive Increase/Multiplicative Decrease，线性加/乘性减）的思路，参考以下图片：

![USTC_AIMD_1](/images/CS144/USTC_AIMD_1.png)

![USTC_AIMD_2](/images/CS144/USTC_AIMD_2.png)

![USTC_AIMD_3](/images/CS144/USTC_AIMD_3.png)

> 以上课件截自[中科大 郑烇 教学课程](http://staff.ustc.edu.cn/~qzheng/teaching.html) 内的 [计算机网络 教学资源](http://staff.ustc.edu.cn/~qzheng/cn.zip)，这个课件实际上非常直观，夯！（视频没有看不清楚）

这样会导致锯齿状的 `cwnd`，先逐步翻倍，到达阈值后线性增加，遇到丢包则回到 1，遇到 3 个连续的 ACK 则回到 Threshold + 3。不断探测网络容量使得其能及时充分利用网络资源。

Tahoe (慢启动和拥塞避免) -> Reno(AIMD) -> CUBIC，现在 BBR (Google, 以及 BBRv2, BBRv3，Model-Based), CUBIC (Linux Kernel 采用它，Loss-Based) 很常用，To Be Continued...

除开这些指标，还有 ECN (Explicit Congestion Notification，显式拥塞通知)，它是一个 TCP 扩展，允许网络设备在发生拥塞时通知发送方，而不是丢弃数据包。ECN 通过在 IP 头中设置标志位来实现，这样发送方可以根据收到的 ECN 标志调整其发送速率。

这是一个开放问题，没有最优解，信息量不足，不同的网络环境下可能需要不同的算法，比如 CUBIC 对于丢包过于敏感，用海外 VPS 跨国通信经常得换成 BBR 更稳定。更不用说同一条链路上，不同的 TCP 连接可能用着不同的协议，说不定还能产生奇妙的化学反应。又或者有一条连接用不友好的协议，暴力压榨链路，不停发包，杀敌一千自伤八百，毁掉整个平衡=-=

TODO: BBR (Maybe... =_=)