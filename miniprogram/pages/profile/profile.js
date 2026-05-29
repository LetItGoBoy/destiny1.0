Page({
  data: {
    count: 0
  },

  onShow() {
    const records = wx.getStorageSync('records') || []
    this.setData({ count: records.length })
  },

  clearCache() {
    wx.showModal({
      title: '清除数据',
      content: '将删除全部本地排盘记录，确定吗？',
      success: (res) => {
        if (!res.confirm) return
        wx.removeStorageSync('records')
        this.setData({ count: 0 })
        wx.showToast({ title: '已清除', icon: 'success' })
      }
    })
  },

  about() {
    wx.showModal({
      title: '关于',
      content: '问真排盘 — 简洁的八字排盘工具。无会员、无付费、无内容运营。',
      showCancel: false
    })
  }
})
