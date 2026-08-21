#!/usr/bin/env python3
"""Rasterize homepage and section OG cards at 1200×630. Exact text, not a model."""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
W, H = 1200, 630
SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
SANS_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"


def font(path, size, index=2):
    return ImageFont.truetype(path, size, index=index)


def rr(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap(draw, text, fnt, max_width):
    if "\n" in text:
        return text.split("\n")
    lines, cur = [], ""
    for ch in text:
        trial = cur + ch
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines or [text]


def paint(path, badge, title, footer, accent, paper, kicker=""):
    r, g, b = accent
    img = Image.new("RGB", (W, H), paper)
    overlay = Image.new("RGB", (W, H), paper)
    ov = ImageDraw.Draw(overlay)
    ov.ellipse((-220, -260, 720, 420), fill=(min(255, r + 60), min(255, g + 80), min(255, b + 70)))
    ov.ellipse((780, -80, 1380, 380), fill=tuple(min(255, c + 18) for c in paper))
    img = Image.blend(img, overlay, 0.22)
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    draw = ImageDraw.Draw(img)

    margin = 48
    card = (margin, margin, W - margin, H - margin)
    rr(draw, card, 36, fill=(252, 247, 239), outline=(196, 180, 158), width=2)
    draw.rectangle((margin + 10, margin + 18, margin + 28, H - margin - 18), fill=accent)

    badge_font = font(SANS, 22)
    title_font = font(SERIF, 64)
    footer_font = font(SANS, 26)
    kicker_font = font(SANS_B, 28)
    pad_x, pad_y = 88, 78
    bx = margin + pad_x
    by = margin + pad_y

    bw = int(draw.textlength(badge, font=badge_font)) + 36
    bh = 40
    rr(draw, (bx, by, bx + bw, by + bh), 20, fill=(246, 239, 228), outline=accent, width=2)
    draw.text((bx + 18, by + 7), badge, font=badge_font, fill=(110, 100, 88))

    if kicker:
        draw.text((bx, by + 56), kicker, font=kicker_font, fill=accent)

    lines = wrap(draw, title, title_font, W - margin * 2 - pad_x * 2)
    ty = by + (96 if kicker else 78)
    for line in lines[:2]:
        draw.text((bx, ty), line, font=title_font, fill=(28, 25, 22))
        ty += 86

    draw.text((bx, H - margin - 92), footer, font=footer_font, fill=(110, 100, 88))

    seal = (W - margin - pad_x - 56, H - margin - 92 - 8, W - margin - pad_x, H - margin - 92 + 48)
    rr(draw, seal, 14, fill=accent)
    sx, sy = seal[0] + 12, seal[1] + 13
    for i, tw in enumerate((32, 26, 20)):
        draw.rounded_rectangle((sx, sy + i * 10, sx + tw, sy + i * 10 + 5), 2, fill=(243, 238, 228))

    img.save(path, "PNG", optimize=True)
    print("wrote", path, img.size)


def main():
    cards = [
        (
            "og.png",
            "非官方 · 精选目录",
            "常驻云电脑队友的\n中文目录",
            "Grok Bot 目录 · 92 条",
            (194, 59, 34),
            (247, 238, 226),
            "",
        ),
        (
            "og-official.png",
            "非官方 · 官方资源",
            "官方资源",
            "安装与第一次交接 · Grok Bot 目录",
            (194, 59, 34),
            (247, 236, 228),
            "装桌面端，建第一个 Bot",
        ),
        (
            "og-tutorials.png",
            "非官方 · 教程",
            "教程",
            "如何开始用 Grok Bot · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "上手课，不是文档目录",
        ),
        (
            "og-cases.png",
            "非官方 · 实战案例",
            "实战案例",
            "先看小土 · Grok Bot 目录",
            (46, 92, 64),
            (236, 244, 236),
            "有名字、能跟完的一篇",
        ),
        (
            "og-skills.png",
            "非官方 · 技能",
            "技能",
            "MCP 与技能包 · Grok Bot 目录",
            (110, 58, 74),
            (246, 232, 236),
            "短信 · Discord · 浏览器",
        ),
        (
            "og-reviews.png",
            "非官方 · 评测对比",
            "评测对比",
            "Grok Bot 目录",
            (28, 25, 22),
            (236, 234, 228),
            "拆开评，不混聊天助手",
        ),
        (
            "og-alternatives.png",
            "非官方 · 开源替代",
            "开源替代",
            "自托管常驻队友 · Grok Bot 目录",
            (36, 92, 102),
            (232, 242, 242),
            "不是 grok.com 聊天",
        ),
        (
            "og-community.png",
            "非官方 · 社区与坑",
            "社区与坑",
            "必读坑 · Grok Bot 目录",
            (154, 40, 28),
            (248, 232, 226),
            "同一账号不是安全边界",
        ),
        (
            "og-search.png",
            "非官方 · 搜索",
            "搜索",
            "按标题、别名和分区找 · Grok Bot 目录",
            (194, 59, 34),
            (245, 236, 220),
            "输入关键词开始",
        ),
        (
            "og-takes.png",
            "非官方 · 观点与实测",
            "观点与实测",
            "现场看法，不是产品页 · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "七篇评测和笔记",
        ),
        (
            "og-q-Slack.png",
            "非官方 · 搜索",
            "「Slack」的搜索",
            "连接插件 · Slack 工作区",
            (194, 59, 34),
            (245, 236, 220),
            "两个结果",
        ),
        (
            "og-q-Debbie.png",
            "非官方 · 搜索",
            "「Debbie」的搜索",
            "订票、啤酒和上手 · Grok Bot 目录",
            (46, 92, 64),
            (236, 244, 236),
            "有名字、能跟完",
        ),
        (
            "og-q-坑.png",
            "非官方 · 搜索",
            "「坑」的搜索",
            "安全边界和登录锁 · Grok Bot 目录",
            (154, 40, 28),
            (248, 232, 226),
            "现场，不是假设",
        ),
        (
            "og-q-定价.png",
            "非官方 · 搜索",
            "「定价」的搜索",
            "方案与用量 · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "计费文档",
        ),
        (
            "og-q-安装.png",
            "非官方 · 搜索",
            "「安装」的搜索",
            "桌面端和第一次交接 · Grok Bot 目录",
            (194, 59, 34),
            (247, 236, 228),
            "从这里开始",
        ),
        (
            "og-q-Slack-official.png",
            "非官方 · 官方资源",
            "「Slack」的搜索",
            "连接插件 · Grok Bot 目录",
            (194, 59, 34),
            (247, 236, 228),
            "一个结果",
        ),
        (
            "og-q-Slack-tutorials.png",
            "非官方 · 教程",
            "「Slack」的搜索",
            "Slack 工作区 · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "一个结果",
        ),
        (
            "og-q-Debbie-tutorials.png",
            "非官方 · 教程",
            "「Debbie」的搜索",
            "如何开始用 Grok Bot · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "一个结果",
        ),
        (
            "og-q-Debbie-cases.png",
            "非官方 · 实战案例",
            "「Debbie」的搜索",
            "订票 · 啤酒",
            (46, 92, 64),
            (236, 244, 236),
            "两个结果",
        ),
        (
            "og-q-坑-community.png",
            "非官方 · 社区与坑",
            "「坑」的搜索",
            "安全边界 · 登录锁",
            (154, 40, 28),
            (248, 232, 226),
            "两个结果",
        ),
        (
            "og-q-定价-official.png",
            "非官方 · 官方资源",
            "「定价」的搜索",
            "产品页 · 方案与用量",
            (90, 64, 24),
            (246, 240, 224),
            "三个结果",
        ),
        (
            "og-q-定价-reviews.png",
            "非官方 · 评测对比",
            "「定价」的搜索",
            "持久数字同事 · Grok Bot 目录",
            (28, 25, 22),
            (236, 234, 228),
            "一个结果",
        ),
        (
            "og-q-安装-official.png",
            "非官方 · 官方资源",
            "「安装」的搜索",
            "安装与第一次交接 · Grok Bot 目录",
            (194, 59, 34),
            (247, 236, 228),
            "一个结果",
        ),
        (
            "og-q-安装-tutorials.png",
            "非官方 · 教程",
            "「安装」的搜索",
            "第一批 Bot · Grok Bot 目录",
            (90, 64, 24),
            (246, 240, 224),
            "一个结果",
        ),

    ]
    painted = set()
    for name, badge, title, footer, accent, paper, kicker in cards:
        paint(OUT / name, badge, title, footer, accent, paper, kicker)
        painted.add(name)

    extra = ROOT / "scripts" / "og-cards.json"
    if extra.exists():
        for item in json.loads(extra.read_text()):
            name = item["file"]
            if name in painted:
                continue
            paint(
                OUT / name,
                item["badge"],
                item["title"],
                item["footer"],
                tuple(item["accent"]),
                tuple(item["paper"]),
                item.get("kicker", ""),
            )
            painted.add(name)


if __name__ == "__main__":
    main()
