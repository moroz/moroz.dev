"""Screenshot a page at desktop and phone size.

    python shoot.py URL OUT_PREFIX [--cookie NAME=VALUE] [--wait SELECTOR]

Writes OUT_PREFIX-desktop.png (1440x900 CSS px at 2x) and OUT_PREFIX-mobile.png
(390x844 at 3x). HTTPS errors are ignored (self-signed local certificates).
"""
import argparse
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

VIEWPORTS = {
    "desktop": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2),
    "mobile": dict(
        viewport={"width": 390, "height": 844},
        device_scale_factor=3,
        is_mobile=True,
        has_touch=True,
    ),
}

p = argparse.ArgumentParser()
p.add_argument("url")
p.add_argument("out")
p.add_argument("--cookie")
p.add_argument("--wait")
p.add_argument("--only", choices=list(VIEWPORTS))
# Pages with a live connection (Server-Sent Events) never reach networkidle.
p.add_argument("--wait-until", default="networkidle", choices=["load", "networkidle"])
p.add_argument("--settle", type=int, default=1500, help="ms to wait after loading")
args = p.parse_args()

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for name, opts in VIEWPORTS.items():
        if args.only and name != args.only:
            continue
        ctx = browser.new_context(ignore_https_errors=True, locale="de-CH", **opts)
        if args.cookie:
            k, v = args.cookie.split("=", 1)
            u = urlsplit(args.url)
            ctx.add_cookies([{"name": k, "value": v, "url": f"{u.scheme}://{u.netloc}/"}])
        page = ctx.new_page()
        page.goto(args.url, wait_until=args.wait_until, timeout=60_000)
        if args.wait:
            page.wait_for_selector(args.wait, timeout=30_000)
        page.wait_for_timeout(args.settle)  # web fonts, transitions, live data
        page.screenshot(path=f"{args.out}-{name}.png")
        print(f"{args.out}-{name}.png")
        ctx.close()
    browser.close()
