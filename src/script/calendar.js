const CalendarView = {
  currentDate: new Date(),
  selectedDate: new Date(),
  currentView: 'week',
  expandedDate: null,

  init() {
    this.currentView = Store.getSetting('defaultView') || 'week';
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.expandedDate = null;
        this.render();
      });
    });
    const activeBtn = document.querySelector(`.view-btn[data-view="${this.currentView}"]`);
    if (activeBtn) {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    }
    this._setupSwipe();
  },

  _setupSwipe() {
    const c = document.getElementById('calendar-container');
    let sx = 0, sy = 0;
    c.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    c.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        dx > 0 ? this.navigate(-1) : this.navigate(1);
      }
    }, { passive: true });
  },

  navigate(dir) {
    const d = this.selectedDate;
    this.expandedDate = null;
    switch (this.currentView) {
      case 'day': d.setDate(d.getDate() + dir); break;
      case '3day': d.setDate(d.getDate() + dir * 3); break;
      case 'week': case 'weeklist': d.setDate(d.getDate() + dir * 7); break;
      case 'month': d.setMonth(d.getMonth() + dir); break;
    }
    this.render();
    this.updateHeaderTitle();
  },

  goToday() {
    this.selectedDate = new Date();
    this.currentDate = new Date();
    this.expandedDate = null;
    this.render();
    this.updateHeaderTitle();
  },

  updateHeaderTitle() {
    const title = document.getElementById('header-title');
    const d = this.selectedDate;
    const y = d.getFullYear(), m = d.getMonth() + 1;
    switch (this.currentView) {
      case 'month': title.textContent = `${y}年${m}月`; break;
      case 'week': case '3day': case 'weeklist':
        title.textContent = `${y}年${m}月`; break;
      case 'day': {
        const wd = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
        title.textContent = `${m}月${d.getDate()}日 ${wd}`;
        break;
      }
    }
  },

  render() {
    const c = document.getElementById('calendar-container');
    c.innerHTML = '';
    switch (this.currentView) {
      case 'month': this._renderMonth(c); break;
      case 'week': this._renderWeek(c, 7); break;
      case '3day': this._renderWeek(c, 3); break;
      case 'weeklist': this._renderWeekList(c); break;
      case 'day': this._renderDay(c); break;
    }
    this.updateHeaderTitle();
  },

  _p(n) { return n < 10 ? '0' + n : '' + n; },
  _ds(d) { return `${d.getFullYear()}-${this._p(d.getMonth()+1)}-${this._p(d.getDate())}`; },
  _isToday(d) { return this._ds(d) === this._ds(new Date()); },
  _tasksFor(ds) {
    return Store.getTasks().filter(t => {
      if (t.done) return false;
      if (t.repeat) return Recurrence.occursOn(t, ds);
      return t.date === ds;
    });
  },

  _renderMonth(container) {
    const ws = Store.getSetting('weekStart') || 1;
    const showLunar = Store.getSetting('showLunar');
    const showHolidays = Store.getSetting('showHolidays');
    const d = new Date(this.selectedDate);
    const year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const wrap = document.createElement('div');
    wrap.className = 'month-view';

    const dayN = ['日','一','二','三','四','五','六'];
    const header = document.createElement('div');
    header.className = 'month-header';
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('span');
      s.textContent = dayN[(i + ws) % 7];
      header.appendChild(s);
    }
    wrap.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'month-grid';

    const startOff = (firstDay.getDay() - ws + 7) % 7;
    const startDate = new Date(year, month, 1 - startOff);
    const totalCells = Math.ceil((startOff + lastDay.getDate()) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cd = new Date(startDate);
      cd.setDate(startDate.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'month-cell';
      if (cd.getMonth() !== month) cell.classList.add('other-month');
      if (this._isToday(cd)) cell.classList.add('today');
      if (this.expandedDate && this._ds(cd) === this.expandedDate) cell.classList.add('selected');

      const dayRow = document.createElement('div');
      dayRow.className = 'day-row';
      const num = document.createElement('span');
      num.className = 'day-num';
      num.textContent = cd.getDate();
      dayRow.appendChild(num);

      const ds = this._ds(cd);
      if (showHolidays && Holidays.isHoliday(ds)) {
        const hl = document.createElement('span');
        hl.className = 'holiday-label';
        hl.textContent = Holidays.get(ds);
        dayRow.appendChild(hl);
      } else if (showLunar) {
        const lun = document.createElement('span');
        lun.className = 'lunar';
        lun.textContent = Holidays.getLunarText(cd);
        dayRow.appendChild(lun);
      }
      cell.appendChild(dayRow);

      const tasks = this._tasksFor(ds);
      if (tasks.length > 0) {
        const labels = document.createElement('div');
        labels.className = 'task-labels';
        tasks.slice(0, 3).forEach(t => {
          const lbl = document.createElement('div');
          lbl.className = 'task-label';
          lbl.style.background = t.color || 'var(--color-5)';
          lbl.style.color = '#1c1c1e';
          lbl.textContent = t.title;
          labels.appendChild(lbl);
        });
        if (tasks.length > 3) {
          const more = document.createElement('span');
          more.className = 'more-count';
          more.textContent = `+${tasks.length - 3}`;
          labels.appendChild(more);
        }
        cell.appendChild(labels);
      }

      cell.addEventListener('click', () => {
        this.expandedDate = this.expandedDate === ds ? null : ds;
        this.render();
      });
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);

    if (this.expandedDate) {
      const tasks = this._tasksFor(this.expandedDate);
      const panel = document.createElement('div');
      panel.className = 'day-expand';
      const [ey, em, ed] = this.expandedDate.split('-');
      const eDate = new Date(+ey, +em - 1, +ed);
      const wd = ['周日','周一','周二','周三','周四','周五','周六'][eDate.getDay()];
      const ph = document.createElement('div');
      ph.className = 'day-expand-header';
      ph.innerHTML = `<h3>${+em}月${+ed}日 ${wd}</h3>`;
      panel.appendChild(ph);

      if (tasks.length === 0) {
        panel.innerHTML += '<div class="day-expand-empty">暂无日程</div>';
      } else {
        const list = document.createElement('div');
        list.className = 'day-expand-list';
        tasks.forEach(t => {
          const item = document.createElement('div');
          item.className = 'day-expand-item';

          const color = document.createElement('div');
          color.className = 'de-color';
          color.style.background = t.color || 'var(--accent)';
          const info = document.createElement('div');
          info.className = 'de-info';
          const title = document.createElement('div');
          title.className = 'de-title';
          title.textContent = t.title;
          const time = document.createElement('div');
          time.className = 'de-time';
          time.textContent = (t.startTime ? t.startTime + (t.endTime ? ' - ' + t.endTime : '') : '全天') + (t.location ? ' · ' + t.location : '');
          info.appendChild(title);
          info.appendChild(time);
          item.appendChild(color);
          item.appendChild(info);

          item.addEventListener('click', () => App.openEditTask(t.id));
          list.appendChild(item);
        });
        panel.appendChild(list);
      }
      wrap.appendChild(panel);
    }

    container.appendChild(wrap);
  },

  _renderWeekList(container) {
    const ws = Store.getSetting('weekStart') || 1;
    const base = new Date(this.selectedDate);
    const dow = (base.getDay() - ws + 7) % 7;
    base.setDate(base.getDate() - dow);

    const wrap = document.createElement('div');
    wrap.className = 'week-list';
    const dayN = ['周日','周一','周二','周三','周四','周五','周六'];

    for (let i = 0; i < 7; i++) {
      const dd = new Date(base);
      dd.setDate(base.getDate() + i);
      const ds = this._ds(dd);
      const tasks = this._tasksFor(ds);

      const row = document.createElement('div');
      row.className = 'week-list-day';
      if (this._isToday(dd)) row.classList.add('today');

      row.innerHTML = `
        <div class="wl-date">
          <div class="wl-dayname">${dayN[dd.getDay()]}</div>
          <div class="wl-daynum">${dd.getDate()}</div>
        </div>
        <div class="wl-tasks"></div>`;

      const taskWrap = row.querySelector('.wl-tasks');
      if (tasks.length === 0) {
        taskWrap.innerHTML = '<div class="wl-task-no">无日程</div>';
      } else {
        tasks.forEach(t => {
          const item = document.createElement('div');
          item.className = 'wl-task-item';
          item.style.background = t.color || 'var(--color-5)';
          item.style.color = '#1c1c1e';
          if (t.startTime) {
            const tm = document.createElement('span');
            tm.className = 'wl-time';
            tm.textContent = t.startTime;
            item.appendChild(tm);
          }
          const tt = document.createElement('span');
          tt.textContent = t.title;
          item.appendChild(tt);
          item.addEventListener('click', () => App.openEditTask(t.id));
          taskWrap.appendChild(item);
        });
      }
      wrap.appendChild(row);
    }
    container.appendChild(wrap);
  },

  _renderWeek(container, numDays) {
    const ws = Store.getSetting('weekStart') || 1;
    const wrap = document.createElement('div');
    wrap.className = numDays === 3 ? 'week-view threeday-view' : 'week-view';

    let base;
    if (numDays === 7) {
      base = new Date(this.selectedDate);
      const dow = (base.getDay() - ws + 7) % 7;
      base.setDate(base.getDate() - dow);
    } else {
      base = new Date(this.selectedDate);
    }

    const headerRow = document.createElement('div');
    headerRow.className = 'week-header-row';
    headerRow.innerHTML = '<div class="corner"></div>';

    const dates = [];
    const dayN = ['周日','周一','周二','周三','周四','周五','周六'];
    for (let i = 0; i < numDays; i++) {
      const dd = new Date(base);
      dd.setDate(base.getDate() + i);
      dates.push(dd);
      const hd = document.createElement('div');
      hd.className = 'week-day-header';
      if (this._isToday(dd)) hd.classList.add('today');
      hd.innerHTML = `<span class="day-name">${dayN[dd.getDay()].slice(1)}</span><span class="day-num">${dd.getDate()}</span>`;
      headerRow.appendChild(hd);
    }
    wrap.appendChild(headerRow);

    const body = document.createElement('div');
    body.className = 'week-body';
    const gutter = document.createElement('div');
    gutter.className = 'time-gutter';
    for (let h = 0; h < 24; h++) {
      const lbl = document.createElement('div');
      lbl.className = 'time-label';
      lbl.textContent = this._p(h) + ':00';
      gutter.appendChild(lbl);
    }
    body.appendChild(gutter);

    dates.forEach(dd => {
      const col = document.createElement('div');
      col.className = 'week-day-col';
      for (let h = 0; h < 24; h++) {
        const slot = document.createElement('div');
        slot.className = 'hour-slot';
        col.appendChild(slot);
      }
      this._tasksFor(this._ds(dd)).forEach(t => {
        if (t.startTime) col.appendChild(this._createEvent(t));
      });
      if (this._isToday(dd)) {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const line = document.createElement('div');
        line.className = 'now-line';
        line.style.top = (mins / 60 * 52) + 'px';
        col.appendChild(line);
      }
      body.appendChild(col);
    });
    wrap.appendChild(body);
    container.appendChild(wrap);
    const now = new Date();
    body.scrollTop = Math.max(0, (now.getHours() - 2) * 52);
  },

  _renderDay(container) {
    const d = this.selectedDate;
    const wrap = document.createElement('div');
    wrap.className = 'day-view';
    const dayN = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const ds = this._ds(d);
    const header = document.createElement('div');
    header.className = 'day-date-header';
    header.innerHTML = `<div class="date-main">${d.getMonth()+1}月${d.getDate()}日</div><div class="date-sub">${dayN[d.getDay()]}${Holidays.isHoliday(ds) ? ' · ' + Holidays.get(ds) : ''}</div>`;
    wrap.appendChild(header);

    const body = document.createElement('div');
    body.className = 'day-body';
    const gutter = document.createElement('div');
    gutter.className = 'time-gutter';
    for (let h = 0; h < 24; h++) {
      const lbl = document.createElement('div');
      lbl.className = 'time-label';
      lbl.textContent = this._p(h) + ':00';
      gutter.appendChild(lbl);
    }
    body.appendChild(gutter);

    const col = document.createElement('div');
    col.className = 'day-col';
    for (let h = 0; h < 24; h++) {
      const slot = document.createElement('div');
      slot.className = 'hour-slot';
      col.appendChild(slot);
    }
    this._tasksFor(ds).forEach(t => { if (t.startTime) col.appendChild(this._createEvent(t)); });
    if (this._isToday(d)) {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const line = document.createElement('div');
      line.className = 'now-line';
      line.style.top = (mins / 60 * 52) + 'px';
      col.appendChild(line);
    }
    body.appendChild(col);
    wrap.appendChild(body);
    container.appendChild(wrap);
    body.scrollTop = Math.max(0, (new Date().getHours() - 2) * 52);
  },

  _createEvent(task) {
    const ev = document.createElement('div');
    ev.className = 'cal-event';
    ev.style.background = task.color || 'var(--color-5)';
    ev.style.color = '#1c1c1e';
    const [sh, sm] = task.startTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    let endMin = startMin + 60;
    if (task.endTime) { const [eh, em] = task.endTime.split(':').map(Number); endMin = eh * 60 + em; }
    ev.style.top = (startMin / 60 * 52) + 'px';
    ev.style.height = Math.max(18, (endMin - startMin) / 60 * 52) + 'px';
    ev.textContent = task.title;
    ev.addEventListener('click', () => App.openEditTask(task.id));
    return ev;
  }
};
