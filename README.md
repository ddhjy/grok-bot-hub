# Grok Bot 导航

非官方的 Grok Bot 资源导航。内容写在 Git 里，网站只负责给人看。

**本站与 xAI、SpaceXAI、Cursor 均无隶属、赞助或合作关系。**

在线阅读：<https://ddhjy.github.io/grok-bot-hub/>

## Grok Bot 是什么（也不是什么）

Grok Bot 是 2026-08-11 由 xAI/SpaceXAI 与 Cursor 推出的 always-on AI 队友：每个账号有一台持久云电脑（浏览器、文件、终端），合上笔记本它也继续干活。

它**不是**：

- grok.com 上的聊天窗口
- Grok Imagine
- 一篇 Grok 4.x 模型评测

如果你要找的是模型、生图或网页聊天，请离开本站，去对应产品页。

## Git 管内容，网站给人看

- 目录的唯一数据源是 [`data/catalog.json`](data/catalog.json)
- 静态前端读这份 JSON，按分区做成可搜索的卡片目录
- 增删改条目 = 改 JSON 并发拉取请求，不必改页面结构

条目结构：

```json
{
  "id": "docs-get-started",
  "title": "安装与第一次交接",
  "url": "https://docs.x.ai/grok-bot/get-started",
  "blurb": "说明如何安装桌面端并用 Cursor 账号创建第一个 Bot。",
  "section": "official",
  "tags": ["文档", "上手"]
}
```

`blurb` 必须是**一句中文**，以中文句号「。」结尾。`section` 只能是：

| id | 中文 |
| --- | --- |
| `official` | 官方资源 |
| `tutorials` | 教程 |
| `cases` | 实战案例 |
| `skills` | 技能/插件/MCP |
| `reviews` | 评测对比 |
| `alternatives` | 开源替代 |
| `community` | 社区与坑 |

质量要求、范围和拉取请求流程见 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md)。

## 本地开发

需要 Node.js 22。

```bash
npm install
npm run dev
```

默认打开 <http://localhost:4321/grok-bot-hub/>。

```bash
npm run validate   # 校验目录 JSON
npm run build      # 校验 + 生产构建
npm run preview    # 预览 dist
```

站点发布在 GitHub Pages，仓库用户为 `ddhjy`，仓库名为 `grok-bot-hub`，站点根路径是 `/grok-bot-hub/`。构建由 [GitHub Actions](.github/workflows/pages.yml) 完成。

## 许可

- 站点代码（页面、样式、脚本）：[MIT](LICENSE)，Copyright 2026 KAI ddhjy
- 目录数据（`data/catalog.json`）：[CC0 1.0](LICENSE-CATALOG)

## 致谢与边界

链接种子参考了 [RongleCat/awesome-grok-bot](https://github.com/RongleCat/awesome-grok-bot)（CC0 清单）以及 `docs.x.ai/grok-bot`、`cursor.com/help/grok-bot` 中已核验可打开的官方文档。本站重写了中文说明，不复制其品牌物料、微信群二维码或线下活动信息。

官方产品页：<https://x.ai/bot>
