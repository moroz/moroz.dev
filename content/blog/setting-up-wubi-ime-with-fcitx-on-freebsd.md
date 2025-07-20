---
title: Setting up Wubi IME with Fcitx on FreeBSD
date: 2024-01-06
slug: setting-up-wubi-ime-with-fcitx-on-freebsd
summary: |
    This post describes the steps needed to set up WubiPinyin Chinese IME with Fcitx 4 on FreeBSD 13.2-RELEASE.
---

The goal of this post is to describe the steps needed to set up WubiPinyin Chinese IME with Fcitx on FreeBSD.
The reason I have decided to write this post is to retrace my steps in case I want to set up Fcitx on FreeBSD again.

## How I got here

Ever since I first started making my own money, I quickly found myself habitually buying new computers online, even during periods when there were twice as many computers as persons in my household.
It should therefore come as no surprise that around the time of the winter solstice, 2023, a time of the year that some cultures around the world tend to associate with an increased consumption of consumer goods, I pampered myself with an Intel NUC mini-computer, model RNUC12WSHI701.
The exact machine that I own comes with an i7-1260P CPU, 64 GB of DDR4 RAM, and 1 TB M.2 storage.

I first installed FreeBSD 14.0-RELEASE on it, however due to issues related to Intel Graphics drivers, I could not get hardware acceleration running with this release.
To my disbelief, I saw WiFi working out of the box and right in the installer.
However, since I am only using this machine at home, it didn't really matter to me, as I am exclusively using Ethernet anyway.
I ended up installing FreeBSD 13.2-RELEASE instead of 14, as at least in this release, loading the `i915kms` kernel module does not crash the whole system (although the Intel driver still doesn't work).

## What we are trying to achieve

Getting Fcitx configured the way I usually set it up on Linux took quite a lot of trial and error.
I have not managed to get Fcitx 5 up and running, so the following steps will only give you
Although the specific setup and combination of languages that I habitually use is hardly mainstream, I believe some of the steps may nevertheless come in handy for the members of the broader FreeBSD community, and in particular those using CJK input methods in everyday work.

My preferred way to type Chinese is using WubiPinyin, which is a combination of Wubi (五筆字型輸入法) that permits falling back to Pinyin in case I forget the Wubi codes for a specific character or word.
For Latin text, I use a layout called _Polish (Dvorak, with Polish quotes on key 1)_, because Polish happens to be my native language and that was the layout with which I learned Dvorak back in 2007.

## Install Fcitx

```shell
sudo pkg install -y fcitx zh-fcitx-{configtool,table-extra,chewing} 
```

Disable IBus startup in your desktop environment's startup application settings.

Enable Fcitx on startup:

```shell
cp /usr/local/share/applications/fcitx.desktop ~/.config/autostart
```

Add these lines to `~/.xprofile`:

```shell
export LC_CTYPE=en_US.UTF-8
export GTK_IM_MODULE=fcitx
export GTK2_IM_MODULE=fcitx
export GTK3_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
```

Sign out and sign in again. Fcitx should now start automatically and you should be able to add input methods using the Fcitx configuration tool, like so:

<figure class="bordered-figure">
<img src="/images/freebsd/fcitx-methods.webp" alt="" />
<figcaption>A screenshot of the Fcitx configuration tool listing two input methods.</figcaption>
</figure>

This way, the input should already be working.
However, due to the fact that my Latin keyboard layout is based on Dvorak, and my Chinese layout is based on QWERTY, I needed to override the layout used by WubiPinyin so that these two could switch layouts as needed.

This can be done in the file `~/.config/fcitx/data/layout_override`:

```
wbpy,us
```

Lastly, by default, Wubi confirms input if the combination entered corresponds to only one possible character or word.
I have always found it confusing and have always disabled this behavior.
This can be done by changing two lines in `/usr/local/share/fcitx/table/wbpy.conf` like this:

```
AutoSend=0
NoneMatchAutoSend=0
```
