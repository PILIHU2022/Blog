---
title: Arch Linux安装教程(以Legacy BIOS为例)
date: 2023-01-06 13:30:43
categories: Arch Linux
tags: [ Guides, Arch Linux ]
---

# Arch Linux安装教程 （以Legacy BIOS为例） 最后更新于2023年01月06日

## 1.Arch Linux & KDE 的安装及配置——

#### 零、系统镜像的下载 & 安装介质的制作 & BIOS 的设置

[点击此处下载系统镜像](https://mirrors.ustc.edu.cn/archlinux/iso/2023.01.01/archlinux-2023.01.01-x86_64.iso)并[校验SHA256](https://mirrors.ustc.edu.cn/archlinux/iso/2023.01.01/sha256sums.txt)镜像的完整性。校验无误后，使用[Ventoy](https://www.ventoy.net/cn/download.html)制作安装介质。（如果是首次使用Ventoy，[请点击此处](https://www.ventoy.net/cn/index.html)查看使用方法）然后进入BIOS，将安全启动和快速启动关闭并将安装介质（如U盘）设置为第一启动项，并按F10保存退出。进入ArchLinux安装盘即可。



##### 如果设备中包含NVIDIA显卡，请在进入liveCD的GRUB引导界面时按下键盘上的字母E,进入GRUB的编辑模式。在其linux行的末尾加入nouveau.modeset=0来屏蔽NVIDIA开源驱动。否则会出现加载nouveau模块报错和其他模块无法加载的问题。编辑完成后按CTRL+X退出。



> 如有疑问请参考Wiki以下章节：
>
> [获取安装映像](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%8E%B7%E5%8F%96%E5%AE%89%E8%A3%85%E6%98%A0%E5%83%8F)
>
> [准备安装映像](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%87%86%E5%A4%87%E5%AE%89%E8%A3%85%E6%98%A0%E5%83%8F)
>
> [启动到Live环境](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%90%AF%E5%8A%A8%E5%88%B0_Live_%E7%8E%AF%E5%A2%83)

#### 一、验证引导模式 & 联网 & 换源：

```bash
$ ls /sys/firmware/efi/efivars
#验证引导模式（如果目录不存在，即为Legacy BIOS引导模式；反之，请使用隔壁以UEFI为例的教程）

$ iwctl
#运行iwctl（如果是台式机，可直接跳到ping -c 5 archlinux.org这一步）
[iwctl]# device list
#列出WiFi设备（一般为wlan0；这里以wlan0为例）
[iwctl]# station wlan0 scan
#扫描网络
[iwctl]# station wlan0 get-networks
#列出可用网络
[iwctl]# station wlan0 connect X
#连接到X（X改成你可用的WiFi名称并在回车后输入密码且确保密码输入正确）
[iwctl]# exit
#退出iwctl

$ ping -c 5 archlinux.org
#检查网络连接（如果有输出内容，即为联网成功）

$ reflector --country China --save /etc/pacman.d/mirrorlist
#换源（注意大小写）

$ systemctl stop reflector
#关闭reflector服务

$ vim /etc/pacman.d/mirrorlist
#编辑/etc/pacman.d/mirrorlist文件，保留自己需要的源（一般推荐使用中科大源或清华源）

$ timedatectl status
#检查服务状态
```

> 如有疑问请参考Wiki以下章节：
>
> [验证引导模式](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E9%AA%8C%E8%AF%81%E5%BC%95%E5%AF%BC%E6%A8%A1%E5%BC%8F)
>
> [连接到因特网](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%BF%9E%E6%8E%A5%E5%88%B0%E5%9B%A0%E7%89%B9%E7%BD%91)
>
> [选择镜像](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E9%80%89%E6%8B%A9%E9%95%9C%E5%83%8F)和[reflector](https://wiki.archlinux.org/title/Reflector_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E7%A4%BA%E4%BE%8B)
>
> [更新系统时间](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%9B%B4%E6%96%B0%E7%B3%BB%E7%BB%9F%E6%97%B6%E9%97%B4)

#### 二、分区 & 挂载：

以下分区和挂载相关步骤是以SATA协议硬盘为例。

```bash
$ lsblk
#查看硬盘名称（一般为sda；这里以sda为例）

$ fdisk /dev/sda
#使用fdisk对sda进行相关操作
#步骤如下：
Command (m for help): o #输入o新建MBR分区表
Command (m for help): n #输入n创建新分区
Select (default p): p #这里按Enter键创建主分区（如果想创建逻辑扩展分区请输入e）
Partition number (1-4, default 1): #这里按Enter键
First sector (2048-X, default 2048): #这里按Enter键
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-X, default X): +10G #输入+10G
Command (m for help): t #输入t更改分区类型
Hex code or alias (type L to list all): 82 #输入82，创建swap分区
Command (m for help): n #输入n创建新分区，然后一直按Enter键，把剩下的空间全部分配给/分区
Command (m for help): w #输入w写入 

$ lsblk
#查看分区结构是否正确

$ mkfs.btrfs -L ARCH /dev/sda2
#将sda2格式化为btrfs，创建标签为ARCH（注意大小写）

$ mkswap -L SWAP /dev/sda1
#将sda1设置为swap，创建标签为SWAP（注意大小写）

$ mount -t btrfs -o compress=zstd /dev/sda2 /mnt
#将sda2挂载到/mnt目录并创建btrfs子卷
#步骤如下：
btrfs subvolume create /mnt/@ #创建/目录的btrfs子卷
btrfs subvolume create /mnt/@root #创建/root目录的btrfs子卷
btrfs subvolume create /mnt/@home #创建/home目录的btrfs子卷
umount /mnt #卸载/mnt目录
mount -t btrfs -o subvol=/@,compress=zstd /dev/sda2 /mnt #挂载/目录的btrfs子卷到/mnt目录
mkdir /mnt/root #创建/mnt/root目录
mount -t btrfs -o subvol=/@root,compress=zstd /dev/sda2 /mnt/root #挂载/root目录的btrfs子卷到/mnt/root目录
mkdir /mnt/home #创建/mnt/home目录
mount -t btrfs -o subvol=/@home,compress=zstd /dev/sda2 /mnt/home #挂载/home目录的btrfs子卷到/mnt/home目录

$ swapon /dev/sda1
#激活sda1为交换分区

$ lsblk -f
#查看相应分区的文件系统及挂载是否正确
```

在pacstrap之前，请再检查一下/etc/pacman.d/mirrorlist文件。例如：cat /etc/pacman.d/mirrorlist或vim /etc/pacman.d/mirrorlist。总之，检查一下这个文件即可。

> 如有疑问请参考Wiki以下章节：
>
> [建立硬盘分区](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%BB%BA%E7%AB%8B%E7%A1%AC%E7%9B%98%E5%88%86%E5%8C%BA)
>
> [格式化分区](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%A0%BC%E5%BC%8F%E5%8C%96%E5%88%86%E5%8C%BA)
>
> [挂载分区](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%8C%82%E8%BD%BD%E5%88%86%E5%8C%BA)

#### 三、安装基本的包 & 初步配置：

```bash
$ pacstrap -K /mnt linux linux-firmware sof-firmware linux-headers base base-devel vim bash-completion networkmanager dosfstools btrfs-progs exfatprogs ntfs-3g pacman-contrib
#安装必要的软件包（注意大小写）

$ genfstab -U /mnt > /mnt/etc/fstab
#生成/mnt/etc/fstab文件（注意大小写）

$ cat /mnt/etc/fstab
#查看/mnt/etc/fstab文件是否正确（如果不正确，请重新分区、挂载、pacstrap）

$ arch-chroot /mnt
#进入目标系统

$ pacman -S grub amd-ucode intel-ucode
#安装grub & amd-ucode或intel-ucode（AMD的CPU安装amd-ucode，intel的CPU安装intel-ucode）

$ lsblk
#查看硬盘名称

$ grub-install /dev/sda
#将grub写入sda

$ vim /etc/default/grub
#编辑/etc/default/grub文件，将GRUB_CMDLINE_LINUX=""修改为GRUB_CMDLINE_LINUX=" nouveau.modeset=0"（没有nvidia显卡可跳过）

$ grub-mkconfig -o /boot/grub/grub.cfg
#生成/boot/grub/grub.cfg文件

$ systemctl enable NetworkManager
#开机自启NetworkManager服务（注意大小写）

$ passwd root
#设置root密码（在回车后输入密码且密码不显示，输入完成后回车，再输入一遍且密码同样不显示，输入完成后再回车，即可完成密码设置）
```

> 如有疑问请参考Wiki以下章节：
>
> [安装必需的软件包](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85%E5%BF%85%E9%9C%80%E7%9A%84%E8%BD%AF%E4%BB%B6%E5%8C%85)
>
> [Fstab](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#Fstab)
>
> [Chroot](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#Chroot)
>
> [安装引导程序](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85%E5%BC%95%E5%AF%BC%E7%A8%8B%E5%BA%8F)
>
> [Root密码](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#Root_%E5%AF%86%E7%A0%81)

#### 四、退出目标系统：

```bash
$ exit
#退出目标系统

$ umount -R /mnt
#卸载/mnt目录

$ reboot
#重启并登陆root
```

#### 五、系统配置：

```bash
$ nmtui
#运行nmtui（根据图形界面提示进行联网操作即可；台式机可跳过）

$ ping -c 5 archlinux.org
#检查网络连接（如果有输出内容，即为联网成功）

$ vim /etc/hostname
#创建/etc/hostname文件，加入以下内容：
arch
#将主机名设置为arch

$ vim /etc/hosts
#编辑/etc/hosts文件，在末尾加入以下内容：
127.0.0.1 localhost
::1 localhost
127.0.1.1 arch.localdomain arch
#配置hosts文件，映射IP地址和主机名

$ ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && hwclock --systohc
#设置时区为上海（注意大小写）

$ vim /etc/environment
#编辑/etc/environment文件，在开头加入以下内容：
export EDITOR=/bin/vim
#设置vim为默认文本编辑器（注意大小写）

$ reboot
#重启并登陆root

$ useradd -m -G wheel arch
#添加普通用户，用户名为arch并将arch添加到wheel组中

$ passwd arch
#设置arch密码（注意事项请参考第三阶段的设置root密码部分）

$ id arch
#查看用户组是否添加到相应的组中

$ visudo
#设置用户权限，删除%wheel ALL=(ALL:ALL) ALL前面的#

$ reboot
#重启并登陆root

$ vim /etc/locale.gen
#编辑/etc/locale.gen文件，删除en_US.UTF-8 UTF-8和zh_CN.UTF-8 UTF-8前面的#

$ locale-gen
#生成语言

$ vim /etc/locale.conf
#创建/etc/locale.conf文件，加入以下内容（如果文件已经存在，则删除文件中原有的内容）：
LANG="en_US.UTF-8"
#设置语言为en_US.UTF-8，不要不要不要设置为zh_CN.UTF-8（注意大小写）

$ vim /etc/pacman.conf
#编辑/etc/pacman.conf文件，删除[multilib]区域的所有#（开启32位支持）并在末尾加入以下内容：
[archlinuxcn]
Server = https://mirrors.ustc.edu.cn/archlinuxcn/$arch
#添加archlinuxcn源（一般推荐使用中科大源；注意大小写）

$ pacman -Sy
#同步数据

$ pacman -S archlinuxcn-keyring
#安装archlinuxcn-keyring

$ rm -rf /etc/pacman.d/gnupg && pacman-key --init && pacman-key --populate archlinux && pacman-key --populate archlinuxcn
#生成新的密钥环并重新签署密钥（安装archlinuxcn-keyring不报错时可跳过）

$ pacman -Sy
#再次同步数据

$ pacman -S mesa lib32-mesa xf86-video-amdgpu vulkan-radeon lib32-vulkan-radeon xf86-video-ati opencl-mesa lib32-opencl-mesa opencl-headers
#安装AMD核显相关驱动

$ pacman -S mesa lib32-mesa xf86-video-intel vulkan-intel lib32-vulkan-intel opencl-mesa lib32-opencl-mesa opencl-headers
#安装intel核显相关驱动

$ pacman -S pipewire lib32-pipewire pipewire-media-session pipewire-alsa pipewire-pulse pipewire-jack lib32-pipewire-jack
#安装声音相关驱动

$ systemctl enable bluetooth
#开机自启bluetooth服务

$ reboot
#重启并登陆root
```

~~So,Nvidia:FuckYou!~~

> 如有疑问请参考Wiki以下内容：
>
> [网络配置](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E7%BD%91%E7%BB%9C%E9%85%8D%E7%BD%AE)
>
> [时区](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%97%B6%E5%8C%BA)
>
> [本地化](https://wiki.archlinux.org/title/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%9C%AC%E5%9C%B0%E5%8C%96)

####  六、安装桌面环境：

```bash
$ pacman -S ttf-dejavu ttf-liberation noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-emoji-blob noto-fonts-extra wqy-bitmapfont wqy-microhei wqy-microhei-lite wqy-zenhei ttf-arphic-extra ttf-arphic-ukai ttf-arphic-uming adobe-source-code-pro-fonts adobe-source-han-sans-jp-fonts adobe-source-han-sans-tw-fonts adobe-source-han-serif-jp-fonts adobe-source-han-serif-tw-fonts adobe-source-han-sans-cn-fonts adobe-source-han-sans-kr-fonts adobe-source-han-serif-cn-fonts adobe-source-han-serif-kr-fonts adobe-source-sans-fonts adobe-source-han-sans-hk-fonts adobe-source-han-sans-otc-fonts adobe-source-han-serif-hk-fonts adobe-source-han-serif-otc-fonts adobe-source-serif-fonts
#安装字体（请根据需要自行补充，这里只安装常用的包）

$ pacman -S plasma-meta konsole dolphin
#安装KDE桌面及软件（这里只安装最必要的包，如果想完整使用KDE的各种功能请根据对应提示安装需要的包）

$ systemctl enable sddm
#开机自启sddm服务

$ reboot
#重启
```

## 2.桌面中文环境的设置 & 输入法的安装及配置——

#### 一、中文环境的设置：

System Settings>>Regional Settings>>Language>>Change Language，**简体中文**>>Apply。

```bash
$ reboot
#重启
```

如果以上方法出现中英文混杂的情况可尝试以下方法（推荐）：

```bash
$ vim .xprofile
#创建~/.xprofile文件，加入以下内容：
export LANG=zh_CN.UTF-8
export LANGUAGE=zh_CN:en_US
#设置X环境为中文（注意大小写）

$ reboot
#重启
```

#### 二、Fcitx 5 输入法的安装：

```bash
$ sudo pacman -S fcitx5-im fcitx5-chinese-addons
#安装fcitx5主体、配置工具、输入法引擎及中文输入法模块

$ sudo vim /etc/environment
#编辑/etc/environment文件，在末尾加入以下内容：
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
SDL_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
#配置环境变量（注意大小写）

$ sudo pacman -S fcitx5-pinyin-zhwiki fcitx5-pinyin-moegirl
#安装词库

$ reboot
#重启
```

# END ~~（想再看一遍本教程吗？那就请在终端中输入sudo rm -rf /*，你会回来的。）~~
# By MicrosoftXiaoice

