# Grok Bot 导航

非官方的 Grok Bot 中文目录。Git 管内容，网站只负责给人看。

**本站与 xAI、SpaceXAI、Cursor 均无隶属、赞助或合作关系。**

在线阅读：<https://ddhjy.github.io/grok-bot-hub/>

## 五分钟上手

需要 Node.js 22。

```bash
git clone https://github.com/ddhjy/grok-bot-hub.git
cd grok-bot-hub
npm install
npm run dev          # 打开 http://localhost:4321/grok-bot-hub/
```

试着添加一条目录条目——打开 `data/catalog.json`，在 `entries` 数组末尾追加：

```json
{
  "id": "my-first-entry",
  "added": "2026-08-28",
  "title": "我的第一条",
  "url": "https://example.com",
  "blurb": "用一句中文说清为什么要点这条链接。",
  "section": "tutorials",
  "tags": ["上手"]
}
```

运行校验：

```bash
npm run validate     # 通过了再提交
```

如果只想浏览或改前端，跳过 `catalog.json`，直接跑 `npm run dev`。

## 文档地图

本仓库的文档按 [Divio 四象限](https://docs.divio.com/documentation-system/) 组织：

| 象限 | 文件 | 读谁 |
| --- | --- | --- |
| **Tutorial** 入门引导 | 本文件上方「五分钟上手」 | 第一次 clone 的人 |
| **How-to** 操作指南 | [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md) | 要提拉取请求的贡献者 |
| **Reference** 技术参考 | [CATALOG.zh.md](CATALOG.zh.md) | 写 JSON 或改校验脚本的人 |
| **Explanation** 设计解释 | [PRODUCT.md](PRODUCT.md) | 想理解决策理由的人 |

## 许可

- 站点代码（页面、样式、脚本）：[MIT](LICENSE)，Copyright 2026 KAI ddhjy
- 目录数据（`data/catalog.json`）：[CC0 1.0](LICENSE-CATALOG)

## 致谢

链接种子参考了 [RongleCat/awesome-grok-bot](https://github.com/RongleCat/awesome-grok-bot)（CC0 清单）以及 `docs.x.ai/grok-bot`、`cursor.com/help/grok-bot` 中已核验可打开的官方文档。本站重写了中文说明，不复制其品牌物料、微信群二维码或线下活动信息。

官方产品页：<https://x.ai/bot>
