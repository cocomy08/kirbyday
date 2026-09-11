const Router = {
  currentTab: 'tasks',

  init() {
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));

    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active');
    const btn = document.querySelector(`.tab-item[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');

    if (tab === 'calendar') CalendarView.render();
    if (tab === 'tasks') TasksView.render();
    this._updateHeader(tab);
  },

  _updateHeader(tab) {
    const addBtn = document.getElementById('btn-add-task');
    const todayBtn = document.getElementById('btn-today');
    const historyBtn = document.getElementById('btn-history');
    this.refreshSubtitle();

    switch (tab) {
      case 'tasks':
        addBtn.classList.remove('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.add('hidden');
        break;
      case 'calendar':
        addBtn.classList.remove('hidden');
        todayBtn.classList.remove('hidden');
        historyBtn.classList.add('hidden');
        break;
      case 'kirby':
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.remove('hidden');
        break;
      case 'settings':
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.add('hidden');
        break;
    }
  },

  // 顶栏胶囊：今天日期 + 今天任务数
  refreshSubtitle() {
    const subtitle = document.getElementById('header-subtitle');
    if (!subtitle) return;
    const now = new Date();
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const todayStr = `${now.getMonth() + 1}月${now.getDate()}日 ${wd}`;
    const count = this._todayTaskCount();
    subtitle.textContent = count > 0 ? `${todayStr} · 今天 ${count} 个任务` : `${todayStr} · 今天暂无任务`;
  },

  _todayTaskCount() {
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    return Store.getTasks().filter(t => {
      if (t.done) return false;
      if (t.repeat) return Recurrence.occursOn(t, ts);
      return t.date === ts;
    }).length;
  }
};
