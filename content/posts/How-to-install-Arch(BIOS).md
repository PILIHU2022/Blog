---
title: Arch Linux安装教程(BIOS)
date: 2023-08-15 13:18:20
categories: Arch Linux
tags: [ Guides, Arch Linux ]
---
# 本文介绍Arch Linux安装，以BIOS方式为例

# *本文所输入的命令均可用Tab键补全*
# 前言
## [Arch Linux官方安装指南](https://wiki.archlinuxcn.org/wiki/%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)
### [Arch Linux镜像下载地址USTC，2023.07.01](https://mirrors.ustc.edu.cn/archlinux/iso/2023.07.01/archlinux-2023.07.01-x86_64.iso)
# 注意： Arch Linux 安装镜像不支持安全启动（Secure Boot）[注意： Arch Linux 安装镜像不支持安全启动（Secure Boot）,详见wiki](https://wiki.archlinuxcn.org/wiki/%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)
# ~~前面说了一堆废话现在开始实操~~
# 开始安装

启动后，先禁用reflector服务
```
sudo systemctl stop reflector
```
这个服务主要是从Arch Linux Mirror Status 页面获取最新的镜像列表，然后筛选出最新的镜像并按速度排序，最后将结果写入到 /etc/pacman.d/mirrorlist 文件。 ~~但它很鸡肋~~，手动添加镜像站会更好
[更多关于该服务请见Wiki](https://wiki.archlinuxcn.org/wiki/Reflector)

#### 添加的镜像站主要是USTC的镜像站或者清华镜像站

##### 如果不想手动安装Arch的话可以使用archinstall:
```
archinstall
```
[详见Wiki](https://wiki.archlinuxcn.org/wiki/Archinstall)

## 连接网络
```
ip link
```
> 要连接到网络：
        有线以太网 —— 连接网线。
        WiFi —— 使用 [iwctl](https://wiki.archlinuxcn.org/wiki/Iwd#iwctl) 验证无线网络。
        移动宽带调制解调器（移动网卡） - 使用 [mmcli](https://wiki.archlinux.org/title/mmcli) 实用程序连接到移动网络。

> 配置网络连接：
        [DHCP](https://wiki.archlinuxcn.org/wiki/%E7%BD%91%E7%BB%9C%E9%85%8D%E7%BD%AE#DHCP)：对于有线以太网、无线局域网（WLAN）和无线广域网（WWAN）网络接口来说，动态 IP 地址和 DNS 服务器分配（由 [systemd-networkd](https://wiki.archlinuxcn.org/wiki/Systemd-networkd) 和 [systemd-resolved](https://wiki.archlinux.org/title/systemd-resolved) 提供功能）能够开箱即用。
        静态 IP 地址：按照静态 IP 地址进行操作。

> 用 [ping](https://wiki.archlinuxcn.org/wiki/%E7%BD%91%E7%BB%9C%E9%85%8D%E7%BD%AE#Ping) 检查网络连接：
   ```
   ping archlinux.org
   ```
## 更新系统时间
> 在 Live 环境中[systemd-timesyncd](https://wiki.archlinuxcn.org/wiki/Systemd-timesyncd)默认启用，建立互联网连接后，时间将自动同步。

使用[timedatectl(1)](https://man.archlinux.org/man/timedatectl.1)确保系统时间是准确的： 
```
timedatectl
```
即使时间不对也不要慌张: )
## 查看设备名
使用[lsblk](https://wiki.archlinuxcn.org/wiki/Lsblk)来查看设备名(/dev/sda、/dev/nvme0n1等等)
```
lsblk -l
```
或使用fdisk来查看
```
fdisk -l#(小写字母l)
```
结果中以 rom、loop 或者 airoot 结尾的设备可以被忽略。 
> 提示：在分区之前，请检查 NVMe 驱动器和 Advanced Format 硬盘是否使用了 最佳逻辑扇区大小。但注意更改逻辑扇区大小后可能导致在Windows系统中出现兼容性问题。
## 建立分区
使用[fdisk](https://wiki.archlinuxcn.org/wiki/Fdisk)来修改分区表：
此处为/dev/sda、/dev/nvme0n1、/dev/mmcblk0等等，依上文查看的设备名而定
```
fdisk /dev/vda #(此处的/dev/vda就是上文看到的设备名，不可照抄)
```
| 挂载点  | 分区                                        | 分区类型             | 建议大小   |
| :----- | :------------------------------------------ | :------------------ | :-------- |
| [SWAP] | /dev/vda2(笔者这里是vda2，为swap分区，容量较小) | Linux swap(交换空间) | 大于512MB |
| /mnt   | /dev/vda1(笔者这里是vda1，为根目录，容量量较大)  | Linux               | 剩余的空间 |

### ~~开始分区~~
> 执行上文的
```
fdisk /dev/vda#vda不过多赘述
```
输入"o"
当看见："Created a new DOS (MBR) disklabel with disk"时，说明已经创建了分区表
#### 为swap分区，空间最好在10GB以内
```
Command (m for help): n
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended (container for logical partitions)
Select (default p): 

Using default response p.
Partition number (1-4, default 1): #回车
First sector (2048-62914559, default 2048):#回车 
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-62914559, default 62914559): +*G#此处的*为要添加的空间
```
输入"t"，设置分区类型
```
Command (m for help): t
Partition number (1,2, default 2): 
Hex code or alias (type L to list all): 82
```
#### 为/mnt分区，直接使用剩余空间
继续执行n

```
Command (m for help): n
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended (container for logical partitions)
Select (default p): 

Using default response p.
Partition number (1-4, default 1): #此处回车
First sector (2048-62914559, default 2048):#此处回车 
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-62914559, default 62914559): #此处回车
```
输入"w"以保存并退出

## 格式化分区
这里使用btrfs文件系统
先查看硬盘分区
```
lsblk -l
```
然后将空间大的分区作为/mnt
```
mkfs.btrfs -L ARCH /dev/vda1#此处的/dev/vda1应改为你想作为系统的分区
```

将交换分区初始化：
```
mkswap -L SWAP /dev/vda2#此处的/dev/vda2应改为你想作为swap的分区
```

## 挂载分区
将根磁盘卷挂载到/mnt：
```
mount /dev/vda1 /mnt #此处的/dev/vda1应改为你想作为系统的分区
mkdir /mnt/home
mount /dev/vda1 /mnt/home
mkdir /mnt/root
mount /dev/vda1 /mnt/root
```
启用swap分区
```
swapon /dev/vda2#此处的/dev/vda2应改为你想作为swap的分区
```

## 安装系统
### 选择镜像站
```
vim /etc/pacman.d/mirrorlist
```
#### vim 基础命令
`/*`搜索
`a`输入状态
`esc键`退出模式
保存并退出vim：
`先按Esc键，再按:wq`
退出vim而不写入文件：
`先按Esc键，再按:q!`
### 在/etc/pacman.d/mirrorlist文件的第5行添加：
`Server = httsp://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch`
### 安装必需软件包
```
pacstrap -K /mnt base linux linux-headers linux-firmware base-devel btrfs-progs networkmanager bash-completion vim#此处的vim可以是其他的编辑器
```

## 配置系统
用以下命令生成 [fstab](https://wiki.archlinuxcn.org/wiki/Fstab) 文件 (用 -U 或 -L 选项设置 UUID 或卷标)： 
```
genfstab -U /mnt >> /mnt/etc/fstab
```
> 强烈建议在执行完以上命令后，检查一下生成的 /mnt/etc/fstab 文件是否正确。 

### Chroot
通过 [chroot](https://wiki.archlinuxcn.org/wiki/Change_root) 到新安装的系统
```
arch-chroot /mnt
```
<mark>提示：此处使用的是arch-chroot而不是直接使用chroot，注意不要输错。</mark>

### 设置时区
此处以中国为例，~~别找北京了，就只有一个上海~~
```
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```
然后运行 [hwclock](https://man.archlinux.org/man/hwclock.8) 以生成/etc/adjtime：
```
hwclock --systohc
```

## 本地化
> 程序和库如果需要本地化文本，都依赖区域设置，后者明确规定了地域、货币、时区日期的格式、字符排列方式和其他本地化标准。

需在这两个文件设置：locale.gen 与 locale.conf。

编辑 /etc/locale.gen，然后取消掉 en_US.UTF-8 UTF-8 和其他需要的区域设置前的注释（#）。 
接着执行 locale-gen 以生成 locale 信息： 
```
locale-gen#暂不执行
```

更改/etc/locale.gen内容：
```
vim /etc/locale.gen
```
去除en_US.UTF-8和zh_CN.UTF-8前面的#
保存并退出
然后执行
```
locale-gen
```
然后创建/etc/locale.conf，并 [编辑设定LANG变量](https://wiki.archlinuxcn.org/wiki/Locale#%E7%B3%BB%E7%BB%9F%E5%8C%BA%E5%9F%9F%E8%AE%BE%E7%BD%AE)
```
LANG=en_US.UTF-8
```
**<mark>千万别设置为zh_CN.UTF-8!否则会导致TTY乱码！</mark>**

## 网络配置
创建[hostname](https://wiki.archlinuxcn.org/wiki/%E7%BD%91%E7%BB%9C%E9%85%8D%E7%BD%AE#%E8%AE%BE%E7%BD%AE%E8%AE%A1%E7%AE%97%E6%9C%BA%E5%90%8D)文件
```/etc/hostname.conf
myhostname(主机名)
```
## 设置Root密码
```
passwd
```
**注：请记住你所设置的密码！**

## 安装引导程序
```
pacman -S grub #双系统请多安装一个os-prober;Intel的CPU安装intel-ucode;AMD的CPU安装amd-ucode
```
如果出现"Import PGP key"字样，请运行以下命令：
```
rm -rf /etc/pacman.d/gnupg && pacman-key --init && pacman-key --populate archlinux
#生成新的密钥环并重新签署密钥
```
### 将grub安装引导至系统盘：
```
lsblk #查看设备名
```
安装引导
```
grub-install /dev/vda#这里的vda是设备名，不带数字
```
编辑/etc/default/grub文件
```
vim /etc/default/grub
```
将"GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet""
中的loglevel=3改为5，删去quiet，添加nowatchdog；
修改后执行：
```
grub-mkconfig -o /boot/grub/grub.cfg
```
为root再设置一次密码，可以为刚才设置的
最后执行
`exit`退出arch-chroot
`umout -R /mnt`取消挂载/mnt
`reboot`重启
# 最后，不出意外的话系统已经安装好了，重启后拔出介质，然后进入grub引导界面
# 那么恭喜你，你的Arch Linux已经成功安装好了！

# ~~还想再看一遍这个教程吗？只需要执行`sudo rm -rf /*`，你会回来的~~
