const bazi = require('../../utils/bazi.js')

Page({
  data: {
    name: '',
    gender: 'male',
    calendarType: 'solar',
    date: '请选择日期',
    time: '请选择时间',
    location: '',
    isTrueSolarTime: false,
    saveToRecord: false,
    preview: null,   // 即时起局：四柱预览
    previewSolar: ''
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  selectGender(e) {
    this.setData({ gender: e.currentTarget.dataset.gender }, () => this.computePreview())
  },

  selectCalendar(e) {
    this.setData({ calendarType: e.currentTarget.dataset.type })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value }, () => this.computePreview())
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value }, () => this.computePreview())
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onTrueSolarTimeChange(e) {
    this.setData({ isTrueSolarTime: e.detail.value })
  },

  onSaveToRecordChange(e) {
    this.setData({ saveToRecord: e.detail.value })
  },

  // 即时起局：根据当前选择计算四柱预览
  computePreview() {
    const { date, time, gender } = this.data
    if (date === '请选择日期' || time === '请选择时间') return
    const d = new Date(date.replace(/-/g, '/'))
    const hour = parseInt(time.split(':')[0] || '0', 10)
    const r = bazi.paipan({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour,
      gender
    })
    this.setData({
      preview: [r.yearPillar, r.monthPillar, r.dayPillar, r.hourPillar],
      previewSolar: `公历：${date} ${time}`
    })
  },

  onStartPaipan() {
    if (this.data.date === '请选择日期' || this.data.time === '请选择时间') {
      wx.showToast({ title: '请先选择日期和时间', icon: 'none' })
      return
    }
    const { name, gender, calendarType, date, time, location, isTrueSolarTime, saveToRecord } = this.data
    wx.navigateTo({
      url: `/pages/result/result?name=${encodeURIComponent(name)}&gender=${gender}&calendarType=${calendarType}&date=${date}&time=${time}&location=${location}&isTrueSolarTime=${isTrueSolarTime}&saveToRecord=${saveToRecord}`
    })
  }
})
