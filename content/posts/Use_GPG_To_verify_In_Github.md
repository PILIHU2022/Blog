---
title: 在GitHub中使用GPG验证提交
date: 2024-07-23 16:30:01
tags: [GitHub]
categories: Guide
---
# 介绍
首先，你需要知道，GitHub是有GitHub Docs的。[传送门](https://docs.github.com/zh)\
本文所提及的在GitHub Docs中也有。[传送](https://docs.github.com/zh/authentication/managing-commit-signature-verification/about-commit-signature-verification)

# 关于提交验证
> 您可以在本地签署提交和标签，让其他人对您所做更改的源充满信心。 
> 对于大多数个人用户，GPG 或 SSH 会是对提交进行签名的最佳选择。
> 生成 GPG 签名密钥比生成 SSH 密钥更复杂，但 GPG 具有 SSH 所没有的功能。 GPG 密钥可以在不再使用时过期或撤销。

# 开始操作
## 安装`gnupg`
~~其实默认就安装了~~

## 生成密钥
```
gpg --full-generate-key
```
如果使用默认值，请连续按两次回车键
若想自定义，选择序号，第9是默认项
```
Please select what kind of key you want:
   (1) RSA and RSA
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
   (9) ECC (sign and encrypt) *default*
  (10) ECC (sign only)
  (14) Existing key from card
Your selection?
```

选择密钥的过期时间（默认选择0，表示永不过期）：
```
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
```
确认信息，确认后输入`y`：
```
Key does not expire at all
Is this correct? (y/N)
```

接下来就输入自己GitHub的用户名和注册GitHub时所使用的邮箱，当弹出时，可以直接回车，这只是添加注释：
```
Comment:
```

在弹出时，输入`o`表示确认：
```
You selected this USER-ID:
    "Username of GitHub (comment) <name@example.com>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit?
```

然后输入密码来保护GPG密钥（必须，否则将不会创建）\
然后重复刚才所输入的密码
注：这里输入密码不会显示，~~请尽管输入~~
## 查看密钥是否创建
```
gpg --list-secret-keys --keyid-format=long
```
然后你会看到
```
sec   4096R/3AA5C34371567BD2 date 
uid                          Username-of-GitHub <name@example.com>
ssb   4096R/4BB6D45482678BE3 date
```
注：此处你只需要复制第一行中在`4096R/`后，在`date`前的值，不需要包含空格，以下简称为`id`，请举一反三!
## 查看密钥
使用
```
gpg --armor --export <id>
```
你也可以使用
```
gpg --armor --export <Email>
```
来查看\
在输出的一大串中，你需要复制：
```
-----BEGIN PGP PUBLIC KEY BLOCK-----
...................................
-----END PGP PUBLIC KEY BLOCK-----
```
注：你需要将上面的一整段复制下来，包含`-----BEGIN PGP PUBLIC KEY BLOCK-----`和`-----END PGP PUBLIC KEY BLOCK-----`！！
## 将密钥添加到GitHub账户中
~~懒得写了，看Docs吧~~
[将GPG密钥添加到GitHub账户中](https://docs.github.com/zh/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account)
## 在使用`git commit`时，你需要输入生成GPG密钥时所输入的密码
# 祝：在Git commit签名时不报该用户没有GPG密钥
