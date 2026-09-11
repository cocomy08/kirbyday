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
    const subtitle = document.getElementById('header-subtitle');
    const addBtn = document.getElementById('btn-add-task');
    const todayBtn = document.getElementById('btn-today');
    const historyBtn = document.getElementById('btn-history');
    const now = new Date();
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const todayStr = `${now.getMonth() + 1}月${now.getDate()}日 · ${wd}`;

    switch (tab) {
      case 'tasks':
        title.textContent = '任务';
        subtitle.textContent = todayStr;
        addBtn.classList.remove('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.add('hidden');
        break;
      case 'calendar':
        CalendarView.updateHeaderTitle();
        subtitle.textContent = todayStr;
        addBtn.classList.remove('hidden');
        todayBtn.classList.remove('hidden');
        historyBtn.classList.add('hidden');
        break;
      case 'kirby':
        title.textContent = '卡比';
        subtitle.textContent = 'AI 日程助手';
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.remove('hidden');
        break;
      case 'settings':
        title.textContent = '设置';
        subtitle.textContent = '偏好与数据';
        addBtn.classList.add('hidden');
        todayBtn.classList.add('hidden');
        historyBtn.classList.add('hidden');
        break;
    }
  }
};
