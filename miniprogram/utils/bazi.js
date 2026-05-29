// bazi.js — 八字排盘核心算法（纯函数，无依赖）
// 提供：四柱、十神、藏干、星运（十二长生）、自坐、神煞、大运、流年、流月
// 节气按 1900–2099 通用公式估算（日级精度），用于月柱分界与起运计算。

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干五行 / 阴阳
const STEM_INFO = {
  甲: { el: '木', yang: true }, 乙: { el: '木', yang: false },
  丙: { el: '火', yang: true }, 丁: { el: '火', yang: false },
  戊: { el: '土', yang: true }, 己: { el: '土', yang: false },
  庚: { el: '金', yang: true }, 辛: { el: '金', yang: false },
  壬: { el: '水', yang: true }, 癸: { el: '水', yang: false }
}

// 地支五行
const BRANCH_EL = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
}

// 五行 -> 颜色 class
const EL_CLASS = { 木: 'el-wood', 火: 'el-fire', 土: 'el-earth', 金: 'el-metal', 水: 'el-water' }

function elOf(ch) {
  return STEM_INFO[ch] ? STEM_INFO[ch].el : (BRANCH_EL[ch] || '')
}
function classOf(ch) {
  return EL_CLASS[elOf(ch)] || ''
}

// 藏干表（按本气、中气、余气顺序）
const HIDDEN = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
}

// ---------------- 十神 ----------------
const GEN = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' } // 我生
const CTRL = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' } // 我克

function tenGod(dayStem, target) {
  const d = STEM_INFO[dayStem]
  const t = STEM_INFO[target]
  if (!d || !t) return ''
  const same = d.yang === t.yang
  if (d.el === t.el) return same ? '比肩' : '劫财'
  if (GEN[d.el] === t.el) return same ? '食神' : '伤官'
  if (CTRL[d.el] === t.el) return same ? '偏财' : '正财'
  if (GEN[t.el] === d.el) return same ? '偏印' : '正印' // 生我者为印
  if (CTRL[t.el] === d.el) return same ? '七杀' : '正官' // 克我者为官杀
  return ''
}

// 十神缩写（用于大运/流年小字标注）
const TEN_GOD_SHORT = {
  比肩: '比', 劫财: '劫', 食神: '食', 伤官: '伤', 偏财: '才', 正财: '财',
  七杀: '杀', 正官: '官', 偏印: '枭', 正印: '印'
}

// ---------------- 十二长生 ----------------
const CHANGSHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']
// 各天干长生起点地支
const CS_START = {
  甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申',
  乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯'
}
function changSheng(stem, branch) {
  const info = STEM_INFO[stem]
  if (!info) return ''
  const start = BRANCHES.indexOf(CS_START[stem])
  const b = BRANCHES.indexOf(branch)
  if (start < 0 || b < 0) return ''
  let steps = info.yang ? b - start : start - b
  steps = ((steps % 12) + 12) % 12
  return CHANGSHENG[steps]
}

// ---------------- 节气 ----------------
// 21 世纪 (2000-2099) 与 20 世纪 (1900-1999) 各节气 C 常数，顺序自小寒起
const C21 = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94]
const C20 = [6.11, 20.84, 4.6295, 19.4599, 6.3826, 21.4155, 5.59, 20.888, 6.318, 21.86, 6.5, 22.2, 7.928, 23.65, 8.35, 23.95, 8.44, 23.822, 9.098, 24.218, 8.218, 23.08, 7.9, 22.6]
// 24 节气所在公历月（与 C 常数同序）
const TERM_MONTH = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12]

// 返回某年某节气（termIndex 0..23，自小寒起）的公历日（Date 对象，正午）
function solarTermDate(year, termIndex) {
  let C, Y
  if (year >= 2000) { C = C21[termIndex]; Y = year - 2000 }
  else { C = C20[termIndex]; Y = year - 1900 }
  const day = Math.floor(Y * 0.2422 + C) - Math.floor((Y - 1) / 4)
  return new Date(year, TERM_MONTH[termIndex] - 1, day, 12, 0, 0)
}

