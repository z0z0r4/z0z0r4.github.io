---
title: CS144 Check5
sticky: false
mermaid: true
date: 2026-09-23d 09:46:05
tags:
- study-notes
- CS144
categories:
- study-notes
- CS
- CS144
cover: /covers/CS144_network_loop.png
comments:
copyright:
sponsor:
---

CS144 Check5 Network Interface

<!--more-->

![Network Interface](/images/CS144/Network_interface.png)

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute 
       valid_lft forever preferred_lft forever
2: lo: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether bc:24:11:f7:28:d7 brd ff:ff:ff:ff:ff:ff
    altname enp0s18
    altname ens18
    inet 10.0.2.118/24 brd 10.0.2.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::be24:11ff:fef7:28d7/64 scope link 
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default 
    link/ether 76:d4:8f:65:60:24 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::74d4:8fff:fe65:6024/64 scope link 
       valid_lft forever preferred_lft forever
4: br-40d00133d09f: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 6a:39:51:87:27:04 brd ff:ff:ff:ff:ff:ff
    inet 172.19.0.1/16 brd 172.19.255.255 scope global br-40d00133d09f
       valid_lft forever preferred_lft forever
    inet6 fe80::6839:51ff:fe87:2704/64 scope link 
       valid_lft forever preferred_lft forever
15: veth29d9242@if2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br-40d00133d09f state UP group default 
    link/ether 36:eb:5b:0d:79:75 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet6 fe80::34eb:5bff:fe0d:7975/64 scope link 
       valid_lft forever preferred_lft forever
16: veth3a6ed97@if2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br-40d00133d09f state UP group default 
    link/ether 22:3e:e5:ff:8b:d1 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet6 fe80::203e:e5ff:feff:8bd1/64 scope link 
       valid_lft forever preferred_lft forever
```

以上都是 Network Interface 2333。

这一个 Check 主要是实现 Network Interface 的功能，最主要的是实现 ARP 协议，能够发送 ARP 请求和接收 ARP 响应，然后发送和接收 IPv4 数据包。

`void send_datagram( const InternetDatagram& dgram, const Address& next_hop );` 发送数据包时的参数是一个 IPv4 数据包和下一跳的地址，但是 Network Interface 只能 `transmit` 一个 Ethernet 帧，所以需要将 IPv4 数据包封装成 Ethernet 帧发送出去，这就需要知道 `next_hop` 的目的地对应的 MAC 地址，而 Network Interface 并不知道这个 MAC 地址，所以需要通过 ARP 协议获取其他设备的 MAC 地址（需要维护 IP -> MAC 映射）。

```cpp
// Ethernet frame header
struct EthernetHeader
{
  static constexpr uint8_t LENGTH = 14;        //!< Ethernet header length in bytes
  static constexpr uint16_t TYPE_IPv4 = 0x800; //!< Type number for [IPv4](\ref rfc::rfc791)
  static constexpr uint16_t TYPE_ARP = 0x806;  //!< Type number for [ARP](\ref rfc::rfc826)

  EthernetAddress dst;
  EthernetAddress src;
  uint16_t type;

  // Return a string containing a header in human-readable format
  std::string to_string() const;

  void parse( Parser& parser );
  void serialize( Serializer& serializer ) const;
};
```

Ethernet Header 只有三个字段，分别是目的 MAC 地址、源 MAC 地址和类型字段，类型字段用来区分 Ethernet 帧中封装的是什么协议的数据包。

其中 ARP 协议的 `type` 是 `0x806`,IPv4 协议的 `type` 是 `0x800`。

ARP 协议的格式是：

```cpp
// [ARP](\ref rfc::rfc826) message
struct ARPMessage
{
  static constexpr size_t LENGTH = 28;         // ARP message length in bytes
  static constexpr uint16_t TYPE_ETHERNET = 1; // ARP type for Ethernet/Wi-Fi as link-layer protocol
  static constexpr uint16_t OPCODE_REQUEST = 1;
  static constexpr uint16_t OPCODE_REPLY = 2;

  uint16_t hardware_type = TYPE_ETHERNET;             // Type of the link-layer protocol (generally Ethernet/Wi-Fi)
  uint16_t protocol_type = EthernetHeader::TYPE_IPv4; // Type of the Internet-layer protocol (generally IPv4)
  uint8_t hardware_address_size = sizeof( EthernetHeader::src );
  uint8_t protocol_address_size = sizeof( IPv4Header::src );
  uint16_t opcode {}; // Request or reply

  EthernetAddress sender_ethernet_address {};
  uint32_t sender_ip_address {};

  EthernetAddress target_ethernet_address {};
  uint32_t target_ip_address {};

  // Return a string containing the ARP message in human-readable format
  std::string to_string() const;

  // Is this type of ARP message supported by the parser?
  bool supported() const;

