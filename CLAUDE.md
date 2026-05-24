# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**同乐命理八字排盘** — a WeChat Mini Program (微信小程序) for Chinese BaZi (八字) astrology. Users enter gender + birth date/time, and the app calculates and displays the Four Pillars chart (四柱), Ten Gods (十神), Da Yun cycles (大运), and a Five-Elements energy analysis (五行).

AppID: `wx2bbed5a1096b2022`  
Mini program root: `miniprogram/`

## Development Environment

This project must be developed and previewed in **WeChat DevTools** (微信开发者工具). There is no web server or CLI runner — the DevTools simulator is the only way to run the app.

- Open the project root in WeChat DevTools (it reads `project.config.json` automatically).
- SASS is compiled via the built-in `useCompilerPlugins: ["sass"]` setting — no separate build step.
- npm packages are packed manually: DevTools → Tools → Build npm. The compiled output lands in `miniprogram/miniprogram_npm/` and is committed to the repo.

## Commands

```bash
# Lint (ESLint is configured but has no npm script — run directly)
npx eslint miniprogram/**/*.js

# Install / update npm deps (then rebuild npm in WeChat DevTools)
npm install
```

No test framework is set up.

## Architecture

### Page Flow

```
index  →  result  →  baziCommentary
```

- **index**: Collects gender (male/female), birth date (picker), birth time (picker). Navigates to `result` passing all three as URL params.
- **result**: Performs all BaZi calculations client-side in JS, then displays the chart and a "批八字" button that navigates to `baziCommentary`.
- **baziCommentary**: Receives the four computed pillars via URL params (`year`, `month`, `day`, `hour`) and runs a Five-Elements energy model.

### BaZi Calculation Logic (result.js)

All calculations are pure JS functions on the `Page` object — no cloud functions, no backend.

| Method | What it computes |
|---|---|
| `calculateYearPillar(adjustedYear)` | Year stem+branch from year number; adjusts year before Feb 4 |
| `calculateMonthPillar(y, m, d)` | Month pillar via year-stem→month-pillar lookup table; uses ~30.4-day approximation |
| `calculateDailyStemBranch(y, m, d)` | Day pillar via 60-cycle sexagenary formula |
| `calculateHourPillar(dayStem, time)` | Hour pillar via day-stem→hour-pillar lookup table |
| `generateDaYun(gender, yearStem, monthPillar)` | 8 Da Yun steps; direction (forward/reverse) determined by year-stem yin/yang × gender |
| `calculateAgeBasedOnSolarTerms(birthDate, forward)` | Starting age for Da Yun using hardcoded 2024 solar term dates (⚠ these dates are fixed to 2024 and need to be generalised) |
| `calculateTenGods()` | Ten Gods for stems and hidden stems of each branch |

### Five-Elements Energy Model (baziCommentary.js)

Initialises each pillar with energy values (stem=10, branch=10; hidden stems split 6/3/1 or 7/3 by count), then applies:
1. **Vertical interactions** (`applyVerticalInteractions`): within each pillar, stem vs branch using generating (相生) and overcoming (相克) rules, and BiJie (比劫).
2. **Horizontal interactions** (`applyHorizontalInteractions`): stub — not yet implemented.

### UI Components

Vant Weapp (`@vant/weapp`) is available but the current pages mostly use native WXML components. SCSS files are per-page; global styles are in `miniprogram/app.wxss` (currently empty).

## Key Domain Concepts

- **天干 Heavenly Stems**: 甲乙丙丁戊己庚辛壬癸 (10, cycling)
- **地支 Earthly Branches**: 子丑寅卯辰巳午未申酉戌亥 (12, cycling)
- **藏干 Hidden stems**: each branch conceals 1–3 stems with weighted energies
- **十神 Ten Gods**: relationship between day master stem and every other stem
- **大运 Da Yun**: 10-year major fortune cycles; direction depends on year-stem polarity × gender
- **节气 Solar terms**: used to compute Da Yun starting age (days to next/prev term ÷ 3 = years)

## Known Issues / TODOs

- Solar term dates in `calculateAgeBasedOnSolarTerms` are hardcoded to 2024 — birthdays in other years will produce wrong Da Yun starting ages.
- `applyHorizontalInteractions` is a stub.
- `calculateMonthPillar` uses a 30.4-day approximation instead of actual solar term boundaries, which causes edge-case errors near month transitions.
- `baziCommentary.wxml` is empty — the energy model output has no UI yet.
