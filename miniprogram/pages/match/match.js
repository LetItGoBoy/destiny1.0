const bazi = require('../../utils/bazi.js')

Page({
  data: {
    type: 'love',           // love | partner
    titleText: '姻缘配对',
    labelA: '一方',
    labelB: '另一方',
    a: { gender: 'female', date: '请选择日期', time: '请选择时间' },
    b: { gender: 'male', date: '请选择日期', time: '请选择时间' },
    result: null
  },

  onLoad(options) {
    const type = options.type === 'partner' ? 'partner' : 'love'
    if (type === 'partner') {
      this.setData({
        type,
        titleText: '合伙配对',
        labelA: '甲方',
        labelB: '乙方',
        'a.gender': 'male'
      })
      wx.setNavigationBarTitle({ title: '合伙配对' })
    } else {
      this.setData({ type })
      wx.setNavigationBarTitle({ title: '姻缘配对' })
    }
  },

  selectGender(e) {
    const { who, gender } = e.currentTarget.dataset
    this.setData({ [`${who}.gender`]: gender })
  },

  onDateChange(e) {
    this.setData({ [`${e.currentTarget.dataset.who}.date`]: e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ [`${e.currentTarget.dataset.who}.time`]: e.detail.value })
  },

  toInput(p) {
    const d = new Date(p.date.replace(/-/g, '/'))
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: parseInt((p.time || '0').split(':')[0] || '0', 10),
      gender: p.gender
    }
  },

  onMatch() {
    const { a, b, type } = this.data
    if (a.date.indexOf('-') < 0 || a.time.indexOf(':') < 0 ||
        b.date.indexOf('-') < 0 || b.time.indexOf(':') < 0) {
      wx.showToast({ title: '请完整选择双方出生信息', icon: 'none' })
      return
    }
    const result = bazi.compat(this.toInput(a), this.toInput(b), type)
    this.setData({ result })
  }
})
