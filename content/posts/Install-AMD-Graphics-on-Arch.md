---
title: 在Arch Linux上安装AMD显卡驱动
date: 2024-01-27 20:45:01
excerpt: 本文主要记录了我在Arch Linux中安装AMD显卡驱动的过程及要点 
tags: [ Arch Linux ]
categories: Arch Linux
---
# 设备:
- 显卡：AMD Radeon RX 6500 XT
# 参照Wiki
如果动手能力及理解能力比较好的话可以参考ArchWiki：
[AMDGPU](https://wiki.archlinuxcn.org/wiki/AMDGPU)
[ATI](https://wiki.archlinuxcn.org/wiki/ATI)
[Arch简明指南-Arch显卡驱动](https://arch.icekylin.online/guide/rookie/graphic-driver.html#%E7%8B%AC%E7%AB%8B%E6%98%BE%E5%8D%A1)（不推荐！可能更新不及时，不过你可以参考一下那里的查看显卡架构小结）

Warning：不要查看野教程！！不要查看野教程！！不要查看野教程！！
# 安装
如果你碰巧与我使用的显卡是一样的，~~很好，你仍可能需要参照Wiki~~
<mark>此处以AMD Radeon RX 6500 XT为例，安装AMDGPU驱动，ATI驱动请自行Google和参照Arch Wiki</mark>
首先需要安装`mesa`包，使用以下命令：
```bash
sudo pacman -S mesa lib32-mesa # lib32-mesa是对于32位程序，需要开启multilib
```
添加DDX驱动支持：
```bash
sudo pacman -S xf86-video-amdgpu
```
在Wiki上所提到的其他软件，可以按需求安装，但是安装后的`llvm`和`llvm-libs`是没有`-git`结尾，否则，请重新安装`llvm`和`llvm-libs`：
```bash
sudo pacman -S llvm llvm-libs
```
如果遇到有包依赖，请卸载掉(因为这些包大概都可能是以`-git`)结尾的，安装好`llvm`和`llvm-libs`后再安装回刚刚卸载的包(应该是没有`-git`结尾的)
# 以下是我求助的图片及帖文
[帖文](https://bbs.archlinuxcn.org/viewtopic.php?id=14013)

[电报中文群组1-图床](https://s1.imagehub.cc/images/2024/01/26/1853fdbb328161e95bce6608f155e39a.jpeg)
[电报中文群组2-图床](https://s1.imagehub.cc/images/2024/01/26/15fadfc09ed8a6f85bb2177d12e7e6a0.png)

[电报中文群组1-OneDrive](https://pilihu2023-my.sharepoint.com/:i:/g/personal/pilihu_pilihu2023_onmicrosoft_com/EYyv6xJUqHBJnx04Q13hmCQBVg9XeTU1bNJv3iqt06YBOw?e=kYMRs3)
[电报中文群组2-OneDrive](https://pilihu2023-my.sharepoint.com/:i:/g/personal/pilihu_pilihu2023_onmicrosoft_com/EQ3LrS0CMz1ApN4tsH4ea6MBKeGqIPw7SC-YS9ycU5-SnQ?e=vBQIed)
