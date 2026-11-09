---
title: Burning visible images onto optical discs
sticky: false
mermaid: false
date: 2026-11-09 08:45:56
tags:
categories:
cover: /images/burning-visible-images-onto-optical-discs/Charlotee.jpg
comments:
copyright:
sponsor:
---

在光盘上烧录可视图像

<!-- more -->

本文记录一下这个有趣的经历

## 事前准备

自从在频道里发现有 [JiaFeiMiao-K-Cat/DiscImageStudio](https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio) 这种奇妙项目之后，立刻冲动下单在拼多多买了 5 张 DVD-RW 光盘（标识的是 JVC 这个牌子，具体型号是 RITEK-004-48，似乎还是台湾代工的 =-=），于是尝试刻录。

简单来说是通过构造特定光盘映像，让不同反射率的微观凹坑与空白区，在盘面上组合出肉眼可见的宏观图案。那么问题就在于如何将预期图案转换为光盘映像，DiscImageStudio 就是实现了这个。

我想把 Charlotee 的人物刻上去，友利奈绪一看就很适合 :p

![Charlotee_draft](/images/burning-visible-images-onto-optical-discs/Charlotee_2.png)

不过加上这两只有点奇怪，于是决定只刻这一对

![Charlotee](/images/burning-visible-images-onto-optical-discs/Charlotee_1.png)

## 标定光盘

应该参考 <https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio/blob/main/docs/CALIBRATION.md> 以及 <https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio/blob/main/docs/CALIBRATION_TUTORIAL.md> 这两个官方教程来标定

参考作者的 Blog <https://jiafeimiao.com/2026/05/18/把喜欢的图烧进CD里——光驱绘图研究> (orz) 以及光盘的原理中可以得知，光盘数据在物理上是以一条从内圈向外圈展开的阿基米德螺旋线存储。虽然有标准尺寸，但是不同型号还是存在细微偏差，螺距只要存在极其微小的漂移，在旋转数万圈后误差就会迅速发散，导致本该笔直的图案被严重甩弯甚至不可辨识。因此，不同批次和型号的光盘都必须重新标定。

> 对刻录机似乎倒是没什么要求

而我们没有太好的测量办法，最多只有一台手机当摄像头，那么只能依赖拍照来测量了

在 v1.3.x 的版本的时候，标定方法还不完善，只能通过一张标定图来多次尝试，接近真实内外半径之后才能显现出大致的标定图像，然后再进一步标定

当时我尝试了一张光盘，发现完全看不出十字线，遂搁置（我只买了五张，看网友说可能消耗二三十张）

后来过几天 v1.5.0 发布了，再尝试时就非常顺利，标定分为了三阶段，有三个不同的标定图案（在原来的单一图案前面添加了两个阶段的图案），只需要刻录三次，理论上就能获得一份标定数据，经过一下午的折腾就顺利产出了

> 由于没有刻录机，找了台舍友的 2015 年的老旧联想笔记本来刻录，接口外设一应俱全啊。相应的我没在上面截屏而是直接拍屏了，望谅解 =-=

### 粗标定

![Phase 1](/images/burning-visible-images-onto-optical-discs/phase_1.png)

粗标定很简单，标注三个环的内外边缘即可，总计六个标点

![Phase 1 Real](/images/burning-visible-images-onto-optical-discs/phase_1_real.jpg)

### 边界标定

![Phase 2](/images/burning-visible-images-onto-optical-discs/phase_2.png)

最麻烦，需要标注二十段接近两百个标注点，尽可能在能看清未反光的弧边缘标注

![Phase 2 Real](/images/burning-visible-images-onto-optical-discs/phase_2_real.jpg)

![Phase 2 Marked](/images/burning-visible-images-onto-optical-discs/phase_2_marked.jpg)

### 精细标定

![Phase 3](/images/burning-visible-images-onto-optical-discs/phase_3.png)

三阶段也是非常简单，只需要标注十字线的一个支即可

![Phase 3 Real](/images/burning-visible-images-onto-optical-discs/phase_3_real.jpg)

![Phase 3 Marked](/images/burning-visible-images-onto-optical-discs/phase_3_marked.jpg)

### Final

最终结果应该是能刻出如下的结果，非常完美

![Final](/images/burning-visible-images-onto-optical-discs/final.jpg)

> 校准照片中光盘内外边缘时，显然标点应该放在边缘上，而不是让点连成的线去切 quq ~~群友还是太有说法了~~

![Locate](/images/burning-visible-images-onto-optical-discs/locate.png)

## 刻录图案

标注好之后刻录想要的图案一点难度也没有，这里就不再赘述了

这里放两个刻好的成品展示一下

> 我不知道如何拍照才能完美的拍出来...总是反光或者不够清晰，现实里拿着看才能体验出来，或者拍视频吧

![Charlotee](/images/burning-visible-images-onto-optical-discs/Charlotee.jpg)

![Haru](/images/burning-visible-images-onto-optical-discs/haru.jpg)

## RW 覆写

此外，软件要求必须是空白介质才能允许刻录，但是这应该是针对 Read only 的，似乎没有考虑到 RW

我的是 DVD-RW，但是就算手动擦除，也不会被认定为空白盘。个人实测覆写一两次内不会导致问题，没有更多尝试，具体的 Flags 检查和相关讨论可以参考

- <https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio/issues/203>
- <https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio/pull/221>
- <https://github.com/JiaFeiMiao-K-Cat/DiscImageStudio/discussions/211>

@Doctor-shengru 构建了一份允许 DVD-RW 覆写的版本 <https://github.com/Doctor-shengru/DiscImageStudio/releases/tag/Feature>，或者我 fork 的 <https://github.com/z0z0r4/DiscImageStudio/releases/tag/v1.5.0-beta.1>