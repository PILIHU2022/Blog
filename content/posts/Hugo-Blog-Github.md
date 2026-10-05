---
title: 使用Hugo搭建Blog+GitHub Actions实现自动部署
date: 2024-07-18 12:00:59
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
# 使用GitHub Actions实现自动部署博客
<!--请不要尝试在Cloudflare Pages中构建Hugo博客~~，别问我怎么知道的~~-->
<!--Cloudflare Pages所提供的Hugo版本落后，为`0.118`版本，貌似不支持tags和categories功能，如果想要使用，请使用其他的提供商！-->
首先，在GitHub中新建博客仓库，命名为`<User-name>.github.io`
在本地Git中添加远程仓库
```
git remote add origin https://github.com/<User-name>/<User-name>.github.io.git
```
然后新建文件夹
```
mkdir .github/workflows
```
新建一个YAML文件，文件名随意，输入以下内容
若使用以下代码，请认真看代码后的注意事项！
```yaml
# 使用GitHub Actions自动部署Hugo博客
name: Hugo-Build
on:
  push:
    branches:
      - Hugo
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
      - name: Install Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.129.0'
          extended: true
      - name: Hugo Build
        run: |
          git submodule update --init --remote --merge themes/FixIt
          hugo
      # - name: Deploy
      #   uses: peaceiris/actions-gh-pages@v3
      #   with:
      #     github_token: ${{ secrets.GITHUB_TOKEN }}
      #     publish_dir: ./public
      #     cname: pilihu2022.github.io
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: public
```
## <mark>注意事项</mark>
1. 在`branches`下的`hugo`，需修改为你存放博客的分支
2. 注释的代码可删除，也可使用，其中的`github_token`不需要理会，GitHub Action的机器会自动生成
3. 两个`Deploy`任选其一即可，不要重复使用！
4. 若没有在GitHub中找到Actions的选项，请自行搜索‘GitHub如何开启Actions’
## 使用GitHub Pages
在`Settings` > `Pages`，在`Source`中选择`Deploy from a branch`，随后选择`gh_pages`，点击`Save`按钮，稍等片刻即可看见看见顶栏有提示：
`Your site is live at https://<User-name>.github.io/`
# 结束，祝各位部署GitHub Actions时不报错，报错可[联系](mailto:2812167783@qq.com)
