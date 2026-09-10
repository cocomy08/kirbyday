const TASK_COLORS = [
  { name: 'color-1', value: 'var(--color-1)' },
  { name: 'color-2', value: 'var(--color-2)' },
  { name: 'color-3', value: 'var(--color-3)' },
  { name: 'color-4', value: 'var(--color-4)' },
  { name: 'color-5', value: 'var(--color-5)' },
  { name: 'color-6', value: 'var(--color-6)' },
  { name: 'color-7', value: 'var(--color-7)' },
  { name: 'color-8', value: 'var(--color-8)' },
  { name: 'color-9', value: 'var(--color-9)' },
  { name: 'color-10', value: 'var(--color-10)' }
];

const App = {
  selectedColor: TASK_COLORS[4].value,

  async init() {
    await Store.init();
    Router.init();
    CalendarView.init();
    TasksView.init();
    KirbyChat.init();
    SettingsView.init();
    this._initColorPicker();
    this._initModal();
    this._initToday();
    Router.switchTab('tasks');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  },

  _initColorPicker() {
    const picker = document.getElementById('color-picker');
    TASK_COLORS.forEach((c, i) => {
      const dot = document.createElement('div');
      dot.className = 'color-dot' + (i === 4 ? ' active' : '');
      dot.style.background = c.value;
      dot.addEventListener('click', () => {
        picker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.selectedColor = c.value;
      });
      picker.appendChild(dot);
    });
  },

  _initModal() {
    const modal = document.getElementById('modal-task');
    const form = document.getElementById('task-form');

    document.getElementById('btn-add-task').addEventListener('click', () => this.openNewTask());

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
      form.reset();
      document.getElementById('task-edit-id').value = '';
      document.getElementById('task-delete-btn').classList.add('hidden');
      document.getElementById('modal-task-title').textContent = '新建任务';
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        form.reset();
        document.getElementById('task-edit-id').value = '';
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const editId = document.getElementById('task-edit-id').value;
      const data = {
        title: document.getElementById('task-title').value.trim(),
        note: document.getElementById('task-note').value.trim(),
        date: document.getElementById('task-date').value,
        startTime: document.getElementById('task-start').value,
        endTime: document.getElementById('task-end').value,
        priority: parseInt(document.getElementById('task-priority').value),
        location: document.getElementById('task-location').value.trim(),
        color: this.selectedColor
      };
      if (!data.title) return;

      if (editId) {
        Store.updateTask(editId, data);
      } else {
        Store.addTask(data);
      }

      modal.classList.add('hidden');
      form.reset();
      document.getElementById('task-edit-id').value = '';
      document.getElementById('task-delete-btn').classList.add('hidden');
      TasksView.render();
      if (Router.currentTab === 'calendar') CalendarView.render();
    });

    document.getElementById('task-delete-btn').addEventListener('click', () => {
      const editId = document.getElementById('task-edit-id').value;
      if (editId && confirm('确定删除此任务？')) {
        Store.deleteTask(editId);
        modal.classList.add('hidden');
        form.reset();
        document.getElementById('task-edit-id').value = '';
        TasksView.render();
        if (Router.currentTab === 'calendar') CalendarView.render();
      }
    });
  },

  openNewTask() {
    const modal = document.getElementById('modal-task');
    document.getElementById('modal-task-title').textContent = '新建任务';
    document.getElementById('task-edit-id').value = '';
    document.getElementById('task-delete-btn').classList.add('hidden');
    document.getElementById('task-submit-btn').textContent = '保存';
    const today = new Date();
    document.getElementById('task-date').value =
      `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    this.selectedColor = TASK_COLORS[4].value;
    document.querySelectorAll('.color-dot').forEach((d, i) => d.classList.toggle('active', i === 4));
    modal.classList.remove('hidden');
    document.getElementById('task-title').focus();
  },

  openEditTask(id) {
    const task = Store.getTasks().find(t => t.id === id);
    if (!task) return;
    const modal = document.getElementById('modal-task');
    document.getElementById('modal-task-title').textContent = '编辑任务';
    document.getElementById('task-edit-id').value = id;
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-note').value = task.note || '';
    document.getElementById('task-date').value = task.date || '';
    document.getElementById('task-start').value = task.startTime || '';
    document.getElementById('task-end').value = task.endTime || '';
    document.getElementById('task-priority').value = task.priority || 0;
    document.getElementById('task-location').value = task.location || '';
    document.getElementById('task-delete-btn').classList.remove('hidden');
    document.getElementById('task-submit-btn').textContent = '更新';

    this.selectedColor = task.color || TASK_COLORS[4].value;
    document.querySelectorAll('.color-dot').forEach(d => {
      d.classList.toggle('active', d.style.background === this.selectedColor);
    });

    modal.classList.remove('hidden');
  },

  _initToday() {
    document.getElementById('btn-today').addEventListener('click', () => CalendarView.goToday());
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
