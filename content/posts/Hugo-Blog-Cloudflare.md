---
title: 使用Hugo搭建Blog+Cloudflare Pages实现自动部署
date: 2024-07-19 5:00:00
tags: [ Blog ]
categories: Blog
---

# Hugo介绍
> Hugo是世界上最快的构建网页的框架\
——[ Hugo官网 ](https://gohugo.io/)
# 安装Hugo
Arch Linux：
```
sudo pacman -S hugo
```
其余发行版请自行使用包管理器搜索并安装
# 开始使用
首先创建一个空白网站
```
hugo new site <Site_name>
```
这个操作会创建一个文件夹，包含Hugo的默认文件
## 安装主题
### ~~博客是写给自己看的~~
所以挑选一个自己心仪的主题很重要。\
你可以在Hugo的[主题网站](https://themes.gohugo.io)中查找
建议查找更新日期较近的主题，以避免有废弃的主题（可能失去了作者支持）。当然，只要你喜欢就好:)
然后你可以点击`Download`按钮，以跳转至GitHub页面，查看`README.md`以安装主题。

### 这里以`FixIt`主题为例
[FixIt主题网站](https://fixit.lruihao.cn/zh-cn/)，你可以查看文档\
转至[GitHub页面](https://github.com/hugo-fixit/FixIt)，你可以提出issue和pull request以解决问题和完善文档\
#### 安装主题
切换到博客目录，执行
```
git init
```
来初始化一个空的Git存储库（之后用于GitHub Actions自动构建部署网站）
将[FixIt]主题作为Git子模块添加到你的项目中的`themes`目录。
```
git submodule add https://github.com/hugo-fixit/FixIt.git themes/FixIt
```
备份目录中的`hugo.toml`文件，并将主题中的`hugo.toml`文件复制出来
```
mv hugo.toml hugo.toml.back && cp /themes/FixIt/hugo.toml ./
```
在站点配置文件中添加一行，指定当前主题。
```
echo "theme = 'FixIt'" >> hugo.toml
```
在站点配置文件中添加一行，指定默认的内容语言。
```
echo "defaultContentLanguage = 'zh-cn'" >> hugo.toml
```
然后启动Hugo开发服务器以查看站点
```
hugo server
```
~~Hugo，启动！~~
## 写文章
你需要将Markdown文章放入`content/posts`文件夹中，然后执行
```
hugo
```
来构建网站
这并不会在本地启动开发服务器，而是将构建后的网页文件放在`public`文件夹下
### 使用草稿
在Hugo中，你可以使用`draft`参数来表示该文章是草稿
```markdown
---
title: 我的第一篇文章
date: 2024-03-01T17:10:04+08:00
draft: true
# ...
---
```
若想连草稿一起构建，请执行
```
hugo -D
```
同理，也可以在开发服务器中使用`-D`。
# 使用Cloudflare Pages实现自动部署博客
<!--请不要尝试在Cloudflare Pages中构建Hugo博客~~，别问我怎么知道的~~-->
<!--Cloudflare Pages所提供的Hugo版本落后，为`0.118`版本，貌似不支持tags和categories功能，如果想要使用，请使用其他的提供商！-->
使用FixIt主题的话，请在Pages的设置中添加环境变量以指定Hugo版本
如`HUGO_VERSION`:`0.129.0`
首先，在GitHub中新建博客仓库，命名为`<User-name>.github.io`
在本地Git中添加远程仓库
```
git remote add origin https://github.com/<User-name>/<User-name>.github.io.git
```
然后添加`.gitingore`
```
vim .gitingore #Vim可替换为其他编辑器
```
加入以下内容
```gitingore
pubilc
resource
```
保存退出
然后上传到GitHub即可。不会的可以看[这里](https://www.runoob.com/git/git-basic-operations.html)
到Cloudflare官网，点击侧边栏的`Workers & Pages`
选择`Pages`，点击连接到GitHub，选择你创建的博客仓库
选择生产分支为你Hugo博客存放的分支，框架预设选择`Hugo`，构建命令不改。
若使用`tags`和`categories`，请添加环境变量：
`HUGO_VERSION = 0.129.0`
然后将一个小更改push到GitHub，Cloudflare会自动部署，给你一个二级域名。
你也可以自定义，请自行搜索。
# All done! Enjoy it!
