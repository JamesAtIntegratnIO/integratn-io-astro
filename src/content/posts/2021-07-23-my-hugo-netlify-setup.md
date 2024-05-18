---
title: My Hugo+Netlify setup
pubDate: 2021-07-23T22:17:46.983Z
categories:
  - tutorial
tags:
  - hugo
  - netlify
  - howTo
heroImage: /hugo-netlify-setup.webp
description: A guide on how I setup my blog using Hugo and Netlify
---


So here is how I got my blog all set up. It was a lot of back and forth on how I set this up. So this post is for those that read it. But also for me. It was a lot of work and I want to capture what I did so I can reproduce it later.
<!--more-->
This is by no means a complete set of instructions that you can iterate through. But more of a flow. I try to call out the things that were pain points for me directly though.

## Setting up Hugo

First thing I did was install hugo. You can find instructions for it [here](https://gohugo.io/getting-started/installing/). After I had it installed I used `hugo new site ${siteName}` to create my site.

## Version Control is Key

After that I wanted to have git setup so that I had solid version control incase I broke anything. `git init` solved that really quickly. Then I created my repo on [Github](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-on-github/creating-a-new-repository). After you do that it will give you instructions on how to create your first commit and change your origin for the remote and push your code. 

## Gotta Make it Pretty

Next up is adding the theme. You can find a lot of them on the [Hugo site](https://themes.gohugo.io/). Use `git submodule add ${url to theme repo} themes/{theme-name}` to put it in place.

After you get your theme in place you will need to update your config.yaml to actually use it. You would do this by adding a line like:
```yaml
theme: "anubis" # This is the name of the folder in the themes directory
```

## Deploy It

Now I have everything installed. Lets see it run. To run it locally to make sure everything works you can use `hugo serve`. But if you really want to get going then you will need to deploy it somewhere online. I put mine on netlify as I knew the name already and the process was simple enough. 

Create your account on [netlify](https://app.netlify.com/signup). After your account is created you can create a new site with this magic button

![new site button](/images/newsitebutton.png)

After this you will go through some steps to connect it to your github repository and a deploy should be triggered. When its all said and done you should have your new site up and ready to go.

This includes setting up your `netlify.toml`
```toml
[build]
publish = "public"
command = "hugo --gc --minify"

[context.production.environment]
HUGO_VERSION = "0.85.0"
HUGO_ENV = "production"
HUGO_ENABLEGITINFO = "true"

[context.split1]
command = "hugo --gc --minify --enableGitInfo"

[context.split1.environment]
HUGO_VERSION = "0.85.0"
HUGO_ENV = "production"

[context.deploy-preview]
command = "hugo --gc --minify --buildDrafts --buildFuture -b $DEPLOY_PRIME_URL"

[context.deploy-preview.environment]
HUGO_VERSION = "0.85.0"

[context.branch-deploy]
command = "hugo --gc --minify --buildDrafts --buildFuture -b $DEPLOY_PRIME_URL"

[context.branch-deploy.environment]
HUGO_VERSION = "0.85.0"

[context.next.environment]
HUGO_ENABLEGITINFO = "true"
```

## Adding Netlify CMS

You can find the getting started documentation [here](https://www.netlifycms.org/docs/intro/). You'll notice we didn't use the Hugo Template that they offer. That thing is outdated and I was unable to get it to work well with a theme for local development. It was much easier to add it to an [existing site](https://www.netlifycms.org/docs/add-to-your-site/). Read that doc. It will answer most of your questions. But here is my config.yml (make sure you use `.yml` and not `.yaml`. It only looks for the one).
```yaml
backend:
  name: git-gateway
  branch: main
  repo: jamesattensure/integratn-io

publish_mode: editorial_workflow
media_folder: "static/images"
public_folder: "/images"

collections:
  - name: "posts"
    label: "Posts"
    folder: "content/posts"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - {label: "Draft", name: draft, widget: "boolean", default: true}
      - {label: "Layout", name: "layout", widget: "hidden", default: "post"}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Categories", name: "categories", widget: "list"}
      - {label: "Tags", name: "tags", widget: "list"}
      - {label: "Series", name: series, widget: "list"}
      - {label: "No Comment", name: "nocomment", widget: "boolean", default: false}
      - {label: "Body", name: "body", widget: "markdown"}
```
Your collections are built based on your hugo [archetypes](https://gohugo.io/content-management/archetypes/). There are a couple extra widgets that I don't use. Those can be found in the [widget doc](https://www.netlifycms.org/docs/widgets)

Make sure you get through the whole doc and complete the authentication steps or anyone will be able to access the cms features.
<!--adsense-->
## Additional Things to Setup

### Analytics
Pay for netlify analytics or add [Google analytics](https://analytics.google.com/). Most themes have Google analytics baked in and you just have to add the params to your `config.yaml` to connect it. Here are the two posts I followed to get it setup. [cloudywithachanceofdevops.com](http://cloudywithachanceofdevops.com/posts/2018/05/17/setting-up-google-analytics-on-hugo/) and [gideonwolfe.com](https://gideonwolfe.com/posts/sysadmin/hugo/hugogoogleanalytics/).

Make sure you filter out your connections to your site so that you don't skew your own analytics. This blog post from [daniloaz.com](https://www.daniloaz.com/en/5-ways-to-exclude-your-own-visits-from-google-analytics/) really helped get me through it. I went with the second method of filtering out my public IP as internal traffic.

### Search
After you have Google analytics setup. You can setup [Google Search](https://search.google.com/search-console) to the same property that you setup in google analytics. It helps to have a sitemap.xml to add. The easiest way I found to do that was to use the [sitemap netlify plugin](https://github.com/netlify-labs/netlify-plugin-sitemap#readme) I recommend just installing it from the plugins tab on your Netlify site. Much easier to manage.

### Additional Plugins

Here are a couple other plugins I installed. 

[Hugo cache resources](https://github.com/cdeleeuwe/netlify-plugin-hugo-cache-resources#readme):
This plugin caches the resources folder after build. If you are processing many images, this would improve build duration significantly.

[Submit sitemap](https://github.com/cdeleeuwe/netlify-plugin-submit-sitemap#readme):
This plugin will notify the search engines after every production build about your latest sitemap. The plugin can be used without any configuration if using the defaults.

## Final Thoughts

There is a lot to learn when getting started with blogging. At the time of posting this I've only been at it a couple weeks. I spent most of that time bouncing through various starters and trying different things out to figure out what worked and what didn't. Hell, a week of that was probably just trying to pick a theme that I could live with until I understand enough to build my own theme. I hope this helped get you up and running. Enjoy and happy blogging.