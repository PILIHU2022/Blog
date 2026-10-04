---
title: 你好，世界
subtitle: 博客的第一篇文章
date: 2026-10-04T22:00:00+08:00
lastmod: 2026-10-04T22:00:00+08:00
draft: false
description: 这是一个使用 Hugo 与 FixIt 主题搭建的博客的第一篇文章，用于验证站点构建与主题功能是否正常。
keywords:
  - Hugo
  - FixIt
categories:
  - 随笔
tags:
  - Hugo
  - FixIt
summary: 博客的第一篇文章，用来验证 Hugo + FixIt 的构建流水线是否正常。
---

## 开始

这是本站的第一篇文章，它同时充当一个**构建自检样本**：如果这个页面能正常渲染出标题、目录、代码高亮与文末信息，说明 Hugo、FixIt 主题与 Dart Sass 的链路是通的。

## 代码高亮

```python
def greet(name: str) -> str:
    """返回一句问候。"""
    return f"你好，{name}！"


if __name__ == "__main__":
    print(greet("世界"))
```

## 数学公式

行内公式 $E = mc^2$，块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,\mathrm{d}x = \sqrt{\pi}
$$

## 提示块（Admonition）

> [!TIP]
> FixIt 支持 GitHub 风格的 alerts 语法，也支持 `admonition` shortcode。

## 表格

| 项目 | 版本 |
| --- | --- |
| Hugo | 0.167.0 extended |
| FixIt | v1（main 分支） |

## 下一步

- 在 `hugo.toml` 中把 `title`、`baseURL`、作者信息替换为真实内容
- 用 `hugo new content posts/文章名.md` 创建新文章
- 在 `content/posts/` 下用文章目次（page bundle）方式管理封面与配图