// 12 个"节"（划分月柱），termIndex 自小寒起：小寒=0,立春=2,...大雪=22
// 月支顺序：小寒->丑, 立春->寅, ... 大雪->子
const NODE_TERMS = [
  { ti: 2, branch: '寅', mNo: 1 },   // 立春
  { ti: 4, branch: '卯', mNo: 2 },   // 惊蛰
  { ti: 6, branch: '辰', mNo: 3 },   // 清明
  { ti: 8, branch: '巳', mNo: 4 },   // 立夏
  { ti: 10, branch: '午', mNo: 5 },  // 芒种
  { ti: 12, branch: '未', mNo: 6 },  // 小暑
  { ti: 14, branch: '申', mNo: 7 },  // 立秋
  { ti: 16, branch: '酉', mNo: 8 },  // 白露
  { ti: 18, branch: '戌', mNo: 9 },  // 寒露
  { ti: 20, branch: '亥', mNo: 10 }, // 立冬
  { ti: 22, branch: '子', mNo: 11 }, // 大雪
  { ti: 0, branch: '丑', mNo: 12 }   // 小寒
]

// ---------------- 四柱 ----------------
function yearPillarIndex(solarYear) {
  // 以立春为界，调用方需先传入立春调整后的年
  let s = (solarYear - 4) % 10
  let b = (solarYear - 4) % 12
  if (s < 0) s += 10
  if (b < 0) b += 12
  return { stem: STEMS[s], branch: BRANCHES[b], si: s, bi: b }
}

// 五虎遁：年干 -> 正月(寅)月干起点
const YIN_MONTH_START = [2, 4, 6, 8, 0] // index = yearStemIndex % 5  -> 丙戊庚壬甲

// 日柱：以 1900-01-01 为甲戌日基准
function dayPillarIndex(year, month, day) {
  const base = Date.UTC(1900, 0, 1)
  const target = Date.UTC(year, month - 1, day)
  const diff = Math.round((target - base) / 86400000)
  let s = (diff + 10) % 10
  let b = (diff + 10) % 12
  if (s < 0) s += 10
  if (b < 0) b += 12
  return { stem: STEMS[s], branch: BRANCHES[b], si: s, bi: b }
}

// 五鼠遁：日干 -> 子时时干起点
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8] // index = dayStemIndex

function hourPillarIndex(dayStemIndex, hour) {
  const bi = Math.floor((hour + 1) / 2) % 12
  const si = (HOUR_STEM_START[dayStemIndex] + bi) % 10
  return { stem: STEMS[si], branch: BRANCHES[bi], si, bi }
}

// 计算年柱 / 月柱（含节气分界）
function calcYearMonth(year, month, day) {
  // 立春日（当年）
  const lichun = solarTermDate(year, 2)
  const birth = new Date(year, month - 1, day, 12, 0, 0)

  // 立春前算上一年
  let solarYear = year
  if (birth < lichun) solarYear = year - 1
  const yp = yearPillarIndex(solarYear)

  // 确定月支：找到 <= birth 的最后一个"节"
  // 收集本年与上一年末的节，按时间排序
  const nodes = []
  for (let i = 0; i < NODE_TERMS.length; i++) {
    const n = NODE_TERMS[i]
    // 小寒在公历1月，属于上一个农历年的丑月
    const d = solarTermDate(year, n.ti)
    nodes.push({ date: d, branch: n.branch, mNo: n.mNo })
  }
  // 也要考虑去年大雪/小寒边界（1月初出生时）——加入去年12月大雪
  nodes.push({ date: solarTermDate(year - 1, 22), branch: '子', mNo: 11 })
  nodes.sort((a, b) => a.date - b.date)

  let chosen = nodes[0]
  for (let i = 0; i < nodes.length; i++) {
    if (birth >= nodes[i].date) chosen = nodes[i]
  }
  const monthBranch = chosen.branch
  const mNo = chosen.mNo

  // 月干：五虎遁，年干用 solarYear 的年干
  const startStem = YIN_MONTH_START[((solarYear - 4) % 10 + 10) % 10 % 5]
  const monthStemIndex = (startStem + (mNo - 1)) % 10

  return {
    year: { stem: yp.stem, branch: yp.branch, si: yp.si, bi: yp.bi },
    month: { stem: STEMS[monthStemIndex], branch: monthBranch, si: monthStemIndex, bi: BRANCHES.indexOf(monthBranch) },
    solarYear
  }
}

