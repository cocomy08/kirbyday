// 重复任务：日期推进与范围生成。date 一律 'YYYY-MM-DD'。
const Recurrence = {
  _pad(n) { return n < 10 ? '0' + n : '' + n; },
  _ds(d) { return `${d.getFullYear()}-${this._pad(d.getMonth() + 1)}-${this._pad(d.getDate())}`; },
  _parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },

  // 以 anchor 的「日/星期/月日」为基准，把 d 向后推 interval 个周期（正确处理 31→30、2/29 夹取）。
  _advance(d, freq, interval, anchor) {
    switch (freq) {
      case 'daily':
        d.setDate(d.getDate() + interval);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7 * interval);
        break;
      case 'monthly': {
        const day = anchor.getDate();
        d.setDate(1);
        d.setMonth(d.getMonth() + interval);
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(day, last));
        break;
      }
      case 'yearly': {
        const mon = anchor.getMonth();
        const day = anchor.getDate();
        const y = d.getFullYear() + interval;
        const last = new Date(y, mon + 1, 0).getDate();
        d.setFullYear(y, mon, Math.min(day, last));
        break;
      }
    }
  },

  // 严格大于 afterStr 的下一次发生日期（含 afterStr 当天则继续往后推）。
  nextOccurrence(dateStr, freq, interval = 1, afterStr = null) {
    if (!dateStr || !freq) return null;
    const anchor = this._parse(dateStr);
    const after = afterStr ? this._parse(afterStr) : anchor;
    const next = new Date(anchor);
    let guard = 0;
    while (next.getTime() <= after.getTime() && guard < 10000) {
      this._advance(next, freq, interval, anchor);
      guard++;
    }
    return this._ds(next);
  },

  // 生成 [fromStr, toStr] 范围内的全部发生日期（含端点），尊重 repeatEnd。
  occurrencesInRange(task, fromStr, toStr) {
    if (!task.repeat || !task.date) return [];
    const freq = task.repeat;
    const interval = task.repeatInterval || 1;
    const end = task.repeatEnd || '';
    const cur = this._parse(task.date);
    const anchor = this._parse(task.date);
    const list = [];
    let guard = 0;
    while (guard < 5000) {
      const curStr = this._ds(cur);
      if (end && curStr > end) break;
      if (curStr >= fromStr && curStr <= toStr) list.push(curStr);
      if (curStr > toStr) break;
      this._advance(cur, freq, interval, anchor);
      guard++;
    }
    return list;
  },

  // 判断某一天是否为该重复任务的发生日（daily/weekly 用取模 O(1)，monthly/yearly 小步推进）。
  occursOn(task, ds) {
    if (!task.repeat || !task.date) return false;
    if (ds < task.date) return false;
    if (task.repeatEnd && ds > task.repeatEnd) return false;
    const freq = task.repeat;
    const interval = task.repeatInterval || 1;
    const days = Math.round((this._parse(ds) - this._parse(task.date)) / 86400000);
    if (days < 0) return false;
    if (freq === 'daily') return days % interval === 0;
    if (freq === 'weekly') return days % (7 * interval) === 0;
    let cur = this._parse(task.date);
    const anchor = this._parse(task.date);
    let guard = 0;
    while (guard < 5000) {
      const cs = this._ds(cur);
      if (cs === ds) return true;
      if (cs > ds) return false;
      this._advance(cur, freq, interval, anchor);
      guard++;
    }
    return false;
  },

  // 列表徽标文案：每天 / 每2周 / 每月 …
  label(freq, interval) {
    if (!freq) return '';
    const map = { daily: '天', weekly: '周', monthly: '月', yearly: '年' };
    return (interval && interval > 1 ? `每${interval}` : '每') + (map[freq] || '');
  }
};
