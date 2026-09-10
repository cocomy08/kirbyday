const Holidays = {
  _cache: {},

  data2026: {
    '2026-01-01': '元旦',
    '2026-01-29': '除夕',
    '2026-01-30': '春节',
    '2026-01-31': '春节',
    '2026-02-01': '春节',
    '2026-02-02': '春节',
    '2026-02-03': '春节',
    '2026-02-04': '春节',
    '2026-04-04': '清明节',
    '2026-04-05': '清明节',
    '2026-04-06': '清明节',
    '2026-05-01': '劳动节',
    '2026-05-02': '劳动节',
    '2026-05-03': '劳动节',
    '2026-06-19': '端午节',
    '2026-06-20': '端午节',
    '2026-06-21': '端午节',
    '2026-10-01': '国庆节',
    '2026-10-02': '国庆节',
    '2026-10-03': '国庆节',
    '2026-10-04': '国庆节',
    '2026-10-05': '国庆节',
    '2026-10-06': '国庆节',
    '2026-10-07': '国庆节',
    '2026-10-08': '中秋节'
  },

  data2025: {
    '2025-01-01': '元旦',
    '2025-01-28': '除夕',
    '2025-01-29': '春节',
    '2025-01-30': '春节',
    '2025-01-31': '春节',
    '2025-02-01': '春节',
    '2025-02-02': '春节',
    '2025-02-03': '春节',
    '2025-02-04': '春节',
    '2025-04-04': '清明节',
    '2025-04-05': '清明节',
    '2025-04-06': '清明节',
    '2025-05-01': '劳动节',
    '2025-05-02': '劳动节',
    '2025-05-03': '劳动节',
    '2025-05-04': '劳动节',
    '2025-05-05': '劳动节',
    '2025-05-31': '端午节',
    '2025-06-01': '端午节',
    '2025-06-02': '端午节',
    '2025-10-01': '国庆节',
    '2025-10-02': '国庆节',
    '2025-10-03': '国庆节',
    '2025-10-04': '国庆节',
    '2025-10-05': '国庆节',
    '2025-10-06': '中秋节',
    '2025-10-07': '国庆节',
    '2025-10-08': '国庆节'
  },

  get(dateStr) {
    return this.data2026[dateStr] || this.data2025[dateStr] || null;
  },

  isHoliday(dateStr) {
    return !!this.get(dateStr);
  },

  _lunarInfo: [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63
  ],

  _tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  _diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  _nStr1: ['日','一','二','三','四','五','六','七','八','九','十'],
  _nStr2: ['初','十','廿','卅'],
  _monthStr: ['正','二','三','四','五','六','七','八','九','十','冬','腊'],

  _lYearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) sum += (this._lunarInfo[y - 1900] & i) ? 1 : 0;
    return sum + this._leapDays(y);
  },

  _leapMonth(y) { return this._lunarInfo[y - 1900] & 0xf; },

  _leapDays(y) {
    if (this._leapMonth(y)) return (this._lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    return 0;
  },

  _monthDays(y, m) {
    return (this._lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  },

  toLunar(date) {
    const baseDate = new Date(1900, 0, 31);
    let offset = Math.floor((date - baseDate) / 86400000);
    let y = 1900;
    let temp;
    for (; y < 2101 && offset > 0; y++) { temp = this._lYearDays(y); offset -= temp; }
    if (offset < 0) { offset += temp; y--; }
    const leapM = this._leapMonth(y);
    let isLeap = false;
    let m = 1;
    for (; m < 13 && offset > 0; m++) {
      if (leapM > 0 && m === leapM + 1 && !isLeap) { --m; isLeap = true; temp = this._leapDays(y); }
      else { temp = this._monthDays(y, m); }
      if (isLeap && m === leapM + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leapM > 0 && m === leapM + 1) {
      if (isLeap) isLeap = false; else { isLeap = true; --m; }
    }
    if (offset < 0) { offset += temp; --m; }
    const d = offset + 1;
    return { year: y, month: m, day: d, isLeap };
  },

  lunarDayStr(d) {
    if (d === 10) return '初十';
    if (d === 20) return '二十';
    if (d === 30) return '三十';
    return this._nStr2[Math.floor(d / 10)] + this._nStr1[d % 10];
  },

  lunarMonthStr(m) { return this._monthStr[m - 1] + '月'; },

  getLunarText(date) {
    const l = this.toLunar(date);
    return l.day === 1 ? this.lunarMonthStr(l.month) : this.lunarDayStr(l.day);
  }
};
