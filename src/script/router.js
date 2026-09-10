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
    const title = document.getElementById('header-title');
    const addBtn = document.getElementById('btn-add-task');
    const todayBtn = document.getElementById('btn-today');

    switch (tab) {
      case 'tasks':
        title.textContent = '任务';
        addBtn.classList.remove('hidden');
        todayBtn.classList.add('hidden');
        break;
      case 'calendar':
        CalendarView.updateHeaderTitle();
        addBtn.classList.remove('hidden');
        todayBtn.classList.remove('hidden');
        break;
      case 'kirby':
        title.textContent = '卡比';
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        break;
      case 'settings':
        title.textContent = '设置';
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        break;
    }
  }
};
