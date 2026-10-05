---
title: Linux下设置xdg-open打开某文件/目录的应用程序
date: 2024-08-20 11:55:17
tags: [ Arch Linux ]
categories: Arch Linux
---
# 设置`xdg-open`打开某文件/目录的默认应用程序
你需要使用`xdg-mime`工具来获取`filetype`
```
xdg-mime query filetype path_to_file
```
然后你需要在`/usr/share/applications`中查找有没有你想打开的软件
```
ls /usr/share/applications | grep program_name
```
确认后，即可设置默认的打开程序
```
xdg-mime default program_name.desktop filetype
```

# 参考
[xdg-mime Arch man](https://man.archlinux.org/man/xdg-mime.1.en)
[xdg-open Arch man](https://man.archlinux.org/man/xdg-open.1.en)
[xdg-settings Arch man](https://man.archlinux.org/man/xdg-settings.1.en)
