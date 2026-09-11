// 生理期：记录 + 预测。日期一律 'YYYY-MM-DD'。
const Period = {
  _pad(n) { return n < 10 ? '0' + n : '' + n; },
  _ds(d) { return `${d.getFullYear()}-${this._pad(d.getMonth() + 1)}-${this._pad(d.getDate())}`; },
  _parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  _addDays(s, n) { const d = this._parse(s); d.setDate(d.getDate() + n); return this._ds(d); },

  records() { return Store.getPeriods(); },

  sorted() {
    return this.records()
      .filter(r => r && r.start)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  },

  cycle() { return Store.getSetting('periodCycle') || 30; },
  defaultDays() { return Store.getSetting('periodDuration') || 5; },

  // 下一次预测开始日：最近一次记录开始 + 周期长度
  nextPrediction() {
    const recs = this.sorted();
    if (!recs.length) return null;
    return this._addDays(recs[recs.length - 1].start, this.cycle());
  },

  // 某天的状态：'period'（实际经期） / 'predicted'（预测开始） / 'early'（可能提前，前2天） / null
  status(ds) {
    for (const r of this.records()) {
      if (!r.start) continue;
      const days = r.days || this.defaultDays();
      for (let i = 0; i < days; i++) {
        if (this._addDays(r.start, i) === ds) return 'period';
      }
    }
    const pred = this.nextPrediction();
    if (!pred) return null;
    if (pred === ds) return 'predicted';
    if (this._addDays(pred, -1) === ds || this._addDays(pred, -2) === ds) return 'early';
    return null;
  },

  isPeriodDay(ds) { return this.status(ds) === 'period'; }
};
