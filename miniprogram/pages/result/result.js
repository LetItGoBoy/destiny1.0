const bazi = require('../../utils/bazi.js')

Page({
  data: {
    name: '',
    genderText: '乾造',
    solarStr: '',
    birthYear: 0,
    activeTab: 'pan', // info | pan | detail | note

    dayMaster: '',
    cols: [],          // 四柱：年/月/日/时

    startLuckText: '',
    daYunForward: true,
    daYun: [],
    selectedDaYun: -1,
    liuNian: [],
    selectedLiuNian: -1,
    liuYue: []
  },

  onLoad(options) {
    const name = options.name && options.name !== 'undefined' ? decodeURIComponent(options.name) : ''
    const gender = options.gender || 'male'
    const dateStr = options.date || ''   // YYYY-MM-DD
    const timeStr = options.time || ''   // HH:mm

    const d = new Date(dateStr.replace(/-/g, '/'))
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = parseInt(timeStr.split(':')[0] || '0', 10)

    const r = bazi.paipan({ year, month, day, hour, gender })

    const labels = ['年柱', '月柱', '日柱', '时柱']
    const ps = [r.yearPillar, r.monthPillar, r.dayPillar, r.hourPillar]
    const cols = ps.map((p, i) => Object.assign({ label: labels[i] }, p))

    this.setData({
      name,
      genderText: gender === 'female' ? '坤造' : '乾造',
      solarStr: `${year}年${month}月${day}日 ${timeStr}`,
      birthYear: year,
      dayMaster: r.dayMaster,
      cols,
      startLuckText: r.startLuckText,
      daYunForward: r.daYunForward,
      daYun: r.daYun
    })

    // 默认选中当前所处大运
    const nowYear = new Date().getFullYear()
    let idx = 0
    for (let i = 0; i < r.daYun.length; i++) {
      if (nowYear >= r.daYun[i].startYear) idx = i
    }
    this.selectDaYunByIndex(idx)
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  onSelectDaYun(e) {
    this.selectDaYunByIndex(Number(e.currentTarget.dataset.index))
  },

  selectDaYunByIndex(index) {
    const entry = this.data.daYun[index]
    if (!entry) return
    const liuNian = bazi.calcLiuNian(entry, this.data.dayMaster, this.data.birthYear)
    const nowYear = new Date().getFullYear()
    let li = 0
    for (let i = 0; i < liuNian.length; i++) {
      if (nowYear >= liuNian[i].year) li = i
    }
    const liuYue = liuNian[li] ? bazi.calcLiuYue(liuNian[li].year, this.data.dayMaster) : []
    this.setData({
      selectedDaYun: index,
      liuNian,
      selectedLiuNian: li,
      liuYue
    })
  },

  onSelectLiuNian(e) {
    const index = Number(e.currentTarget.dataset.index)
    const entry = this.data.liuNian[index]
    if (!entry) return
    const liuYue = bazi.calcLiuYue(entry.year, this.data.dayMaster)
    this.setData({ selectedLiuNian: index, liuYue })
  }
})
