---
title: Hyprland指南(安装其他软件)
date: 2023-08-14 15:25:00
categories: Guide
tags: [ Guides, Hyprland ]
---

# Hyprland指南(第二篇)
## 若想使用通知，需要安装 dunst
如下:
```
sudo pacman -S dunst
```
然后将本仓库的/dunst 复制到~/.config/dunst 中，若没有该文件夹，则创建一个 dunst 的文件夹，否则 dunst 不会读取并且使用的。
~~都用 Arch Linux 了，不会连创建文件夹都不会吧？~~
~~为了避免有人不会创建文件夹~~
```
mkdir ~/.config/dunst
```
然后设置自启动：
在~/.config/hypr/hyprland.conf中添加：
`
exec-once = dunst
`
## 若想实现类似于 i3-status 的功能（状态栏），需要安装 waybar
如下:
```
paru -S waybar-git
```
然后将本仓库中的/waybar 文件夹复制到~/.config/hypr 中~~可以新建文件夹，也可以不用~~然后记住 waybar 文件夹中的 config.jsonc 和 style.css 路径（完整路径）
设置自启动：
在~/.config/hypr/hyprland.conf 中写入：
`
exec-once = waybar -c $WAYBAR/config.jsonc -s $WAYBAR/style.css
`
**其中的$WAYBAR 为你的 waybar 具体路径**
## ~~若想输入中文~~，你需要安装输入法
### 若想使用fcitx5的中文输入法(非rime)
```
sudo pacman -S fcitx5-im fcitx5-chinese fcitx5-pinyin-moegirl fcitx5-material-color # 安装输入法相关软件包，词库，主题 
```
### *此处以安装rime输入法为例，其他输入法同理，不过推荐使用fcitx5*
```
sudo pacman -S fcitx5-rime
```
~~我使用的就是rime输入法，不过我感觉输入体验是不如搜狗输入法，将就着用吧~~
#### 此外，我们还需要设置环境变量，此处使用neovim来编辑(~~vim,nano等等编辑器均可，无需跟风~~)
```
sudo nvim /etc/environment
```
加入以下内容：
`
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
SDL_IM_MODULE=fcitx
GLFW_IM_MODULE=ibus
`

# 本篇教程结束

# All done! Enjoy it!
