# 目录数据参考

本文件是 `data/catalog.json` 的技术参考。操作步骤见 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md)；设计决策见 [PRODUCT.md](PRODUCT.md)。

## 文件结构

```json
{
  "updated": "YYYY-MM-DD",
  "sections": [{ "id": "...", "label": "..." }],
  "entries": [{ ... }]
}
```

`updated` 是最近一次修改日期（上海时区）。`sections` 定义分区顺序和中文标签。`entries` 是全部条目的有序数组。

## 字段

| 字段 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `id` | 是 | `string` | 全仓库唯一，小写 kebab-case |
| `added` | 否 | `string` | 收录日期 `YYYY-MM-DD`（上海时区） |
| `title` | 是 | `string` | 卡片标题，中文优先；英文专有名词可放在标题里或 `aliases` |
| `url` | 是 | `string` | 真实可打开的 `https` 地址，不带跟踪参数 |
| `blurb` | 是 | `string` | 一句中文，以中文句号「。」结尾 |
| `section` | 是 | `SectionId` | 七个分区 id 之一，见下表 |
| `tags` | 否 | `string[]` | 从闭集标签表中取，最多 5 个 |
| `aliases` | 否 | `string[]` | 检索别名（英文原题、拼音、同义词） |
| `cluster` | 否 | `ClusterId` | 仅 `official` 分区使用，见下表 |
| `featured` | 否 | `boolean` | 仅 `official` 分区：在对应分组里置顶 |

## 分区

| `section` id | 中文标签 | 收什么 |
| --- | --- | --- |
| `official` | 官方资源 | `docs.x.ai/grok-bot` 与 `cursor.com/help/grok-bot` 的官方文档 |
| `tutorials` | 教程 | 个人上手教程和编制指南 |
| `cases` | 实战案例 | 一次真实使用的记录 |
| `skills` | 技能/插件/MCP | GitHub 仓库、插件和 MCP 服务 |
| `reviews` | 评测对比 | 横向评测和替代品比较 |
| `alternatives` | 开源替代 | 自托管方案和非官方包 |
| `community` | 社区与坑 | 论坛讨论、踩坑现场、社区清单 |

## 官方分区集群

仅 `section: "official"` 的条目可设 `cluster`：

| `cluster` id | 含义 |
| --- | --- |
| `start` | 入门 |
| `computer` | 电脑 |
| `billing` | 计费 |
| `safety` | 安全 |

## 标签闭集

只能从以下闭集取值，不要新建标签：

| 标签 | 含义 |
| --- | --- |
| `坑` | 踩坑、风控、边界 |
| `上手` | 安装、第一次、教程 |
| `文档` | 官方 / Cursor 帮助、发布与概念 |
| `排障` | 连不上、登录、恢复 |
| `用量` | 额度、定价、开通、订阅 |
| `安全` | 审批、隐私、密钥 |
| `编制` | 怎么编队伍、交接、岗位 |
| `电脑操作` | 云电脑、桌面、在电脑里干活 |
| `插件` | 插件、技能、MCP、第三方连接 |
| `视频` | 以视频为主 |
| `开源` | 自托管与替代 |
| `对比` | 横评、对 ChatGPT / Claude / OpenClaw |
| `销售` | 销售岗位 |
| `工程` | 工程岗位 |
| `购物` | 购物岗位 |
| `iOS` | iOS 端 |
| `Linux` | Linux 端 |
| `日文` | 日文来源 |

## 收录范围

只收 **Grok Bot** 这一个产品：常驻云电脑上的 AI 队友（xAI/SpaceXAI + Cursor，2026-08-11 上线）。

不收：

- grok.com 网页聊天
- Grok Imagine / 生图
- 只评 Grok 4.x 模型、几乎不谈 Bot 云电脑的文章
- 失效链接、缩短链接、需要登录才能确认存在的空页
- 微信群二维码、线下活动物料、其他站点的品牌视觉
- 编造的用量数字、排名、「第一」「最强」一类空话

拿不准时，先读官方总览：<https://docs.x.ai/grok-bot/overview>

## 构建脚本

| 命令 | 作用 |
| --- | --- |
| `npm run validate` | 运行 `scripts/validate-catalog.mjs` + `scripts/check-search.mjs`，校验 JSON 格式与字段约束 |
| `npm run og` | 运行 `scripts/write-og-cards.mjs` + `scripts/generate-og.py`，生成 Open Graph 卡片图 |
| `npm run build` | validate + og + `astro build`，产出 `dist/` 目录 |
| `npm run dev` | `astro dev`，本地开发服务器 `http://localhost:4321/grok-bot-hub/` |
| `npm run preview` | `astro preview`，预览已构建的 `dist/` |

站点发布在 GitHub Pages，仓库为 `ddhjy/grok-bot-hub`，站点根路径 `/grok-bot-hub/`。构建由 GitHub Actions 完成（`pages.workflow.yml`）。

## TypeScript 类型

源码中的核心类型定义在 `src/lib/catalog.ts`：

- `SectionId` — 七个分区 id 的联合类型
- `ClusterId` — 官方分区四个集群 id 的联合类型
- `CatalogEntry` — 单条目录条目的接口
- `Catalog` — 整个 `catalog.json` 的接口
