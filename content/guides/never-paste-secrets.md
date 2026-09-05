---
title: Never Paste Secrets Into Random Online Tools
description: A short survival guide for developers, sysadmins, and security-aware users on why pasting production data into web tools is the most common credential leak today — and what to do instead.
category: privacy
tags: []
published: 2026-08-01
readTime: 5 min
---

[Library](/guides/) · privacy

          Privacy & Security
          2026-08-15
          3 min
        
        Never Paste Secrets Into Random Online Tools
        A short survival guide for developers, sysadmins, and security-aware users on why pasting production data into web tools is the most common credential leak today — and what to do instead.

Most leak reports start with a sentence like: "I pasted a JWT into a debug tool to inspect it, and 24 hours later our staging environment was wiped."

The mechanics are simple. A web tool's JavaScript runs in the browser, but the moment you paste a credential into its input, the page has the value in memory. From there, an analytics beacon, a deliberate exfiltration in a copy-pasted snippet, or a "feature" that sends your input to an LLM for processing can leak it in ways you never agreed to.

This page is a short checklist — not paranoia, just the habits that separate "fine" from "have I Been Pwned" the next morning.

## The 30-second rule

Any time a tool asks for a value that looks like a credential — a token, a private key, a connection string, a `.env` file's contents — ask three questions before you paste:

1. **Do I trust the page that is asking?** Open the developer tools. Look at the network tab. If you see any request going to a domain other than the one you typed, stop.1. **Is the value still valid tomorrow?** If you rotate the secret anyway, the worst-case blast radius is much smaller.1. **Can I sanitize it?** Many tools only need the structure, not the real data. Use a dummy value first.

If any of the three answers is "no" or "I'm not sure", do not paste.

## Why "browser-only" is the right baseline

The only architecture that survives the long term is one where the secret never leaves the device. That is the entire premise of Plobi-kit and a handful of other privacy-first tool sites: the work happens in your browser's JavaScript engine, with the result staying in local memory unless you explicitly copy it.

When you evaluate a tool, look for these signals:

- The page loads with no third-party scripts in the network panel.- The site has a clear "how this works" page describing the local-only architecture.- The privacy policy is short and specifically mentions what is stored server-side — usually: nothing, except when you trigger it.

If a tool cannot answer those, treat it as a potential leak and rotate the secret afterwards.

## The two habits that catch the most mistakes

**Redact before sharing.** Most tools work on a real value's *shape*, not its contents. Decode a JWT with the public algorithm only. Inspect a token's claims by replacing the signature with placeholder text. You almost never need the live secret to debug.

**Rotate after sharing.** Even if you trust a tool today, treat any pasted credential as compromised. A 30-second rotation right after a debug session costs nothing; a breach costs you a week.

Both habits are easier to follow when the tool itself is designed to encourage them. That is the only kind of online tool we are interested in building.
