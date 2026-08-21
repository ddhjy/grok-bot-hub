# 如何贡献

感谢你来补这条非官方导航。本仓库的内容在 Git 里，网站只是目录的展示层。

本站与 xAI、SpaceXAI、Cursor 均无隶属关系。贡献内容请保持克制、可核验，不要写成软文。

## 范围

只收录 **Grok Bot** 这一个产品：常驻云电脑上的 AI 队友（xAI/SpaceXAI + Cursor，2026-08-11 上线）。

不要提交：

- grok.com 网页聊天
- Grok Imagine / 生图
- 只评 Grok 4.x 模型、几乎不谈 Bot 云电脑的文章
- 失效链接、缩短链接、需要登录才能确认存在的空页
- 微信群二维码、线下活动物料、其他站点的品牌视觉
- 编造的用量数字、排名、「第一」「最强」一类空话

拿不准时，先读官方总览：<https://docs.x.ai/grok-bot/overview>

## 新增或修改一条目录

1. 只改 [`data/catalog.json`](data/catalog.json)，不要为单条资源去改 Astro 页面。
2. 在对应 `section` 的条目数组里追加或就地修改。
3. 本地运行 `npm run validate`，确认通过。
4. 打开拉取请求，用一两句中文说明这条资源为什么属于 Grok Bot。

字段约定：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 全仓库唯一，小写 kebab-case |
| `title` | 是 | 卡片标题，中文优先，可保留专有名词 |
| `url` | 是 | 真实可打开的 `https` 地址，不要跟踪参数 |
| `blurb` | 是 | **一句**中文，以「。」结尾 |
| `section` | 是 | 七个分区 id 之一 |
| `tags` | 否 | 短标签数组，便于检索 |

分区 id 与中文标签必须与仓库里现有的 `sections` 数组一致：

- `official` 官方资源
- `tutorials` 教程
- `cases` 实战案例
- `skills` 技能/插件/MCP
- `reviews` 评测对比
- `alternatives` 开源替代
- `community` 社区与坑

## 质量门槛

提交前请自检：

1. **链接是真的。** 用无痕窗口打开，确认不是 404，也不是「即将上线」空壳。构建脚本不代你做联网探活。
2. **一句中文说明。** `blurb` 只允许一个中文句号，且必须在句末。不要堆功能清单，不要把英文原文整段贴进来。
3. **分区正确。** 官方文档进 `official`；个人上手文进 `tutorials`；一次真实使用进 `cases`；仓库/插件/MCP 进 `skills`；横评进 `reviews`；自托管替代进 `alternatives`；论坛踩坑进 `community`。
4. **不要吹。** 禁止「颠覆」「革命」「必装」「官方认证」（本站不是官方）。把产品能做什么、不能做什么写清楚。
5. **一条一链。** 同一 URL 不要出现两次。同一篇文章的中英两个地址，只留读者更可能打开的那个。

官方文档以 `docs.x.ai/grok-bot` 与 `cursor.com/help/grok-bot` 为准。若某篇官方页 404，直接删条目，不要改去猜测另一个路径。

## 拉取请求流程

1. Fork 本仓库，从 `main` 拉出分支，例如 `add-docs-foo`。
2. 修改 `data/catalog.json`（若改站点代码，请在描述里单独说明）。
3. `npm run validate` 必须通过；若改了前端，再跑 `npm run build`。
4. 拉取请求标题用中文，例如「新增：Cursor 帮助·恢复云电脑」。
5. 描述里贴上你核验过的 URL，以及你把它放进该分区的理由。
6. 维护者可能要求缩短 `blurb`、改分区或去掉无法打开的链接。请把讨论留在拉取请求里。

不接受：

- 把本仓库变成通用 AI 导航
- 在目录里夹带邀请码、返利、个人民流码
- 大面积重排 JSON 却不改内容（难以审）

## 改站点代码

前端是 Astro 5 静态站，TypeScript，无后端、无登录。

- 视觉和交互改 `src/`
- 校验规则改 `scripts/validate-catalog.mjs`
- GitHub Pages 工作流在 `.github/workflows/pages.yml`

站点代码是 MIT；目录数据是 CC0 1.0。请不要在 `data/catalog.json` 里加入与 Grok Bot 无关的版权声明或水印。
