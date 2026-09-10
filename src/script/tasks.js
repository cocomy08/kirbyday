const TasksView = {
  currentFilter: 'all',
  dragSrcId: null,

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
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="6" stroke="var(--text-tertiary)" stroke-width="1.5"/><path d="M16 18h16M16 26h10" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round"/></svg>
          <p>暂无任务</p>
          <span>点击右上角 + 添加新任务</span>
        </div>`;
      return;
    }

    list.innerHTML = '';
    const sorted = [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.order || 0) - (b.order || 0);
    });

    sorted.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card' + (task.done ? ' done' : '');
      card.dataset.id = task.id;
      card.draggable = true;

      card.addEventListener('dragstart', e => {
        this.dragSrcId = task.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (this.dragSrcId && this.dragSrcId !== task.id) {
          this._handleReorder(this.dragSrcId, task.id);
        }
      });

      // Touch drag support
      let touchY = 0;
      card.addEventListener('touchstart', e => {
        touchY = e.touches[0].clientY;
      }, { passive: true });

      card.addEventListener('touchmove', e => {
        const dy = Math.abs(e.touches[0].clientY - touchY);
        if (dy > 10) card.style.opacity = '0.7';
      }, { passive: true });

      card.addEventListener('touchend', () => {
        card.style.opacity = '';
      });

      const colorBar = document.createElement('div');
      colorBar.className = 'task-color-bar';
      colorBar.style.background = task.color || 'var(--accent)';

      const checkbox = document.createElement('div');
      checkbox.className = 'task-checkbox' + (task.done ? ' checked' : '');
      checkbox.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';
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
        const [, m, d] = task.date.split('-');
        meta.innerHTML += `<span>${+m}月${+d}日</span>`;
      }
      if (task.startTime) {
        meta.innerHTML += `<span>${task.startTime}${task.endTime ? '-' + task.endTime : ''}</span>`;
      }
      if (task.location) meta.innerHTML += `<span>${task.location}</span>`;
      if (task.priority > 0) meta.innerHTML += `<span class="priority-dot priority-${task.priority}"></span>`;
      body.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'task-action-btn';
      editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
      editBtn.addEventListener('click', e => { e.stopPropagation(); App.openEditTask(task.id); });

      const delBtn = document.createElement('button');
      delBtn.className = 'task-action-btn';
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
      delBtn.addEventListener('click', e => { e.stopPropagation(); Store.deleteTask(task.id); this.render(); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      card.appendChild(colorBar);
      card.appendChild(checkbox);
      card.appendChild(body);
      card.appendChild(actions);

      card.addEventListener('click', () => App.openEditTask(task.id));
      list.appendChild(card);
    });
  },

  _handleReorder(srcId, targetId) {
    const tasks = this._filteredTasks().sort((a, b) => (a.order || 0) - (b.order || 0));
    const ids = tasks.map(t => t.id);
    const srcIdx = ids.indexOf(srcId);
    const tgtIdx = ids.indexOf(targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    ids.splice(srcIdx, 1);
    ids.splice(tgtIdx, 0, srcId);
    Store.reorderTasks(ids);
    this.render();
  },

  _filteredTasks() {
    const all = Store.getTasks();
    const today = new Date();
    const ts = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    switch (this.currentFilter) {
      case 'today': return all.filter(t => t.date === ts);
      case 'week': {
        const we = new Date(today); we.setDate(we.getDate() + 7);
        const es = `${we.getFullYear()}-${String(we.getMonth()+1).padStart(2,'0')}-${String(we.getDate()).padStart(2,'0')}`;
        return all.filter(t => t.date >= ts && t.date <= es);
      }
      case 'overdue': return all.filter(t => t.date && t.date < ts && !t.done);
      default: return all;
    }
  }
};
