---
title: 实现自动更新Blog(actions-gh-page)
date: 2024-01-12 22:47:52
tags: [ Blog ]
draft: true
---
# 简介
群友“竹林里有冰”的Blog有一个部署方案，如下：
[我的博客部署方案](https://zhul.in/2022/11/04/my-blog-plan/)

# 开始码GitHub Actions代码
如果不想写的话可以借鉴：
[^1] [PILIHU2022.github.io/Actions](https://github.com/PILIHU2022/PILIHU2022.github.io/blob/main/.github/workflows/deploy.yaml)
[^2] [竹林里有冰的代码](https://github.com/zhullyb/zhullyb.github.io/blob/master/.github/workflows/deploy.yml)
[^1]: 我的Github Blog是直接部署到GitHub，所以省略了竹林里有冰的一些代码，可看注释掉的代码
[^2]: 这是竹林里有冰的代码，部署到VPS中

## 安装Node.js
由于GitHub Actions没法使用Ubuntu的apt包管，所以只能使用`actions/nodejs`，使用@来指定版本，我这里指定的是version 3中的Node.js 21版本，代码中的`actions/checkout`只用于切换到该仓库;
 ### 安装相关依赖
 你需要将你本地仓库中的package.json添加到GitHub仓库中，代码中是这样的:
```yaml
 - name: Install Dependencies
        run: 
          npm install; # 分号不可省略，否则将会被识别成一条命令
          npm update # 更新安装的软件（Hexo等）
```

## 为每个文件重新设定最后修改时间
> 这一步其实是挺重要的，Hexo框架生成每篇文章的最后修改时间的依据是该文件的最后修改时间，而对于 Github Action 的容器来说，每一个文件都刚刚被下载下来，都是最新的，这就会导致你的每一篇文章每次部署时都会被认为刚才修改过。
我们这边可以直接使用 git 记录的时间来作为文件的最后修改时间。

## 设置时区
~~Blog基本都是用来给自己看的~~
所以时区当然要设置成中国标准时间（东八区）
使用
```yaml
export = TZ='Asia/Shanghai'
```
## 生成网页
```yaml
yarn build
```
如果不需要部署到VPS的到此处就可以了

# 以下是使用GitHub Pages来更新Blog（该段未完成）
若想部署到VPS，参考[部署到VPS](#Deploy-to-VPS)

Q:为什么我已经将GitHub Actions搞定了，且将博文上传至GitHub仓库了，但是没有更新，GitHub Actions也没有报错
A:请检查你的GitHub Pages设置（位置在Settings > Pages）中的“Build and deployment”，在source中选择Deploy from a branch

# 将Blog部署到VPS {#将Blog部署到VPS}
## ~~我懒得写，而且没有VPS，所以就直接引用竹林里有冰的内容~~
> 初始化 Github Action 容器上的 ssh 私钥应当在 Github 仓库的设置里先新建一个 secret，填入自己的 ssh 私钥（更加标准的做法应当是为 github action 专门生成一对 ssh 密钥，将公钥上传到自己的 vps，将私钥上传到 Github 仓库的 secret 中）。
![](https://bu.dusays.com/2022/11/04/6364dbbfeb8f6.png)
> 我这边直接从点墨阁那边抄了点代码直接用。
> 使用 hexo 的 deploy 插件调用 rsync 将静态文件上传到自己服务器的对应目录（static server 你应当已经设置好了）
> ```yaml
> yarn deploy
> ```





















































































































