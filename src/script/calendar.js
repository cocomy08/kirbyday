const CalendarView = {
  currentDate: new Date(),
  selectedDate: new Date(),
  currentView: 'week',

  init() {
    this.currentView = Store.getSetting('defaultView') || 'week';
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
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
    const container = document.getElementById('calendar-container');
    let startX = 0, startY = 0;
    container.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) this.navigate(-1); else this.navigate(1);
      }
    }, { passive: true });
  },

  navigate(dir) {
    const d = this.selectedDate;
    switch (this.currentView) {
      case 'day': d.setDate(d.getDate() + dir); break;
      case '3day': d.setDate(d.getDate() + dir * 3); break;
      case 'week': d.setDate(d.getDate() + dir * 7); break;
      case 'month': d.setMonth(d.getMonth() + dir); break;
    }
    this.render();
    this.updateHeaderTitle();
  },

  goToday() {
    this.selectedDate = new Date();
    this.currentDate = new Date();
    this.render();
    this.updateHeaderTitle();
  },

  updateHeaderTitle() {
    const title = document.getElementById('header-title');
    const d = this.selectedDate;
    const y = d.getFullYear(), m = d.getMonth() + 1;
    switch (this.currentView) {
      case 'month': title.textContent = `${y}年${m}月`; break;
      case 'week': case '3day': {
        const day = d.getDate();
        title.textContent = `${y}年${m}月${day}日`;
        break;
      }
      case 'day': {
        const day = d.getDate();
        const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
        title.textContent = `${m}月${day}日 ${weekday}`;
        break;
      }
    }
  },

  render() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';
    switch (this.currentView) {
      case 'month': this._renderMonth(container); break;
      case 'week': this._renderWeek(container, 7); break;
      case '3day': this._renderWeek(container, 3); break;
      case 'day': this._renderDay(container); break;
    }
    this.updateHeaderTitle();
  },

  _pad(n) { return n < 10 ? '0' + n : '' + n; },

  _dateStr(d) {
    return `${d.getFullYear()}-${this._pad(d.getMonth()+1)}-${this._pad(d.getDate())}`;
  },

  _isToday(d) { return this._dateStr(d) === this._dateStr(new Date()); },

  _getTasksForDate(dateStr) {
    return Store.getTasks().filter(t => t.date === dateStr && !t.done);
  },

  _renderMonth(container) {
    const weekStart = Store.getSetting('weekStart') || 1;
    const showLunar = Store.getSetting('showLunar');
    const showHolidays = Store.getSetting('showHolidays');
    const d = new Date(this.selectedDate);
    const year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const wrap = document.createElement('div');
    wrap.className = 'month-view';

    const dayNames = ['日','一','二','三','四','五','六'];
    const header = document.createElement('div');
    header.className = 'month-header';
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('span');
      s.textContent = dayNames[(i + weekStart) % 7];
      header.appendChild(s);
    }
    wrap.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'month-grid';

    let startOffset = (firstDay.getDay() - weekStart + 7) % 7;
    const startDate = new Date(year, month, 1 - startOffset);
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'month-cell';
      if (cellDate.getMonth() !== month) cell.classList.add('other-month');
      if (this._isToday(cellDate)) cell.classList.add('today');
      if (this._dateStr(cellDate) === this._dateStr(this.selectedDate)) cell.classList.add('selected');

      const num = document.createElement('span');
      num.className = 'day-num';
      num.textContent = cellDate.getDate();
      cell.appendChild(num);

      const ds = this._dateStr(cellDate);
      if (showHolidays && Holidays.isHoliday(ds)) {
        const hl = document.createElement('span');
        hl.className = 'holiday-label';
        hl.textContent = Holidays.get(ds);
        cell.appendChild(hl);
      } else if (showLunar) {
        const lun = document.createElement('span');
        lun.className = 'lunar';
        lun.textContent = Holidays.getLunarText(cellDate);
        cell.appendChild(lun);
      }

      const tasks = this._getTasksForDate(ds);
      if (tasks.length > 0) {
        const dots = document.createElement('div');
        dots.className = 'task-dots';
        tasks.slice(0, 3).forEach(t => {
          const dot = document.createElement('span');
          dot.className = 'task-dot';
          dot.style.background = t.color || 'var(--accent)';
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
      }

      cell.addEventListener('click', () => {
        this.selectedDate = new Date(cellDate);
        this.render();
      });

      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    container.appendChild(wrap);
  },

  _renderWeek(container, numDays) {
    const weekStart = Store.getSetting('weekStart') || 1;
    const wrap = document.createElement('div');
    wrap.className = numDays === 3 ? 'week-view threeday-view' : 'week-view';

    let baseDate;
    if (numDays === 7) {
      baseDate = new Date(this.selectedDate);
      const dayOfWeek = (baseDate.getDay() - weekStart + 7) % 7;
      baseDate.setDate(baseDate.getDate() - dayOfWeek);
    } else {
      baseDate = new Date(this.selectedDate);
    }

    const headerRow = document.createElement('div');
    headerRow.className = 'week-header-row';
    const corner = document.createElement('div');
    corner.className = 'corner';
    headerRow.appendChild(corner);

    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const dd = new Date(baseDate);
      dd.setDate(baseDate.getDate() + i);
      dates.push(dd);
      const hd = document.createElement('div');
      hd.className = 'week-day-header';
      if (this._isToday(dd)) hd.classList.add('today');
      const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
      const dn = document.createElement('span');
      dn.className = 'day-name';
      dn.textContent = dayNames[dd.getDay()];
      const dnum = document.createElement('span');
      dnum.className = 'day-num';
      dnum.textContent = dd.getDate();
      hd.appendChild(dn);
      hd.appendChild(dnum);
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
      lbl.textContent = this._pad(h) + ':00';
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
      const ds = this._dateStr(dd);
      const tasks = this._getTasksForDate(ds);
      tasks.forEach(t => {
        if (t.startTime) {
          const ev = this._createEvent(t);
          col.appendChild(ev);
        }
      });
      if (this._isToday(dd)) {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const line = document.createElement('div');
        line.className = 'now-line';
        line.style.top = (mins / 60 * 48) + 'px';
        col.appendChild(line);
      }
      body.appendChild(col);
    });

    wrap.appendChild(body);
    container.appendChild(wrap);

    const now = new Date();
    const scrollTo = Math.max(0, (now.getHours() - 2) * 48);
    body.scrollTop = scrollTo;
  },

  _renderDay(container) {
    const d = this.selectedDate;
    const wrap = document.createElement('div');
    wrap.className = 'day-view';

    const header = document.createElement('div');
    header.className = 'day-date-header';
    const dayNames = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    header.innerHTML = `
      <div class="date-main">${d.getMonth()+1}月${d.getDate()}日</div>
      <div class="date-sub">${dayNames[d.getDay()]}${Holidays.isHoliday(this._dateStr(d)) ? ' · ' + Holidays.get(this._dateStr(d)) : ''}</div>
    `;
    wrap.appendChild(header);

    const body = document.createElement('div');
    body.className = 'day-body';

    const gutter = document.createElement('div');
    gutter.className = 'time-gutter';
    for (let h = 0; h < 24; h++) {
      const lbl = document.createElement('div');
      lbl.className = 'time-label';
      lbl.textContent = this._pad(h) + ':00';
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

    const ds = this._dateStr(d);
    const tasks = this._getTasksForDate(ds);
    tasks.forEach(t => {
      if (t.startTime) {
        const ev = this._createEvent(t);
        col.appendChild(ev);
      }
    });

    if (this._isToday(d)) {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const line = document.createElement('div');
      line.className = 'now-line';
      line.style.top = (mins / 60 * 48) + 'px';
      col.appendChild(line);
    }

    body.appendChild(col);
    wrap.appendChild(body);
    container.appendChild(wrap);

    const now = new Date();
    const scrollTo = Math.max(0, (now.getHours() - 2) * 48);
    body.scrollTop = scrollTo;
  },

  _createEvent(task) {
    const ev = document.createElement('div');
    ev.className = 'cal-event';
    ev.style.background = task.color || 'var(--color-5)';
    ev.style.color = '#1f2328';
    const [sh, sm] = task.startTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    let endMin = startMin + 60;
    if (task.endTime) {
      const [eh, em] = task.endTime.split(':').map(Number);
      endMin = eh * 60 + em;
    }
    ev.style.top = (startMin / 60 * 48) + 'px';
    ev.style.height = Math.max(16, (endMin - startMin) / 60 * 48) + 'px';
    ev.textContent = task.title;
    return ev;
  }
};