// ---------------- 神煞 ----------------
// 三合局键：年支/日支 -> 局
function sanHeKey(branch) {
  if ('申子辰'.indexOf(branch) >= 0) return '申子辰'
  if ('寅午戌'.indexOf(branch) >= 0) return '寅午戌'
  if ('巳酉丑'.indexOf(branch) >= 0) return '巳酉丑'
  if ('亥卯未'.indexOf(branch) >= 0) return '亥卯未'
  return ''
}

const SHENSHA = {
  天乙贵人: { by: 'stem', refs: ['day', 'year'], map: { 甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'], 乙: ['子', '申'], 己: ['子', '申'], 丙: ['亥', '酉'], 丁: ['亥', '酉'], 壬: ['巳', '卯'], 癸: ['巳', '卯'], 辛: ['午', '寅'] } },
  太极贵人: { by: 'stem', refs: ['day', 'year'], map: { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] } },
  文昌贵人: { by: 'stem', refs: ['day', 'year'], map: { 甲: ['巳'], 乙: ['午'], 丙: ['申'], 戊: ['申'], 丁: ['酉'], 己: ['酉'], 庚: ['亥'], 辛: ['子'], 壬: ['寅'], 癸: ['卯'] } },
  福星贵人: { by: 'stem', refs: ['day', 'year'], map: { 甲: ['寅'], 丙: ['寅'], 乙: ['丑'], 癸: ['丑'], 丁: ['卯'], 戊: ['申'], 己: ['未'], 庚: ['午'], 辛: ['巳'], 壬: ['辰'] } },
  天厨贵人: { by: 'stem', refs: ['day'], map: { 甲: ['巳'], 乙: ['午'], 丙: ['巳'], 丁: ['午'], 戊: ['申'], 己: ['酉'], 庚: ['亥'], 辛: ['子'], 壬: ['寅'], 癸: ['卯'] } },
  国印贵人: { by: 'stem', refs: ['day', 'year'], map: { 甲: ['戌'], 乙: ['亥'], 丙: ['丑'], 丁: ['寅'], 戊: ['丑'], 己: ['寅'], 庚: ['辰'], 辛: ['巳'], 壬: ['未'], 癸: ['申'] } },
  禄神: { by: 'stem', refs: ['day'], map: { 甲: ['寅'], 乙: ['卯'], 丙: ['巳'], 戊: ['巳'], 丁: ['午'], 己: ['午'], 庚: ['申'], 辛: ['酉'], 壬: ['亥'], 癸: ['子'] } },
  羊刃: { by: 'stem', refs: ['day'], map: { 甲: ['卯'], 丙: ['午'], 戊: ['午'], 庚: ['酉'], 壬: ['子'], 乙: ['寅'], 丁: ['巳'], 己: ['巳'], 辛: ['申'], 癸: ['亥'] } },
  飞刃: { by: 'stem', refs: ['day'], map: { 甲: ['酉'], 丙: ['子'], 戊: ['子'], 庚: ['卯'], 壬: ['午'], 乙: ['申'], 丁: ['亥'], 己: ['亥'], 辛: ['寅'], 癸: ['巳'] } },
  金舆: { by: 'stem', refs: ['day'], map: { 甲: ['辰'], 乙: ['巳'], 丙: ['未'], 丁: ['申'], 戊: ['未'], 己: ['申'], 庚: ['戌'], 辛: ['亥'], 壬: ['丑'], 癸: ['寅'] } },
  红艳: { by: 'stem', refs: ['day'], map: { 甲: ['午'], 乙: ['申'], 丙: ['寅'], 丁: ['未'], 戊: ['辰'], 己: ['辰'], 庚: ['戌'], 辛: ['酉'], 壬: ['子'], 癸: ['申'] } },
  驿马: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['寅'], 寅午戌: ['申'], 巳酉丑: ['亥'], 亥卯未: ['巳'] } },
  桃花: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['酉'], 寅午戌: ['卯'], 巳酉丑: ['午'], 亥卯未: ['子'] } },
  华盖: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['辰'], 寅午戌: ['戌'], 巳酉丑: ['丑'], 亥卯未: ['未'] } },
  将星: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['子'], 寅午戌: ['午'], 巳酉丑: ['酉'], 亥卯未: ['卯'] } },
  亡神: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['亥'], 寅午戌: ['巳'], 巳酉丑: ['申'], 亥卯未: ['寅'] } },
  劫煞: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['巳'], 寅午戌: ['亥'], 巳酉丑: ['寅'], 亥卯未: ['申'] } },
  灾煞: { by: 'sanhe', refs: ['year', 'day'], map: { 申子辰: ['午'], 寅午戌: ['子'], 巳酉丑: ['卯'], 亥卯未: ['酉'] } },
  天德: { by: 'monthBranch', kind: 'mixed', map: { 寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲', 申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚' } },
  月德: { by: 'monthSanhe', kind: 'stem', map: { 寅午戌: '丙', 申子辰: '壬', 亥卯未: '甲', 巳酉丑: '庚' } },
  天德合: { by: 'monthBranch', kind: 'mixed', map: { 寅: '壬', 卯: '巳', 辰: '丁', 巳: '丙', 午: '寅', 未: '己', 申: '戊', 酉: '亥', 戌: '辛', 亥: '庚', 子: '申', 丑: '乙' } },
  月德合: { by: 'monthSanhe', kind: 'stem', map: { 寅午戌: '辛', 申子辰: '丁', 亥卯未: '己', 巳酉丑: '乙' } },
  天喜: { by: 'yearBranch', map: { 子: '酉', 丑: '申', 寅: '未', 卯: '午', 辰: '巳', 巳: '辰', 午: '卯', 未: '寅', 申: '丑', 酉: '子', 戌: '亥', 亥: '戌' } },
  红鸾: { by: 'yearBranch', map: { 子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌', 午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰' } },
  孤辰: { by: 'yearGroup', map: { 亥子丑: '寅', 寅卯辰: '巳', 巳午未: '申', 申酉戌: '亥' } },
  寡宿: { by: 'yearGroup', map: { 亥子丑: '戌', 寅卯辰: '丑', 巳午未: '辰', 申酉戌: '未' } }
}