  void parse( Parser& parser );
  void serialize( Serializer& serializer ) const;
};
```

其中 `opcode` 决定它是 ARP 请求还是 ARP 响应，`sender_ethernet_address` 和 `sender_ip_address` 是发送方的 MAC 地址和 IP 地址，`target_ethernet_address` 和 `target_ip_address` 是接收方的 MAC 地址和 IP 地址。

对于 ARP 请求并不知道目标 MAC，`target_ethernet_address` 是空的，全为 0。

虽然听起来 ARP 响应才会被学习，请求只是请求，但是实际上只要合法，ARP 请求内的源 MAC 和 IP 的映射也会被接收方学习，例如 A 向 B 发送 ARP 请求，B 收到后会学习 A 的 MAC 和 IP 映射，同时向 A 发送 ARP 响应，A 收到后也会学习 B 的 MAC 和 IP 映射。

测试样例里面对哪些情况合法，哪些情况应该学习，学习了但不一定有回应严格的要求，Check 本身很好理解，但是测试限定的非常细 =-=

在发出 ARP 请求之后，学习到 MAC 地址之前，缺少 `next_hop` 的 MAC 地址的数据包应该被缓存起来，直到学习到 MAC 地址之后再发送出去。

当然 MAC 地址也应该被缓存一定 TTL，同样还需要有 ARP 请求重试机制，若多次重试后过长时间仍然没收到回应，就会放弃该 ARP 请求，连同该 MAC 下其未发送的数据包也一并丢弃。

> 设计计时逻辑有小巧思：既然 `tick` 提供距离上一次 `tick` 已经经过的时间，一种是在每个 entry 里面维护剩余生存时间，每次递减；另一种是记录一个全局时间戳，每次递增全局时间戳，和每个条目的时间戳对比，计算已经过去了的时间 :p

以下的是深入 Minnow 框架的挖掘
---

如果仔细看 `transmit` 就会发现总是会传入一个函数（包括之前的 Check 里面），而这背后封装了一层 `OutputPort`：

```cpp
class OutputPort
{
public:
   virtual void transmit( const NetworkInterface& sender, const EthernetFrame& frame ) = 0;
   virtual ~OutputPort() = default;
};
```

这里提供了一个基类，而用于 Interface 之间通信的是 `class OutputPortToInterface : public OutputPort`：

```cpp
class NetworkSegment : public NetworkInterface::OutputPort
{
  vector<weak_ptr<NetworkInterface>> connections_ {};

  queue<pair<string, EthernetFrame>> in_flight_ {};

public:
  void run()
  {
    while ( not in_flight_.empty() ) {
      for ( auto& i : connections_ ) {
        const shared_ptr<NetworkInterface> interface { i };
        if ( in_flight_.front().first != interface->name() ) {
          cerr << "Transferring frame from " << in_flight_.front().first << " to " << interface->name() << ": "
               << summary( in_flight_.front().second ) << "\n";
          interface->recv_frame( clone( in_flight_.front().second ) );
        }
      }
      in_flight_.pop();
    }
  }

  void transmit( const NetworkInterface& sender, const EthernetFrame& frame ) override
  {
    in_flight_.emplace( sender.name(), clone( frame ) );
  }

  void connect( const shared_ptr<NetworkInterface>& interface ) { connections_.push_back( interface ); }
};
```

也就是说，`NetworkInterface` 之间的通信是通过 `NetworkSegment` 来实现的，`NetworkSegment` 维护了一个 `connections_`，里面存放了所有连接的 `NetworkInterface` 的指针，当 `transmit` 被调用时，会将发送方的名字和 Ethernet 帧放入 `in_flight_` 队列中，然后在 `run` 方法中，将队列中的帧发送给所有连接的接口，除了发送方自己。

`OutputPort` 的设计抽象出了不同的传输形式，在细看之前，我以为它类似于提供了一个 RJ45，背后是一条网线，提供 P2P 连接。而实际上正如其行为是无条件传播数据包，它更像是一个 [Ethernet Hub（集线器）](https://zh.wikipedia.org/zh-cn/%E9%9B%86%E7%B7%9A%E5%99%A8)（我就没见过这个...害得我看了完查了大半天，没见过的东西要咋对应到现实设备啊...），比 Switch（交换机）更简单，Switch 还会根据 MAC 地址来决定将数据包发送给哪个接口，而 Hub 则是无条件地将数据包发送给所有其他接口 =-=

这里形成了一个广播域，二层广播可以在这些 Swtich 和 Hub 之间传递到所有 Host，但是会被路由器阻拦（三层，IP），而 `255.255.255.255` 则是受限广播地址（还有定向广播地址...）。而 CS144 当中的 Lab 还是 Slide 或者 Note 里面都没有特地说广播、多播、组播和任播，看了中科大的资料里面也没有找到。而 Pysio 之前发给我的 Anycast 玩法等，好羡慕呜呜，显然不在知识守备范围内...等我后续看看书里面有没有说法吧，To be continued...