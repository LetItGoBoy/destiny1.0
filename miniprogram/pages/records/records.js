Page({
  data: {
    records: []
  },

  onShow() {
    const records = wx.getStorageSync('records') || []
    this.setData({ records })
  },

  onOpen(e) {
    const r = this.data.records[Number(e.currentTarget.dataset.index)]
    if (!r) return
    wx.navigateTo({
      url: `/pages/result/result?name=${encodeURIComponent(r.name || '')}&gender=${r.gender}&date=${r.date}&time=${r.time}`
    })
  },

  onDelete(e) {
    const index = Number(e.currentTarget.dataset.index)
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条记录吗？',
      success: (res) => {
        if (!res.confirm) return
        const records = this.data.records.slice()
        records.splice(index, 1)
        wx.setStorageSync('records', records)
        this.setData({ records })
      }
    })
  },

  goPaipan() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
