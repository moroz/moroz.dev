---
title: Setting up Wubi IME with Fcitx on FreeBSD
date: 2024-01-06
slug: setting-up-wubi-ime-on-freebsd
---

The goal of this post is to describe the steps needed to set up WubiPinyin Chinese IME with Fcitx.
Although the specific setup and combination of languages that I habitually use is hardly mainstream, I believe some of the steps may come in handy for the members of the broader FreeBSD community.
The reason I have decided to write this post is to retrace my steps in case I want to set up Fcitx again.

Ever since I first started making my own money, I quickly found myself habitually buying new computers online, even during periods when there were twice as many computers as persons in my household.
It should therefore come as no surprise that around the time of the winter solstice, 2023, a time of the year that some cultures around the world tend to associate with an increased consumption of consumer goods, I pampered myself with an Intel NUC mini-computer, model RNUC12WSHI701.
The exact machine that I own comes with an i7-1260P CPU, 64 GB of DDR4 RAM, and 1 TB M.2 storage.

I first installed FreeBSD 14.0-RELEASE on it, however due to issues related to Intel Graphics drivers, I could not get hardware acceleration running with this release.
To my disbelief, I saw WiFi working out of the box and right in the installer.
However, since I am only using this machine at home, it didn't really matter to me, as I am exclusively using Ethernet anyway.
I ended up installing FreeBSD 13.2-RELEASE instead of 14, as at least in this release, loading the `i915kms` kernel module does not crash the whole system (although the Intel driver still doesn't work).

Getting Fcitx configured the way I usually set it up on Linux took quite a lot of trial and error.
My preferred way to type Chinese is using WubiPinyin, which is a combination of Wubi (五筆字型輸入法) with fallback to Pinyin input in case I forget the Wubi codes for a specific character or word.
For Latin text, I use 

## Install fcitx
