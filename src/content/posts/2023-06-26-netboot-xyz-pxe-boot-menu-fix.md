---
title: "Pxeboot With Netboot.xyz Menu Fix"
pubDate: 2023-06-26T08:15:10-06:00
tags:
- pxe
- netboot
categories:
- tutorial
heroImage: /abstract2.webp
description: A quick fix for getting netboot.xyz to use your local menus instead of always downloading the menus from Github
---

Here is a quick fix for getting netboot.xyz to use your local menus instead of always downloading the menus from Github

By default the live endpoint for live assets is pulled from https://github.com/netbootxyz. This can cause issues when you are making custom menus. To fix this open up the `boot.cfg` and comment outline 14 and add an endpoint pointing to your netboot.xyz instance running in your network. In my case I am not using the default port `80` and the container is pointing to `8282`

```shell
# set location of custom netboot.xyz live assets
# set live_endpoint https://github.com/netbootxyz
set live_endpoint http://10.0.0.10:8282
```

This was annoying me to no end until I found the fix here: [Zakna's comment in Unraid forums](https://forums.unraid.net/topic/84722-support-linuxserverio-netbootxyz/?do=findComment&comment=858551)