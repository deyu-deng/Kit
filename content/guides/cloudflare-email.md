---
title: How to Set Up Free Custom Domain Business Email via Cloudflare Email Routing
description: A comprehensive tutorial on setting up free business email hosting using a custom domain with Cloudflare Email Routing and Gmail.
category: howto
tags: []
published: 2026-08-01
readTime: 5 min
---

How to Set Up Free Custom Domain Business Email via Cloudflare Email Routing

            **Author:** David
            **Updated:** June 2026
            **Category:** Cloud Infrastructure

            For any modern developer, designer, or startup founder, having a professional email address (like `contact@yourdomain.com`) is essential for building brand authority. However, dedicated business email hosting from providers like Google Workspace or Microsoft 365 can cost $6 to $18 per user every single month.

            If you have registered a custom domain for your project, you can route all inbound and outbound business emails completely free of charge. We will combine Cloudflare's free Email Routing with a free Gmail inbox to handle everything seamlessly.

            ## Phase 1: Configure Cloudflare Email Routing

            First, make sure your domain's DNS nameservers are managed by Cloudflare. If they are, follow these steps to configure email redirection:

              1. Log in to your **Cloudflare Dashboard** and select your active website domain.
              1. In the left sidebar, click on **Email** -> **Email Routing**.
              1. Click **Enable Email Routing**. Cloudflare will prompt you to automatically add the required MX and TXT records to your DNS settings. Confirm and apply the changes.
              1. Go to the **Destination Addresses** tab, click **Add Destination**, and enter your personal Gmail address (e.g. `myaddress@gmail.com`). Verify the verification email sent to your inbox.
              1. Go to the **Routing Rules** tab, click **Create Rule**. Set the Custom Address to your desired brand username (e.g. `contact@yourdomain.com`) and forward it to your verified Gmail destination address.

            ## Phase 2: Enable Sending Email as Your Custom Domain

            Receiving emails is now active, but replying from your personal Gmail address will leak your personal account address. To send emails as `contact@yourdomain.com`, we will configure Google's SMTP servers using a Google App Password:

              1. Go to your **Google Account Settings** (myaccount.google.com).
              1. Click on the **Security** tab. Ensure that **2-Step Verification** is turned ON.
              1. Search for or navigate to **App passwords**. Create a new app password, naming it something descriptive like "Plobi Email Routing", and copy the generated 16-character code.
              1. Open your **Gmail Inbox**, click the gear icon to open **Settings**, and select **See all settings**.
              1. Navigate to the **Accounts and Import** tab. Under **Send mail as**, click **Add another email address**.
              1. Enter your display name and your custom domain email address (`contact@yourdomain.com`). Make sure the box "Treat as an alias" is checked, then click Next Step.
              1. Configure the SMTP Server settings as follows:
                
                  - **SMTP Server:** `smtp.gmail.com`
                  - **Port:** `587`
                  - **Username:** Your full personal Gmail address (e.g. `myaddress@gmail.com`)
                  - **Password:** The 16-character Google App Password you generated in step 3
                  - Select **Secured connection using TLS**

              1. Click **Add Account**. Gmail will send a confirmation code to your custom address. Since Cloudflare is already routing emails, check your Gmail inbox for this code, copy it, and paste it to complete verification.

            ## Phase 3: Ensure Email Deliverability (SPF & DKIM)

            To prevent your outgoing custom domain emails from landing in spam, verify that your SPF record in Cloudflare DNS settings explicitly includes Google. Your SPF TXT record value should look like this:

            v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
            This tells receiving mail servers that both Cloudflare and Google's servers are legally authorized to transmit mail on behalf of your domain name.
