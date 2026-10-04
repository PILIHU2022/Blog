---
title: {{ replace .File.ContentBaseName "-" " " | title }}
subtitle:
date: {{ .Date }}
lastmod: {{ .Date }}
slug: {{ substr .File.UniqueID 0 7 }}
draft: true
description:
keywords:
weight: 0
categories: []
tags: []
summary:
featured_image:
featured_image_preview:

# 更多可用字段见：https://fixit.lruihao.cn/zh-cn/docs/content-management/front-matter/
---
