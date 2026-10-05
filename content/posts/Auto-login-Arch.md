---
title: Arch Linux自动登录
date: 2024-02-12 22:18:02 
tags: [ Arch Linux ]
categories: Arch Linux
---
# Arch Linux怎么自动登录，而且是免密的，应该会有一些人会这样想，毕竟如果用户名的密码过长，而且密码错以后又要重输，想必是让人血压升高的问题。今天，教程来了

# 当然免密登录也会出现一些安全问题

# 本教程具有一定的时限性，具体操作以Arch Wiki为准！

# 参考Arch Wiki:[Getty](https://wiki.archlinuxcn.org/wiki/Getty)

# 开始操作
```
sudo pacman -S util-linux
```
若已安装可不用重新安装

## 写入一个systemd服务文件:
```
sudo nvim /etc/systemd/system/getty@tty1.service.d/override.conf
```
### 若没有`getty@1.service.d`文件夹，请创建:
```
sudo mkdir /etc/systemd/system/getty@tty1.service.d
```
将以下代码写入/etc/systemd/system/getty@tty1.service.d/override.conf中:
```
[Service]
ExecStart=
ExecStart=-/usr/bin/agetty --autologin username --noclear %I $TERM
```
**注:这里的username要更改为你的用户名,不能照抄~~别问我是怎么知道的~~**

**~~若你不知道你的用户名，请使用以下命令来查看~~**
```
whoami
```
## 启动该服务
```
sudo systemctl enable getty@tty1
```

# 抢救方法(如果没有照抄上面的代码,可以不看)
我们先解析一下服务文件名,从"getty@tty1"中，我们得知这个服务是针对tty1的，对其他tty不受影响(如tty2)
## 切换到其他tty
按住`Ctrl+shift+<F2>`切换到tty2，然后登录用户，修改刚刚的配置文件
```
sudo nvim /etc/systemd/system/getty@tty1.service.d/override.conf
```
然后将`username`改为你的用户名

# ~~来看看作者是怎么修的~~
重启进入liveCD，挂载Arch Linux所在的硬盘，然后修改配置文件
```
sudo vim /mnt/etc/systemd/system/getty@tty1.service.d/override.conf
```
将`username`修改为我的用户名，重启