const YEAR_GROUPS = ['亥子丑', '寅卯辰', '巳午未', '申酉戌']
function yearGroupKey(branch) {
  for (const g of YEAR_GROUPS) if (g.indexOf(branch) >= 0) return g
  return ''
}

// 计算四柱神煞，返回 {year:[], month:[], day:[], hour:[]}
function calcShenSha(pillars) {
  const order = ['year', 'month', 'day', 'hour']
  const result = { year: [], month: [], day: [], hour: [] }
  const ctx = {
    day: pillars.day, year: pillars.year, month: pillars.month, hour: pillars.hour
  }
  const add = (pos, name) => {
    if (result[pos].indexOf(name) < 0) result[pos].push(name)
  }

  for (const name in SHENSHA) {
    const rule = SHENSHA[name]
    let targets = [] // 命中的地支或天干集合
    let matchKind = 'branch'

    if (rule.by === 'stem') {
      for (const ref of rule.refs) {
        const stem = ctx[ref].stem
        const arr = rule.map[stem]
        if (arr) targets = targets.concat(arr)
      }
    } else if (rule.by === 'sanhe') {
      for (const ref of rule.refs) {
        const key = sanHeKey(ctx[ref].branch)
        const arr = rule.map[key]
        if (arr) targets = targets.concat(arr)
      }
    } else if (rule.by === 'yearBranch') {
      const v = rule.map[ctx.year.branch]
      if (v) targets.push(v)
    } else if (rule.by === 'yearGroup') {
      const v = rule.map[yearGroupKey(ctx.year.branch)]
      if (v) targets.push(v)
    } else if (rule.by === 'monthBranch') {
      const v = rule.map[ctx.month.branch]
      if (v) { targets.push(v); matchKind = rule.kind === 'mixed' ? 'mixed' : 'branch' }
    } else if (rule.by === 'monthSanhe') {
      const v = rule.map[sanHeKey(ctx.month.branch)]
      if (v) { targets.push(v); matchKind = 'stem' }
    }

    if (!targets.length) continue

    for (const pos of order) {
      const p = ctx[pos]
      for (const t of targets) {
        if (matchKind === 'stem') {
          if (p.stem === t) add(pos, name)
        } else if (matchKind === 'mixed') {
          if (p.stem === t || p.branch === t) add(pos, name)
        } else {
          if (p.branch === t) add(pos, name)
        }
      }
    }
  }
  return result
}

