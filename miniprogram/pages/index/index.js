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

  onLoad() {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    this.setData({ date, time })
    // 即时起局：固定显示此刻的盘，不随出生日期输入变化
    this.computeNowPreview(now)
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  selectGender(e) {
    this.setData({ gender: e.currentTarget.dataset.gender })
  },

  selectCalendar(e) {
    this.setData({ calendarType: e.currentTarget.dataset.type })
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value })
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

  // 即时起局：固定当前系统时刻，只在页面加载时计算一次
  computeNowPreview(now) {
    const pad = n => String(n).padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const r = bazi.paipan({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      gender: this.data.gender
    })
    const labels = ['年', '月', '日', '时']
    const ps = [r.yearPillar, r.monthPillar, r.dayPillar, r.hourPillar]
    this.setData({
      preview: ps.map((p, i) => Object.assign({ label: labels[i] }, p)),
      previewSolar: `${date} ${time}`
    })
  },

  onStartPaipan() {
    if (this.data.date === '请选择日期' || this.data.time === '请选择时间') {
      wx.showToast({ title: '请先选择日期和时间', icon: 'none' })
      return
    }
    const { name, gender, calendarType, date, time, location, isTrueSolarTime, saveToRecord, preview } = this.data

    if (saveToRecord) {
      const records = wx.getStorageSync('records') || []
      const baziStr = preview ? preview.map(p => p.stem + p.branch).join(' ') : ''
      records.unshift({ id: Date.now(), name, gender, date, time, baziStr })
      wx.setStorageSync('records', records)
    }

    wx.navigateTo({
      url: `/pages/result/result?name=${encodeURIComponent(name)}&gender=${gender}&calendarType=${calendarType}&date=${date}&time=${time}&location=${location}&isTrueSolarTime=${isTrueSolarTime}&saveToRecord=${saveToRecord}`
    })
  },

  onMatch(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: `/pages/match/match?type=${type}` })
  }
})
