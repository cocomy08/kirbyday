const Store = {
  _data: null,

  _defaults: {
    tasks: [],
    settings: {
      weekStart: 1,
      defaultView: 'week',
      reminder: 15,
      darkMode: false,
      showLunar: true,
      showHolidays: true,
      showWeekNum: false,
      theme: 'default',
      apiUrl: '',
      apiKey: '',
      model: ''
    }
  },

  init() {
    try {
      const raw = localStorage.getItem('kirbyday');
      this._data = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(this._defaults));
    } catch {
      this._data = JSON.parse(JSON.stringify(this._defaults));
    }
    if (!this._data.settings) this._data.settings = { ...this._defaults.settings };
    if (!this._data.tasks) this._data.tasks = [];
  },

  _save() {
    localStorage.setItem('kirbyday', JSON.stringify(this._data));
  },

  getTasks() { return this._data.tasks; },

  addTask(task) {
    task.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    task.done = false;
    task.createdAt = new Date().toISOString();
    this._data.tasks.push(task);
    this._save();
    return task;
  },

  updateTask(id, updates) {
    const t = this._data.tasks.find(t => t.id === id);
    if (t) { Object.assign(t, updates); this._save(); }
    return t;
  },

  deleteTask(id) {
    this._data.tasks = this._data.tasks.filter(t => t.id !== id);
    this._save();
  },

  getSetting(key) { return this._data.settings[key]; },

  setSetting(key, val) {
    this._data.settings[key] = val;
    this._save();
  },

  getSettings() { return { ...this._data.settings }; }
};
