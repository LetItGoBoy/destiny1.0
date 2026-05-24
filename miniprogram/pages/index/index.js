Page({
    data: {
      gender: 'male', // 默认性别
      date: '请选择日期', // 初始日期提示文字
      time: '请选择时间', // 初始时间提示文字
      stars: [] // 背景漂浮星点
    },
    onLoad() {
      const stars = [];
      for (let i = 0; i < 42; i++) {
        stars.push({
          id: i,
          top: +(Math.random() * 100).toFixed(2),
          left: +(Math.random() * 100).toFixed(2),
          size: +(Math.random() * 4 + 2).toFixed(1),
          delay: +(Math.random() * 4).toFixed(2),
          duration: +(Math.random() * 3 + 3).toFixed(2)
        });
      }
      this.setData({ stars });
    },
    onGenderChange(event) {
      this.setData({
        gender: event.detail.value
      });
    },
    onDateChange(event) {
      this.setData({
        date: event.detail.value
      });
    },
    onTimeChange(event) {
      this.setData({
        time: event.detail.value
      });
    },
    onStartPaipan() {
      // 验证日期和时间是否已选择
      if (this.data.date === '请选择日期' || this.data.time === '请选择时间') {
        wx.showToast({
          title: '请先选择日期和时间',
          icon: 'none'
        });
        return;
      }
      // TODO: 调用云函数开始排盘
      wx.navigateTo({
        url: `/pages/result/result?gender=${this.data.gender}&date=${this.data.date}&time=${this.data.time}`
      });
    }
  });
  