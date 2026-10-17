---
title: "使用Encfs加密文件或文件夹"
publishDate: 2024-09-16T12:26:15+08:00
description: "使用 EncFS 创建加密目录，并说明其安全现状与使用注意事项。"
tags: ["Arch Linux"]
draft: true
---

## 注意
> Warning: A security review (February 2014) of encfs discovered a number of security issues (in the stable release 1.7.4 of 2014). Please consider the report and the references in it for updated information before using the release, since [the development has halted](https://github.com/vgough/encfs/issues/604#issuecomment-1006599361) and [not all issues are fixed](https://github.com/vgough/encfs/issues/314#issuecomment-288206275).
## 关于`Encfs`
EncFS 是一个文件系统层的加密解决方案，它允许用户透明地加密文件系统上的数据。
特点：
- 提供了透明的数据加密功能
- 文件级别的加密。
## 安装`Encfs`
```
sudo pacman -S encfs
```
