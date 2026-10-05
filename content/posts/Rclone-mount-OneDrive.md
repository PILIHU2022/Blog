---
title: 使用rclone挂载OneDrive
date: 2024-09-01 08:58:42
tags: [ Arch Linux ]
categories: Arch Linux
---
# 使用`Rclone`挂载OneDrive
数据是无价的，它是你的互联网资产，丢失了就很难找回来。目前人们推荐使用3-2-1的备份模式
```
3-2-1备份模式：
3：一堆数据有总共三份，一份在工作目录上，另两份作为备份
2：数据应该至少有两种形式，如硬盘与云存储（上个世纪可能是磁带）
1：三份数据中的一份应该在异地（如在云上，或在家里）

# 链接(URL)：https://chariri.moe/archives/122/personal-backup-restic-rclone/#toc-head-7
# 来源(Source)：茶栗栗屋
```
# 准备工作
## OneDrive账号
首先你需要有一个OneDrive账号。当然，容量越大越好（例如E5账号）。如果你不需要备份很大的文件的话，普通个人账号的免费版就够了。且服务器在国外，上传速度不理想。
## 安装`Rclone`
```
sudo pacman -S rclone
```
# 授权（登录）
```
rclone config
```
然后输入`n`:
```
Enter name for new remote.
name> <Name>
```
在`<Name>`处输入你想要的名称（建议不包含空格）
```
Storage>
```
输入`33`并回车。
在要求输入`client_id>`和`client_secret>`时，直接回车使用默认值即可。
```
region>
```
回车或输入`1`。
```
Edit advanced config?
y) Yes
n) No (default)
y/n> n
```

```
Use web browser to automatically authenticate rclone with remote?
 * Say Y if the machine running rclone has a web browser you can use
 * Say N if running rclone on a (remote) machine without web browser access
If not sure try Y. If Y failed, try N.

y) Yes (default)
n) No
y/n> 
```
输入`y`来使用浏览器登录并且自动授权
```
Choose a number from below, or type in an existing value of type string.
Press Enter for the default (onedrive).
 1 / OneDrive Personal or Business
   \ (onedrive)
 2 / Root Sharepoint site
   \ (sharepoint)
   / Sharepoint site name or URL
 3 | E.g. mysite or https://contoso.sharepoint.com/sites/mysite
   \ (url)
 4 / Search for a Sharepoint site
   \ (search)
 5 / Type in driveID (advanced)
   \ (driveid)
 6 / Type in SiteID (advanced)
   \ (siteid)
   / Sharepoint server-relative path (advanced)
 7 | E.g. /teams/hr
   \ (path)
config_type> 
```
输入`1`并回车

然后Rclone找到一个OneDrive盘，输入y确定回车。\
确认OneDrive网盘的所有信息是否正确，输入`y`并回车。\
然后输入`q`并回车来退出配置界面。

# 同步文件
## 挂载到本地
你可以使用`rclone`来将OneDrive挂载到本地：
```
rclone mount <Name>:<Directory> <Local_path> --vfs-cache-mode writes
```
其中：
`<Name>`：表示你之前命名的
`<Directory>`：指你希望挂载的OneDrive中的目录
`<Local_path>`：指你希望挂载到本地的目录
## 直接同步
使用`sync`参数来同步：
```
rclone sync <Local_path> <Name>:<Directory>
```
其中：
`<Name>`：表示你之前命名的
`<Directory>`：指你希望挂载的OneDrive中的目录
`<Local_path>`：指你希望挂载到本地的目录\
如果你想将整个文件夹复制到OneDrive中，而不是将文件夹中的文件放入备份目录，请使用
```
rclone sync <Local_path> <Name>:<Directory>/<Subdir>
```
# 参考资料
[茶栗栗屋](https://chariri.moe/archives/122/personal-backup-restic-rclone/#toc-head-7)\
[瓦力箱子](https://walixz.com/rclone-sync-onedrive.html)
