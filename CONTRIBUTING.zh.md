# 如何贡献

本文只讲操作步骤。字段定义和枚举值见 [CATALOG.zh.md](CATALOG.zh.md)；产品边界和设计决策见 [PRODUCT.md](PRODUCT.md)。

本站与 xAI、SpaceXAI、Cursor 均无隶属关系。贡献内容请保持克制、可核验，不要写成软文。

## 新增一条目录条目

1. 只改 `data/catalog.json`，不要为单条资源去改 Astro 页面。
2. 在 `entries` 数组里追加一条，字段约定见 [CATALOG.zh.md § 字段](CATALOG.zh.md#字段)。
3. 本地运行 `npm run validate`，确认通过。
4. 提交拉取请求。

## 修改现有条目

就地改 `data/catalog.json` 中对应条目。`npm run validate` 通过即可。

## 改站点代码

前端是 Astro 5 静态站，TypeScript，无后端、无登录。

- 视觉和交互改 `src/`
- 校验规则改 `scripts/validate-catalog.mjs`
- GitHub Pages 工作流在 `.github/workflows/pages.yml`（本仓库用 `pages.workflow.yml` 存副本）

站点代码是 MIT；目录数据是 CC0 1.0。请不要在 `data/catalog.json` 里加入与 Grok Bot 无关的版权声明。

若改了前端，在 `npm run validate` 之外再跑一次 `npm run build`。

## 提交拉取请求

1. Fork 本仓库，从 `main` 拉出分支，例如 `add-docs-foo`。
2. `npm run validate` 必须通过。
3. 标题用中文，例如「新增：Cursor 帮助·恢复云电脑」。
4. 描述里贴上你核验过的 URL，以及你把它放进该分区的理由。

不接受：

- 把本仓库变成通用 AI 导航
- 在目录里夹带邀请码、返利、个人引流码
- 大面积重排 JSON 却不改内容（难以审）

## 自检清单

提交前逐条过一遍：

1. **链接是真的。** 用无痕窗口打开，确认不是 404，也不是「即将上线」空壳。构建脚本不代你做联网探活。
2. **一句中文说明，且是点击理由。** `blurb` 只允许一个中文句号，且必须在句末。模式：给谁看 + 能得到什么 + 有何限制。不要堆功能清单，不要把英文原文整段贴进来。禁止用「说明如何」「文档写明」「介绍如何」「演示如何」开头。仓库名、英文标题必须在 `title` 里带中文译名（如 `rakazo：自托管常驻队友`），不要把 slug 或纯拉丁文当唯一标题。
3. **分区正确。** 官方文档进 `official`；个人上手文进 `tutorials`；一次真实使用进 `cases`；仓库/插件/MCP 进 `skills`；横评进 `reviews`；自托管替代进 `alternatives`；论坛踩坑进 `community`。
4. **不要吹。** 禁止「颠覆」「革命」「必装」「官方认证」（本站不是官方）。把产品能做什么、不能做什么写清楚。
5. **一条一链。** 同一 URL 不要出现两次。同一篇文章的中英两个地址，只留读者更可能打开的那个。

官方文档以 `docs.x.ai/grok-bot` 与 `cursor.com/help/grok-bot` 为准。若某篇官方页 404，直接删条目，不要改去猜测另一个路径。