// ---------------- 起运 / 大运 ----------------
// 计算大运方向
function daYunForward(yearStemIndex, isMale) {
  const yang = yearStemIndex % 2 === 0
  return (yang && isMale) || (!yang && !isMale)
}

// 起运：从出生到上/下一个"节"的天数 ÷ 3 = 起运岁数
function calcStartLuck(birthDate, forward) {
  // 找最近的节（前/后）
  const y = birthDate.getFullYear()
  // 收集相邻年份所有节的精确日期
  const allNodes = []
  for (let yy = y - 1; yy <= y + 1; yy++) {
    for (const n of NODE_TERMS) {
      allNodes.push(solarTermDate(yy, n.ti))
    }
  }
  allNodes.sort((a, b) => a - b)

  let target = null
  if (forward) {
    for (const d of allNodes) { if (d > birthDate) { target = d; break } }
  } else {
    for (let i = allNodes.length - 1; i >= 0; i--) { if (allNodes[i] < birthDate) { target = allNodes[i]; break } }
  }
  if (!target) return { years: 3, months: 0, days: 0, totalDays: 1080 }

  const diffDays = Math.abs((target - birthDate) / 86400000)
  // 3 天 = 1 年；1 天 = 4 月
  const totalMonths = diffDays / 3 * 12
  const years = Math.floor(totalMonths / 12)
  const months = Math.round(totalMonths % 12)
  return { years, months, days: Math.round(diffDays), totalDays: diffDays }
}

// 生成大运（8 步）
function calcDaYun(monthPillar, yearStemIndex, isMale, birthDate, birthYear, dayStem) {
  const forward = daYunForward(yearStemIndex, isMale)
  const start = calcStartLuck(birthDate, forward)
  const startAge = start.years + start.months / 12

  const msi = monthPillar.si
  const mbi = monthPillar.bi
  const list = []
  for (let i = 1; i <= 8; i++) {
    let si, bi
    if (forward) { si = (msi + i) % 10; bi = (mbi + i) % 12 }
    else { si = (msi - i + 100) % 10; bi = (mbi - i + 120) % 12 }
    const ageStart = start.years + i * 10 - 10
    const stem = STEMS[si]
    const branch = BRANCHES[bi]
    list.push({
      stem,
      branch,
      stemClass: classOf(stem),
      branchClass: classOf(branch),
      ageStart: ageStart,
      startYear: birthYear + ageStart,
      stemGod: TEN_GOD_SHORT[tenGod(dayStem, stem)] || '',
      branchGod: TEN_GOD_SHORT[tenGod(dayStem, HIDDEN[branch][0])] || ''
    })
  }
  return { forward, startAge, startText: `出生后${start.years}年${start.months}个月起运`, list }
}

