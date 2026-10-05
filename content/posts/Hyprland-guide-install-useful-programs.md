---
title: Hyprland指南(安装常用软件)
date: 2023-08-15 10:06:00
categories: Guide
tags: [ Guides, Hyprland ]
---

# Hyprland指南(安装常用软件)
## 安装VScode
全称为Visual Studio Code<sup>AUR</sup>，由于名字太长所以被人们简化成VSC(吧？)~~不用管这些，我们只是用这个来码代码(屎山)~~
```
paru -S visual-studio-code-bin
```
然后就跟着VSC的提示来安装中文语言包，装好就不用我说了吧？
如果嫌调字体麻烦的话可以来到[我的配置仓库](https://github.com/PILIHU2022/My-Arch-configs)，在里面的settings(VSC).json中，有一个`//设置字体`，把里面的内容复制到你的VSC配置文件中，路径如下:
`~/.config/code/User/`
字体的话需要安装如下:(自己配置的话可跳过)
```
paru -S ttf-cascadia-code nerd-fonts-completle 
```
鸿蒙黑体也是可以的，但是在系统上使用似乎会出现有的字体大，有的字体小的问题，我没有进一步研究。
~~只记得要装这两个，还有些忘了~~
微软雅黑的话可以换成别的字体
### 剩下的就自己折腾吧

## 安装QQ
这个可没有配置文件照抄了，直接执行：
```
paru -S linuxqq
```
安装即可，若出现闪退情况，请参阅
[AUR-LinuxQQ评论区](https://aur.archlinux.org/packages/linuxqq)
## Markdown编辑软件
- Typora
   - UI可以，可以实时预览，支持快捷键，但是不支持修改快捷键，Markdown的功能基本都有，就是要￥
- VNote
   - 开源，不可以实时预览，支持快捷键，支持修改快捷键，有能力的甚至可以自定义主题以及样式，有待改进
- Marktext
   - 在Windows上用过，不过是20年的事，不知道现在咋样了，听说可以实时预览了，有兴趣的可以试试

#### 下面以安装VNote为例：
```
paru -S vnote-appimage
```
在AUR中有一个包名叫做`vnote`的,我试过,无法使用中文输入,所以使用`vnote-appimage`
#### 安装Typora
```
sudo pacman -S Typora
```
~~当然,这是有米的人的操作~~
##### 想使用破解版的可以添加zzy-ac源(~~有米的人可以跳过~~)
在/etc/pacman.conf中添加:
`
[zzy-ac]
SigLevel=Never

Server = https://github.com/zzy-ac/repo/releases/download/x86_64/

Server = https://gh.dmnb.cf/https://github.com/zzy-ac/repo/releases/download/x86_64
`
安装Typora
```
sudo pacman -S zzy-ac/typora-electron-crack
```

# All done! Enjoy it!
# Writer:PILIHU
