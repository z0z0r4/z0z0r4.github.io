---
title: CS144 Check7
sticky: false
mermaid: true
date: 2026-09-16 00:01:35
tags:
- study-notes
- CS144
categories:
- study-notes
- CS
- CS144
cover: /covers/pysio_router_icon.png
comments:
copyright:
sponsor:
---

CS144 Check7 --- Put it all together

<!--more-->

Check7 是 *put it all together*，将之前完成的 `NetworkInterface` 和 `Router` 连接起来。又是不用写代码的一个 Check，只需要运行 `endtoend` 完成文件传输即可。

![网络拓扑](/images/CS144/check7_topology.png)

但是又由于 `cs144.keithw.org` 依旧用不了，所以我们需要自己搭建中续服务器（或者也可以修改 `endtoend` 的代码，找两台能直链的设备直接直连就好了，不要中续）。

因此实现了一个 `bouncer` 用来自己搭建，它只监听两个端口（似乎 `cs144.keithw.org` 监听了所有端口...），接受 C/S 的数据包，转发到 S/C 上。

`bouncer` 实现：<https://github.com/z0z0r4/minnow-winter-2025/commit/9a326072ea988ced37740935a2273bff0bd9100b>

---

剩下的就是实验记录，生成文件并传输，最后校验 `sha256sum`。

> 我当然偷懒直接在内网传了...

先部署 `bouncer`：

```
❯ ./build/apps/bouncer 3000
[*] Local Bouncer ready on ports 3000 & 3001
```

然后启动 `endtoend` 的 server：


```
❯ </dev/null ./build/apps/endtoend server 127.0.0.1 3000 > /tmp/big_recv.txt
DEBUG: Network interface has Ethernet address 02:00:00:25:e1:a3 and IP address 172.16.0.1
DEBUG: Network interface has Ethernet address 02:00:00:b8:4e:5f and IP address 10.0.0.172
DEBUG: adding route 172.16.0.0/12 => (direct) on interface 0
DEBUG: adding route 10.0.0.0/8 => (direct) on interface 1
DEBUG: adding route 192.168.0.0/16 => 10.0.0.192 on interface 1
DEBUG: Network interface has Ethernet address 7e:8f:11:3f:e8:e0 and IP address 172.16.0.100
DEBUG: minnow listening for incoming connection...
DEBUG: Received TCPReceiverMessage without ackno
DEBUG: minnow new connection from 192.168.0.50:51191.
DEBUG: Outbound stream to 172.16.0.100 finished.
DEBUG: minnow outbound stream to 192.168.0.50:51191 finished (0 seqnos still in flight).
DEBUG: minnow outbound stream to 192.168.0.50:51191 has been fully acknowledged.
DEBUG: minnow inbound stream from 192.168.0.50:51191 finished cleanly.
DEBUG: Inbound stream from 172.16.0.100 finished.
DEBUG: minnow waiting for clean shutdown... DEBUG: minnow TCP connection finished cleanly.
done.
Exiting... done.
```

最后启动 `endtoend` 的 client：

```
❯ ./build/apps/endtoend client 192.168.1.222 3001 < /tmp/big.txt
DEBUG: Network interface has Ethernet address 02:00:00:1b:29:7e and IP address 192.168.0.1
DEBUG: Network interface has Ethernet address 02:00:00:5b:fb:38 and IP address 10.0.0.192
DEBUG: adding route 192.168.0.0/16 => (direct) on interface 0
DEBUG: adding route 10.0.0.0/8 => (direct) on interface 1
DEBUG: adding route 172.16.0.0/12 => 10.0.0.172 on interface 1
DEBUG: Network interface has Ethernet address 86:5d:a2:ca:60:75 and IP address 192.168.0.50
DEBUG: Connecting from 192.168.0.50:51191...
DEBUG: minnow connecting to 172.16.0.100:1234...
DEBUG: minnow successfully connected to 172.16.0.100:1234.
DEBUG: minnow inbound stream from 172.16.0.100:1234 finished cleanly.
DEBUG: Inbound stream from 172.16.0.100 finished.
DEBUG: Outbound stream to 172.16.0.100 finished.
DEBUG: minnow waiting for clean shutdown... DEBUG: minnow outbound stream to 172.16.0.100:1234 finished (61000 seqnos still in flight).
DEBUG: minnow outbound stream to 172.16.0.100:1234 has been fully acknowledged.
DEBUG: minnow TCP connection finished cleanly.
done.
Exiting... done.
```

校验结果：

```
❯ sha256sum /tmp/big_recv.txt
15524b3290a64d5d331af8fbe64f6b6185384f50e72195ae567c8a3cdf048dc6  /tmp/big_recv.txt

❯ sha256sum /tmp/big.txt
15524b3290a64d5d331af8fbe64f6b6185384f50e72195ae567c8a3cdf048dc6  /tmp/big.txt
```

---

这个 Check7 就算完成了...吗？有点没意思，可以再看看 2025 Fall 的 Check7，里面的内容不同，是利用提供的 `tcp_eth_udp` 和 `fun_router`，Make a Tiny Internet on Your Own VM -> Make an Internet of three people -> Make a bigger Internet，或者做点更有意思的应用吧～

Even more, 让我们来加入 DN42，参与模拟一个真实的互联网（[DN42 实验网络介绍及注册教程](https://lantian.pub/article/modify-website/dn42-experimental-network-2020.lantian/)），或者，让我们 [从0开始注册一个ASN并广播IP](https://www.pysio.online/posts/daily/RegistryASN.html)，总之可以不止于课程实验。