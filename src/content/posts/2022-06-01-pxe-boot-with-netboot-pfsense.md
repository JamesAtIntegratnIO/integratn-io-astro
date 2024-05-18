---
title: "Pxeboot With Netboot.xyz on Unraid and Pfsense"
pubDate: 2022-06-01T20:27:10-06:00
tags:
- pfsense
- unraid
- pxe
- netboot
categories:
- tutorial
heroImage: /abstract1.webp
description: A quick guide on setting up a pxe server with netboot.xyz on unraid and pfsense
---

Here is a quick one on setting up a pxe server for your home lab that I just finally clicked for me.

## Setting up Netboot.xyz on Unraid
First thing we need to do is get a pxe server running. If you are running Unraid, then great. netboot.xyz has a docker app setup and ready to go. All we have to do is configure it.

The base configuration is great for the most part. Make sure you don't have any port overlap issues. You cannot switch the pxe port 69. But the webui and the file server can be mapped to whatever port you need.

Update `assets` to point somewhere on your unraid server. This is where you can host various things like your ubuntu autoinstall files. Mine is mapped to `/mnt/user/data/netboot/assets`. 

Other than that, scroll to the bottom and click apply. When its all finished you can see the WebUI on its port and the file server on the other.

We are done here. Lets move on.

## Setting up your DHCP Server on PFSense for PXE boot
1. Navigate to `Services > DHCP Server`
2. Select the DHCP Server that you are going to configure
3. Check `Enable Network Booting`
4. Set `Next Server` to the IP of your Netboot container
    > Just the IP, not the port
5. For the next 5 `file name` fields just set them all to `netboot.xyz.efi`
6. Click Save
7. Click Apply

Go test it out and PROFIT

For more info, here are some links that I referenced.

[Linuxservers.io Netboot Docker Repo](https://github.com/linuxserver/docker-netbootxyz)
> Instructions for other DHCP Servers can be found above

[Linuxserver.io netboot intro blog post](https://www.linuxserver.io/blog/2019-12-16-netboot-xyz-docker-network-boot-server-pxe)

[LA Robertos Blog Post](https://www.laroberto.com/ubuntu-pxe-boot-with-autoinstall/)
