"""Render a captured terminal log as a terminal window and screenshot it.

    python terminal.py LOG COMMAND OUT.png
"""
import html
import re
import sys

from playwright.sync_api import sync_playwright

ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[()][A-Z0-9]")
STATUS = re.compile(r"\b([1-5]\d\d)\b")


def colour(line: str) -> str:
    def repl(m):
        code = int(m.group(1))
        cls = "ok" if code < 400 else "warn" if code < 500 else "err"
        return f'<span class="{cls}">{m.group(1)}</span>'
    return STATUS.sub(repl, html.escape(line))

log_path, command, out = sys.argv[1:4]
raw = open(log_path, encoding="utf-8", errors="replace").read().replace("\r\n", "\n").replace("\r", "")
raw = ANSI.sub("", raw)
body = "\n".join(colour(l) for l in raw.strip("\n").split("\n"))

page_html = f"""<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>
  body {{ margin: 0; background: transparent; }}
  .win {{ width: 1100px; background: #0f172a; border-radius: 12px; overflow: hidden;
          font: 15px/1.55 "IBM Plex Mono", monospace; color: #e2e8f0; }}
  .bar {{ background: #1e293b; padding: 12px 16px; display: flex; gap: 8px; }}
  .bar i {{ width: 12px; height: 12px; border-radius: 50%; display: block; }}
  pre {{ margin: 0; padding: 18px 22px 24px; white-space: pre-wrap; font: inherit; }}
  .prompt {{ color: #fbbf24; }}
  .ok {{ color: #4ade80; }} .warn {{ color: #fbbf24; }} .err {{ color: #f87171; }}
</style>
<div class="win"><div class="bar"><i style="background:#f87171"></i><i style="background:#fbbf24"></i><i style="background:#4ade80"></i></div>
<pre><span class="prompt">$</span> {html.escape(command)}
{body}</pre></div>"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(device_scale_factor=2, viewport={"width": 1100, "height": 400})
    pg.set_content(page_html, wait_until="networkidle")
    pg.wait_for_timeout(500)
    pg.locator(".win").screenshot(path=out, omit_background=True)
    b.close()
print(out)
