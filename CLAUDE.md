# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Vision

**同乐命理八字排盘** — a modern, clean WeChat Mini Program (微信小程序) BaZi tool targeting younger users. The goal is a fast, no-frills astrology utility, not a traditional mysticism site. No VIP system, no paid unlocks, no content operations — just the core charting tool.

AppID: `wx2bbed5a1096b2022`  
Mini program root: `miniprogram/`

## Target Feature Set

### Tab 1 — 排盘（Input & Result）

**Input fields:**
- 姓名（optional）
- 性别：男 / 女
- 出生日期 + 出生时间
- 日期类型：公历 / 农历
- 出生地（optional，for true solar time correction）
- 是否真太阳时（optional）
- 是否保存到记录（optional）

**Result page must show:**
- 基本信息（出生阳历 / 阴历）
- 四柱盘面：年柱、月柱、日柱、时柱，每柱含天干、地支、藏干、十神/副星、星运、自坐
- 大运（8 cycles）
- 流年（current + surrounding years）
- 神煞、流月 — deferred to later phases

**Priority order:** 四柱盘面 → 大运 → 流年

### Tab 2 — 记录

- List of saved charts: name, gender, birth date, four-pillar summary
- Tap to re-enter result page
- Delete records
- Optional: search by name, sort by time/pinyin

### Tab 3 — 我的

- WeChat avatar / nickname (OAuth)
- Chart count
- Settings / About / Clear cache
- No membership or VIP

## Development Environment

Must be developed and previewed in **WeChat DevTools** (微信开发者工具) — no web server or CLI runner.

- Open the project root in WeChat DevTools (reads `project.config.json` automatically).
- SASS compiled via `useCompilerPlugins: ["sass"]` — no separate build step.
- npm packages packed manually: DevTools → Tools → Build npm. Output lands in `miniprogram/miniprogram_npm/` and is committed to the repo.

## Commands

```bash
# Lint
npx eslint miniprogram/**/*.js

# Install / update npm deps (then rebuild npm in WeChat DevTools)
npm install
```

No test framework is set up.

## Current Architecture

### Page Flow (v1.0 — being refactored)

```
index  →  result  →  baziCommentary
```

The target structure adds bottom tab navigation and a records page:

```
tabBar: 排盘(index) | 记录(records) | 我的(profile)
排盘 → result → baziCommentary
```

### BaZi Calculation Logic (result.js)

All calculations are pure JS on the `Page` object — no cloud functions, no backend.

| Method | What it computes |
|---|---|
| `calculateYearPillar(adjustedYear)` | Year stem+branch; adjusts for dates before Feb 4 |
| `calculateMonthPillar(y, m, d)` | Month pillar via year-stem→month-pillar table; ⚠ uses ~30.4-day approximation |
| `calculateDailyStemBranch(y, m, d)` | Day pillar via 60-cycle sexagenary formula |
| `calculateHourPillar(dayStem, time)` | Hour pillar via day-stem→hour-pillar table |
| `generateDaYun(gender, yearStem, monthPillar)` | 8 Da Yun steps; forward/reverse by year-stem yin/yang × gender |
| `calculateAgeBasedOnSolarTerms(birthDate, forward)` | Da Yun starting age; ⚠ solar term dates hardcoded to 2024 |
| `calculateTenGods()` | Ten Gods for stems and hidden stems of each branch |

### Five-Elements Energy Model (baziCommentary.js)

Initialises each pillar: stem=10, branch=10; hidden stems split 6/3/1 or 7/3 by count. Applies:
1. **Vertical interactions** (`applyVerticalInteractions`): stem vs branch — generating (相生), overcoming (相克), BiJie (比劫).
2. **Horizontal interactions** (`applyHorizontalInteractions`): stub, not yet implemented.

### UI

Vant Weapp (`@vant/weapp`) is available but pages mostly use native WXML. SCSS per-page; `miniprogram/app.wxss` is currently empty.

## Key Domain Concepts

- **天干 Heavenly Stems**: 甲乙丙丁戊己庚辛壬癸 (10, cycling)
- **地支 Earthly Branches**: 子丑寅卯辰巳午未申酉戌亥 (12, cycling)
- **藏干 Hidden stems**: each branch conceals 1–3 stems with weighted energies
- **十神 Ten Gods**: relationship between the day master stem and every other stem
- **大运 Da Yun**: 10-year major fortune cycles; direction depends on year-stem polarity × gender
- **流年 Liu Nian**: annual fortune overlay on the natal chart
- **节气 Solar terms**: used to compute Da Yun starting age (days to next/prev term ÷ 3 = years)

## Known Issues / TODOs

- Solar term dates in `calculateAgeBasedOnSolarTerms` are hardcoded to 2024 — wrong for all other birth years.
- `applyHorizontalInteractions` is a stub (clashes, combinations, harms, punishments not implemented).
- `calculateMonthPillar` uses a 30.4-day approximation — edge cases near solar term boundaries are wrong.
- `baziCommentary.wxml` is empty — energy model has no UI.
- No lunar calendar (农历) conversion yet — required for the input page.
- No 真太阳时 (true solar time) correction yet — requires longitude-based UTC offset.
- No local storage / records page yet.
- No tab bar navigation yet.
