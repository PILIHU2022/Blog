---
title: Neovim使用ruff格式化Python代码
date: 2024-10-01 19:51:57
tags: [ Linux, Neovim ]
categories: Arch Linux
---
# 在Neovim中使用`ruff`来格式化Python代码
## 原因
~~笔者尝试过使用`cmp`调用`black`和`flake8`来实现格式化Python代码~~

但是失败了，因为两个工具都不支持使用LSP协议（大概吧？）

有人介绍笔者使用`conform.nvim`或`none-ls.nvim`来实现，但是笔者都不成功 :joy:

~~如果你成功使用`conform.nvim`或`none-ls.nvim`来实现，欢迎[告诉笔者！](mailto:Spark@outlook.com)~~
## 关于`ruff`
> An extremely fast Python linter and code formatter, written in Rust. 
> (一个用 Rust 编写的极快的 Python linter 和代码格式化程序。)
> ——ruff项目介绍

## 安装使用
我安装时的[commit](https://github.com/PILIHU2022/My-dotfiles/commit/7e2135f9b059dd272dbeacd8e84e5c60cee1604a)

~~其实你只需要在系统装安装`ruff`就可以了~~
```
# Arch Linux:
sudo pacman -S ruff
```
然后在`cmp.lua`中的`servers`中添加`ruff = {},`即可
# 完成
~~又水一篇文章~~
