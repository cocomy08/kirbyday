const TasksView = {
  currentFilter: 'all',

  init() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  },

  render() {
    const list = document.getElementById('task-list');
    const tasks = this._filteredTasks();

    if (tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" stroke="#d0d7de" stroke-width="2"/><path d="M16 18h16M16 26h10" stroke="#d0d7de" stroke-width="2" stroke-linecap="round"/></svg>
          <p>暂无任务</p>
          <span>点击右上角 + 添加新任务</span>
        </div>`;
      return;
    }

    list.innerHTML = '';
    const sorted = [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.priority || 0) - (a.priority || 0);
    });

    sorted.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card' + (task.done ? ' done' : '');

      const colorBar = document.createElement('div');
      colorBar.className = 'task-color-bar';
      colorBar.style.background = task.color || 'var(--accent)';

      const checkbox = document.createElement('div');
      checkbox.className = 'task-checkbox' + (task.done ? ' checked' : '');
      checkbox.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
      checkbox.addEventListener('click', e => {
        e.stopPropagation();
        Store.updateTask(task.id, { done: !task.done });
        this.render();
      });

      const body = document.createElement('div');
      body.className = 'task-card-body';

      const title = document.createElement('div');
      title.className = 'task-card-title';
      title.textContent = task.title;
      body.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'task-card-meta';
      if (task.date) {
        const dateSpan = document.createElement('span');
        dateSpan.textContent = task.date;
        meta.appendChild(dateSpan);
      }
      if (task.startTime) {
        const timeSpan = document.createElement('span');
        timeSpan.textContent = task.startTime + (task.endTime ? '-' + task.endTime : '');
        meta.appendChild(timeSpan);
      }
      if (task.location) {
        const locSpan = document.createElement('span');
        locSpan.textContent = task.location;
        meta.appendChild(locSpan);
      }
      if (task.priority > 0) {
        const dot = document.createElement('span');
        dot.className = 'priority-dot priority-' + task.priority;
        meta.appendChild(dot);
      }
      body.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'task-swipe-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'task-delete-btn';
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        Store.deleteTask(task.id);
        this.render();
      });
      actions.appendChild(delBtn);

      card.appendChild(colorBar);
      card.appendChild(checkbox);
      card.appendChild(body);
      card.appendChild(actions);
      list.appendChild(card);
    });
  },

  _filteredTasks() {
    const all = Store.getTasks();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    switch (this.currentFilter) {
      case 'today': return all.filter(t => t.date === todayStr);
      case 'week': {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const endStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`;
        return all.filter(t => t.date >= todayStr && t.date <= endStr);
      }
      case 'overdue': return all.filter(t => t.date && t.date < todayStr && !t.done);
      default: return all;
    }
  }
};
