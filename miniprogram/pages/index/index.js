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
    stars: []
  },

  onLoad() {
    const stars = [];
    for (let i = 0; i < 36; i++) {
      stars.push({
        id: i,
        top:      +(Math.random() * 100).toFixed(2),
        left:     +(Math.random() * 100).toFixed(2),
        size:     +(Math.random() * 4 + 2).toFixed(1),
        delay:    +(Math.random() * 4).toFixed(2),
        duration: +(Math.random() * 3 + 3).toFixed(2)
      });
    }
    this.setData({ stars });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  selectGender(e) {
    this.setData({ gender: e.currentTarget.dataset.gender });
  },

  selectCalendar(e) {
    this.setData({ calendarType: e.currentTarget.dataset.type });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  onTrueSolarTimeChange(e) {
    this.setData({ isTrueSolarTime: e.detail.value });
  },

  onSaveToRecordChange(e) {
    this.setData({ saveToRecord: e.detail.value });
  },

  onStartPaipan() {
    if (this.data.date === '请选择日期' || this.data.time === '请选择时间') {
      wx.showToast({ title: '请先选择日期和时间', icon: 'none' });
      return;
    }
    const { name, gender, calendarType, date, time, location, isTrueSolarTime, saveToRecord } = this.data;
    wx.navigateTo({
      url: `/pages/result/result?name=${name}&gender=${gender}&calendarType=${calendarType}&date=${date}&time=${time}&location=${location}&isTrueSolarTime=${isTrueSolarTime}&saveToRecord=${saveToRecord}`
    });
  }
});
