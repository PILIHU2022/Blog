#!/usr/bin/env python3
"""Rebuild the subsetted LXGW WenKai Screen webfonts.

WenKai Screen is the body face (paragraphs, nav, metadata, tags, footer).
The full TTF is ~25 MB; the site ships a subset containing printable ASCII,
Latin-1, GB2312 level-1 hanzi, every character used under `src/`, and common
CJK punctuation.

Two outputs are produced:
* `public/fonts/lxgw-wenkai-screen-<version>.woff2` for the browser;
* `src/assets/fonts/lxgw-wenkai-screen-og.woff` for satori at build time.

Requirements:
    python3 -m pip install fonttools brotli

Usage:
    python3 scripts/subset-wenkai-font.py
    python3 scripts/subset-wenkai-font.py --font /path/to/LXGWWenKaiScreen.ttf
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = "1.522"
RELEASE_URL = (
    "https://github.com/lxgw/LxgwWenKai-Screen/releases/download/"
    f"v{VERSION}/LXGWWenKaiScreen.ttf"
)
DEFAULT_SOURCE = ROOT / ".cache" / f"LXGWWenKaiScreen-{VERSION}.ttf"
DEFAULT_WEB = ROOT / "public" / "fonts" / f"lxgw-wenkai-screen-{VERSION}.woff2"
DEFAULT_OG = ROOT / "src" / "assets" / "fonts" / "lxgw-wenkai-screen-og.woff"

TEXT_SUFFIXES = {".astro", ".ts", ".md", ".mdx", ".css"}
EMOJI_RANGES = ((0x1F000, 0x1FAFF), (0xFE00, 0xFE0F))
EXTRA_PUNCTUATION = set(
    "　、。〃々〆〇«»“”‘’—–…·×÷≈≤≥≠→←↑↓↔⇒⇔"
    "①②③④⑤⑥⑦⑧⑨⑩〔〕【】《》「」『』〖〗（）［］｛｝"
    "，．；：！？～＄％＃＆＊＋－／＼＠＾＿｀｜"
)


def is_visible(char: str) -> bool:
    code = ord(char)
    if code < 0x20:
        return False
    return not any(start <= code <= end for start, end in EMOJI_RANGES)


def site_characters() -> set[str]:
    chars = {chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0xA0, 0x100)}
    chars |= EXTRA_PUNCTUATION
    for path in (ROOT / "src").rglob("*"):
        if path.is_file() and path.suffix in TEXT_SUFFIXES:
            chars.update(c for c in path.read_text(encoding="utf-8") if is_visible(c))
    return chars


def gb2312_level_1() -> set[str]:
    chars: set[str] = set()
    for high in range(0xB0, 0xD8):
        for low in range(0xA1, 0xFF):
            try:
                chars.add(bytes([high, low]).decode("gb2312"))
            except UnicodeDecodeError:
                continue
    return chars


def ensure_source(path: Path) -> Path:
    if path.exists():
        return path
    print(f"Downloading LXGW WenKai Screen v{VERSION} ...", file=sys.stderr)
    path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(RELEASE_URL, path)  # noqa: S310 - fixed HTTPS release URL
    return path


def subset(source: Path, text_file: Path, output: Path, flavor: str) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "pyftsubset",
            str(source),
            f"--text-file={text_file}",
            f"--flavor={flavor}",
            "--layout-features=*",
            f"--output-file={output}",
        ],
        check=False,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)
        if "brotli" in result.stderr.lower():
            print("Install the WOFF2 encoder: python3 -m pip install brotli", file=sys.stderr)
        raise SystemExit(result.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", type=Path, default=DEFAULT_SOURCE, help="source TTF")
    parser.add_argument("--web", type=Path, default=DEFAULT_WEB, help="browser WOFF2 output")
    parser.add_argument("--og", type=Path, default=DEFAULT_OG, help="satori WOFF output")
    args = parser.parse_args()

    source = ensure_source(args.font)
    characters = gb2312_level_1() | site_characters()
    print(f"Subsetting {len(characters):,} characters from {source.name}")

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".txt", delete=False) as tmp:
        tmp.write("".join(sorted(characters)))
        text_file = Path(tmp.name)

    try:
        subset(source, text_file, args.web, "woff2")
        subset(source, text_file, args.og, "woff")
    finally:
        text_file.unlink(missing_ok=True)

    for output in (args.web, args.og):
        try:
            shown = output.resolve().relative_to(ROOT)
        except ValueError:
            shown = output
        print(f"Wrote {shown} ({output.stat().st_size / 1024:,.0f} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