// 流年（某大运下的 10 年）
function calcLiuNian(daYunEntry, dayStem, birthYear) {
  const list = []
  for (let i = 0; i < 10; i++) {
    const year = daYunEntry.startYear + i
    const gz = ganZhiOfYear(year)
    list.push({
      year,
      age: year - birthYear + 1, // 虚岁
      stem: gz.stem,
      branch: gz.branch,
      stemClass: classOf(gz.stem),
      branchClass: classOf(gz.branch),
      stemGod: TEN_GOD_SHORT[tenGod(dayStem, gz.stem)] || '',
      branchGod: TEN_GOD_SHORT[tenGod(dayStem, HIDDEN[gz.branch][0])] || ''
    })
  }
  return list
}

function ganZhiOfYear(year) {
  let s = (year - 4) % 10
  let b = (year - 4) % 12
  if (s < 0) s += 10
  if (b < 0) b += 12
  return { stem: STEMS[s], branch: BRANCHES[b] }
}

// 流月（某流年的 12 个月，自立春寅月起）
function calcLiuYue(year, dayStem) {
  const gz = ganZhiOfYear(year)
  const yearStemIndex = STEMS.indexOf(gz.stem)
  const startStem = YIN_MONTH_START[yearStemIndex % 5]
  const NODE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒']
  const list = []
  for (let i = 0; i < 12; i++) {
    const si = (startStem + i) % 10
    const node = NODE_TERMS[i]
    const stem = STEMS[si]
    const branch = node.branch
    // 该节所在公历日期（小寒属次年）
    const termYear = node.mNo === 12 ? year + 1 : year
    const td = solarTermDate(termYear, node.ti)
    list.push({
      node: NODE_NAMES[i],
      date: `${td.getMonth() + 1}/${td.getDate()}`,
      stem,
      branch,
      stemClass: classOf(stem),
      branchClass: classOf(branch),
      stemGod: TEN_GOD_SHORT[tenGod(dayStem, stem)] || '',
      branchGod: TEN_GOD_SHORT[tenGod(dayStem, HIDDEN[branch][0])] || ''
    })
  }
  return list
}

// 把任意干支（大运 / 流年）展开成与四柱相同结构的一列，便于细盘左侧拼列
// label 为列头文字（如 '大运' / '流年'）
function buildGanZhiColumn(stem, branch, dayStem, label) {
  const hidden = HIDDEN[branch].map(s => ({
    stem: s,
    cls: classOf(s),
    god: tenGod(dayStem, s)
  }))
  return {
    label,
    stem,
    branch,
    stemClass: classOf(stem),
    branchClass: classOf(branch),
    mainStar: tenGod(dayStem, stem),
    hidden,
    starFortune: changSheng(dayStem, branch),
    selfSitting: changSheng(stem, branch),
    shensha: []
  }
}

// ---------------- 合婚 / 配对 ----------------
// 六合：子丑 寅亥 卯戌 辰酉 巳申 午未
const LIU_HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' }
// 六冲：子午 丑未 寅申 卯酉 辰戌 巳亥
const LIU_CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' }
// 天干五合：甲己 乙庚 丙辛 丁壬 戊癸
const GAN_HE = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' }

