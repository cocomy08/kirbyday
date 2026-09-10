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

  init() {
    Store.init();
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
    const modal = document.getElementById('modal-add-task');
    const form = document.getElementById('task-form');

    document.getElementById('btn-add-task').addEventListener('click', () => {
      modal.classList.remove('hidden');
      const today = new Date();
      document.getElementById('task-date').value =
        `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      document.getElementById('task-title').focus();
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
      form.reset();
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) { modal.classList.add('hidden'); form.reset(); }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const task = {
        title: document.getElementById('task-title').value.trim(),
        note: document.getElementById('task-note').value.trim(),
        date: document.getElementById('task-date').value,
        startTime: document.getElementById('task-start').value,
        endTime: document.getElementById('task-end').value,
        priority: parseInt(document.getElementById('task-priority').value),
        location: document.getElementById('task-location').value.trim(),
        color: this.selectedColor
      };
      if (!task.title) return;
      Store.addTask(task);
      modal.classList.add('hidden');
      form.reset();
      TasksView.render();
      if (Router.currentTab === 'calendar') CalendarView.render();
    });
  },

  _initToday() {
    document.getElementById('btn-today').addEventListener('click', () => {
      CalendarView.goToday();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
