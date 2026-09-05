---
title: 用 Cloudflare Email Routing 免费搭建自定义域名企业邮箱
description: 一份完整教程:用自定义域名 + Cloudflare Email Routing + Gmail,零成本搭建企业邮箱收发。
category: howto
tags: [Cloudflare, 邮箱, 域名]
published: 2026-08-01
readTime: 5 min
---

对任何现代开发者、设计师或创业者来说,一个专业的邮箱地址(比如 `contact@yourdomain.com`)是建立品牌信任的必需品。但 Google Workspace 或 Microsoft 365 的企业邮箱托管要花每位用户每月 6 到 18 美元。

如果你已经为项目注册了自定义域名,完全可以零成本收发所有企业邮件。我们把 Cloudflare 的免费 Email Routing 和一个免费 Gmail 收件箱组合起来,无缝搞定一切。

## 阶段一:配置 Cloudflare Email Routing

前提:你的域名 DNS 已托管在 Cloudflare。然后按以下步骤配置邮件转发:

1. 登录 **Cloudflare Dashboard**,选择你的域名。
2. 左侧边栏点击 **Email** → **Email Routing**。
3. 点击 **Enable Email Routing**。Cloudflare 会提示自动添加所需的 MX 和 TXT 记录,确认应用。
4. 进入 **Destination Addresses** 标签,点 **Add Destination**,填入你的个人 Gmail 地址,并到收件箱完成验证。
5. 进入 **Routing Rules** 标签,点 **Create Rule**。自定义地址填你想要的品牌用户名(如 `contact@yourdomain.com`),转发到已验证的 Gmail 地址。

## 阶段二:以自定义域名身份发信

收件已经通了,但如果直接用 Gmail 回信,会暴露你的个人邮箱地址。要以 `contact@yourdomain.com` 发信,需要用 Google 应用专用密码配置 Gmail 的 SMTP:

1. 打开 **Google 账号设置**(myaccount.google.com)。
2. 进入**安全性**标签,确认**两步验证**已开启。
3. 搜索或进入**应用专用密码(App passwords)**,新建一个描述性的密码(如 "Plobi Email Routing"),复制生成的 16 位代码。
4. 打开 **Gmail 收件箱**,点齿轮图标 → **查看所有设置**。
5. 进入**账号和导入**标签,在**用这个地址发送邮件**处点**添加其他电子邮件地址**。
6. 填显示名和自定义域名地址(`contact@yourdomain.com`),勾选"用作别名",点下一步。
7. SMTP 服务器配置:
   - **SMTP 服务器:**`smtp.gmail.com`
   - **端口:**`587`
   - **用户名:**你的完整 Gmail 地址
   - **密码:**第 3 步生成的 16 位应用专用密码
   - 选择 **TLS 加密连接**
8. 点**添加账号**。Gmail 会向你的自定义地址发确认码——由于 Cloudflare 已在转发,回到 Gmail 收件箱查收,填入即完成验证。

## 阶段三:保证送达率(SPF 与 DKIM)

为避免你的自定义域名邮件进垃圾箱,确认 Cloudflare DNS 设置里的 SPF 记录明确包含 Google。SPF TXT 记录值应类似:

```
v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
```

这告诉收件方邮件服务器:Cloudflare 和 Google 的服务器都有权代表你的域名发送邮件。