// 计算两盘配对：input 同 paipan 参数
function compat(a, b, type) {
  const ra = paipan(a)
  const rb = paipan(b)
  const da = ra.dayMaster
  const db = rb.dayMaster

  let score = 60
  const notes = []

  // 日主关系（十神）
  const rel = tenGod(da, db)
  if (rel === '正官' || rel === '正印' || rel === '正财' || rel === '食神') {
    score += 12; notes.push(`日主互为${rel}，相处和顺`)
  } else if (rel === '七杀' || rel === '伤官') {
    score -= 6; notes.push(`日主关系偏${rel}，需多包容`)
  } else if (rel === '比肩' || rel === '劫财') {
    score += 4; notes.push('日主同类，志趣相投')
  } else {
    notes.push(`日主关系：${rel}`)
  }

  // 日干五合
  if (GAN_HE[da] === db) { score += 10; notes.push('日干天合，情投意合') }

  // 日支六合 / 六冲
  const ba = ra.dayPillar.branch
  const bb = rb.dayPillar.branch
  if (LIU_HE[ba] === bb) { score += 12; notes.push('日支六合，缘分深厚') }
  else if (LIU_CHONG[ba] === bb) { score -= 12; notes.push('日支相冲，易有摩擦') }

  // 年支（婚姻看属相）合冲
  const ya = ra.yearPillar.branch
  const yb = rb.yearPillar.branch
  if (LIU_HE[ya] === yb) { score += 6; notes.push('生肖相合') }
  else if (LIU_CHONG[ya] === yb) { score -= 6; notes.push('生肖相冲') }

  if (score > 98) score = 98
  if (score < 30) score = 30

  let level
  if (score >= 85) level = '非常相合'
  else if (score >= 72) level = '比较相合'
  else if (score >= 58) level = '尚可'
  else level = '需要磨合'

  return {
    type: type === 'partner' ? '合伙配对' : '姻缘配对',
    a: { dayMaster: da, bazi: [ra.yearPillar, ra.monthPillar, ra.dayPillar, ra.hourPillar] },
    b: { dayMaster: db, bazi: [rb.yearPillar, rb.monthPillar, rb.dayPillar, rb.hourPillar] },
    score,
    level,
    notes
  }
}

// ---------------- 主入口 ----------------
// input: { year, month, day, hour, gender:'male'|'female' }
function paipan(input) {
  const { year, month, day, hour, gender } = input
  const isMale = gender !== 'female'

  const ym = calcYearMonth(year, month, day)
  const dp = dayPillarIndex(year, month, day)
  const hp = hourPillarIndex(dp.si, hour)

  const yearStemIndex = ym.year.si

  const dayStem = dp.stem
  const pillars = {
    year: ym.year,
    month: ym.month,
    day: { stem: dp.stem, branch: dp.branch, si: dp.si, bi: dp.bi },
    hour: { stem: hp.stem, branch: hp.branch, si: hp.si, bi: hp.bi }
  }

  // 神煞
  const shensha = calcShenSha(pillars)

  // 组装每柱展示数据
  function buildPillar(p, pos) {
    const hidden = HIDDEN[p.branch].map(s => ({
      stem: s,
      cls: classOf(s),
      god: tenGod(dayStem, s)
    }))
    const isDay = pos === 'day'
    return {
      stem: p.stem,
      branch: p.branch,
      stemClass: classOf(p.stem),
      branchClass: classOf(p.branch),
      mainStar: isDay ? (isMale ? '元男' : '元女') : tenGod(dayStem, p.stem),
      hidden,
      starFortune: changSheng(dayStem, p.branch), // 星运：日主对该支
      selfSitting: changSheng(p.stem, p.branch),  // 自坐：本柱干坐本柱支
      shensha: shensha[pos]
    }
  }

  const result = {
    dayMaster: dayStem,
    yearPillar: buildPillar(pillars.year, 'year'),
    monthPillar: buildPillar(pillars.month, 'month'),
    dayPillar: buildPillar(pillars.day, 'day'),
    hourPillar: buildPillar(pillars.hour, 'hour')
  }

  // 大运
  const birthDate = new Date(year, month - 1, day, hour, 0, 0)
  const daYunData = calcDaYun(pillars.month, yearStemIndex, isMale, birthDate, year, dayStem)
  result.daYun = daYunData.list
  result.daYunForward = daYunData.forward
  result.startLuckText = daYunData.startText
  result.solarYear = ym.solarYear

  return result
}

module.exports = {
  STEMS, BRANCHES,
  paipan,
  buildGanZhiColumn,
  compat,
  tenGod,
  changSheng,
  classOf,
  ganZhiOfYear,
  calcLiuNian,
  calcLiuYue,
  solarTermDate
}
