# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Vision

A modern, clean WeChat Mini Program (微信小程序) BaZi tool (八字排盘) targeting younger
users. The goal is a fast, no-frills charting utility — not a traditional mysticism
site. No VIP system, no paid unlocks, no content operations. Just the core charting
tool, presented in a clean light-themed UI (no cosmic backgrounds, no animations).

AppID: `wx2bbed5a1096b2022`
Mini program root: `miniprogram/`

## Design Language

- **Light, flat, no animation.** White cards on a light-grey (`#f4f5f7`) background.
  All previous "cosmos / 3D solar system / aurora" visuals and animations have been
  removed.
- **Element colors** for 天干/地支/藏干 — shared across pages via CSS classes:
  - `el-wood` 木 `#1ba784` · `el-fire` 火 `#d8392b` · `el-earth` 土 `#9c6a3c`
  - `el-metal` 金 `#c79a2e` · `el-water` 水 `#2f6fd8`
- Accent gold `#c79a2e` / `#d6a44a`; dark bars `#1d1d1f`.

## Feature Set

### 排盘 (Input — `pages/index`)

Input fields: 姓名（选填）· 性别 男/女 · 历法 公历/农历 · 出生日期 · 出生时间 ·
出生地（选填，真太阳时用）· 真太阳时开关 · 保存记录开关.

The input page shows an **即时起局** four-pillar preview (computed live from the
current selection) but **does NOT** show the 大运 list. Tapping 开始排盘 navigates to
the result page.

### 结果页 (Result — `pages/result`)

Four top tabs: **基本信息 · 基本排盘 · 专业细盘 · 断事笔记**.

- **基本排盘** — the four-pillar table only (no 大运 list).
- **专业细盘** — the four-pillar table **plus** 大运 / 流年 / 流月 (horizontally
  scrollable, tappable; selecting a 大运 loads its 流年, selecting a 流年 loads its 流月).

Four-pillar table rows (top→bottom): 日期(柱名) · 主星 · 天干 · 地支 · 藏干 · 副星 ·
星运 · 自坐 · 神煞.

**Deliberately omitted:** 空亡 and 纳音 (per product decision).
**Priority emphasis:** 十神（主星/副星）, 自坐, 星运, 神煞.

## Development Environment

Developed and previewed in **WeChat DevTools** (微信开发者工具).

- Open the project root in DevTools (reads `project.config.json`).
- SCSS is compiled to WXSS automatically via `useCompilerPlugins: ["sass"]` — edit the
  `.scss` files; do not hand-write `.wxss`.
- npm packages are packed manually: DevTools → Tools → Build npm.

## Commands

```bash
# Lint
npx eslint miniprogram/**/*.js

# Quick sanity-check the calc engine in Node (it is a plain CommonJS module)
node -e "const b=require('./miniprogram/utils/bazi.js'); console.log(b.paipan({year:2026,month:5,day:29,hour:10,gender:'male'}))"
```

No test framework is set up.

## Architecture

### Page flow

```
index (排盘输入) → result (基本信息 / 基本排盘 / 专业细盘 / 断事笔记)
```

`pages/baziCommentary` is a legacy energy-model page; it is no longer linked from the
main flow but remains in `app.json`.

### Calculation engine — `miniprogram/utils/bazi.js`

All BaZi logic lives here as a **pure, dependency-free CommonJS module** shared by both
`index.js` (live preview) and `result.js`. It is Node-runnable for quick testing.

Public API:

| Export | Purpose |
|---|---|
| `paipan({year,month,day,hour,gender})` | Master entry. Returns the four pillars (each with stem/branch + element classes, 主星, 藏干 with 副星 ten-gods, 星运, 自坐, 神煞), `dayMaster`, `daYun` (8 steps), `daYunForward`, `startLuckText`. |
| `calcLiuNian(daYunEntry, dayStem, birthYear)` | 10 流年 for a given 大运 (gan-zhi + 虚岁 + ten-god shorthand). |
| `calcLiuYue(year, dayStem)` | 12 流月 for a 流年 (starts 立春/寅月 via 五虎遁). |
| `tenGod`, `changSheng`, `classOf`, `ganZhiOfYear`, `solarTermDate` | Helpers. |

Key internal logic:

- **四柱** — Year/month pillar via `calcYearMonth` (uses 节气 boundaries, not a day
  approximation); 立春 determines the solar year. Day pillar from a 1900-01-01 anchor.
  Hour pillar via 五鼠遁.
- **十神 (`tenGod`)** — derived from day-master vs target stem (element + yin/yang).
  Day-pillar main star renders as 元男/元女 by gender.
- **星运 / 自坐 (`changSheng`)** — 十二长生. 星运 = day-master against each pillar's
  branch; 自坐 = each pillar's own stem against its own branch.
- **神煞 (`calcShenSha`)** — a curated, widely-accepted rule set keyed by day/year stem,
  year/day 三合局, month branch, or year branch. Includes 天乙/太极/文昌/福星/天厨/国印
  贵人, 禄神, 羊刃/飞刃, 金舆, 红艳, 驿马, 桃花, 华盖, 将星, 亡神, 劫煞, 灾煞,
  天德/月德(及合), 天喜, 红鸾, 孤辰, 寡宿. (空亡 intentionally excluded.)
- **节气 (`solarTermDate`)** — 24 solar terms via the standard `[Y·0.2422 + C] − L`
  formula with separate constant tables for the 20th (1900–1999) and 21st (2000–2099)
  centuries. Day-level precision — good enough for month boundaries and 起运.
- **大运 (`calcDaYun`)** — direction by year-stem polarity × gender; 起运 from days to
  the adjacent 节 ÷ 3 = years (`calcStartLuck`). Each step carries start age/year and
  ten-god shorthand.

### UI conventions

- The four-pillar table is a single WXML `<template name="pillarTable">` reused by both
  排盘 tabs, parameterised by `{cols, showShensha}`.
- `cols` is `[年, 月, 日, 时]`, each an object spread from `paipan` output plus a `label`.
- 大运/流年/流月 are `<scroll-view scroll-x>` rows of tappable cells; selection state is
  `selectedDaYun` / `selectedLiuNian`.

## Domain Concepts (quick reference)

- 天干 (10): 甲乙丙丁戊己庚辛壬癸 · 地支 (12): 子丑寅卯辰巳午未申酉戌亥
- 藏干: each branch conceals 1–3 stems · 十神: day-master vs every other stem
- 十二长生 (星运/自坐): 长生·沐浴·冠带·临官·帝旺·衰·病·死·墓·绝·胎·养
- 大运: 10-year cycles, direction = year-stem polarity × gender
- 流年/流月: annual / monthly overlays · 节气: drive month boundaries and 起运

## Known Limitations / TODOs

- No 农历 (lunar) input conversion yet — the 历法 toggle exists but only 公历 is computed.
- No 真太阳时 (true solar time) longitude correction yet — toggle is a placeholder.
- 节气 dates are formula-estimated (±1 day); exact astronomical times are not used.
- No 子时 day-rollover handling (晚子时/早子时 treated the same).
- No local storage / 记录 page and no tab-bar navigation yet.
- 断事笔记 tab is a placeholder.
