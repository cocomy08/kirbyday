const Store = {
  _db: null,
  _cache: { tasks: [], settings: null, history: [] },

  _defaults: {
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
  },

  init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('kirbyday', 3);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };
      req.onsuccess = async e => {
        this._db = e.target.result;
        await this._loadCache();
        this._migrateLegacy();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  _migrateLegacy() {
    try {
      const raw = localStorage.getItem('kirbyday');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.tasks && data.tasks.length && this._cache.tasks.length === 0) {
        data.tasks.forEach(t => this.addTask(t));
      }
      if (data.settings) {
        Object.entries(data.settings).forEach(([k, v]) => {
          if (this._cache.settings[k] === undefined || this._cache.settings[k] === this._defaults[k]) {
            this.setSetting(k, v);
          }
        });
      }
      localStorage.removeItem('kirbyday');
    } catch {}
  },

  async _loadCache() {
    this._cache.tasks = await this._getAll('tasks');
    const settingsArr = await this._getAll('settings');
    this._cache.settings = { ...this._defaults };
    settingsArr.forEach(s => { this._cache.settings[s.key] = s.value; });
    this._cache.history = await this._getAll('history');
  },

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  _put(store, data) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  _delete(store, key) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  _clear(store) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getTasks() { return this._cache.tasks; },

  getHistory() { return this._cache.history; },

  addHistory(record) {
    if (!record.id) record.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (!record.ts) record.ts = Date.now();
    this._cache.history.push(record);
    this._put('history', record);
    return record;
  },

  deleteHistory(id) {
    this._cache.history = this._cache.history.filter(h => h.id !== id);
    this._delete('history', id);
  },

  clearHistory() {
    this._cache.history = [];
    this._clear('history');
  },

  addTask(task) {
    if (!task.id) {
      task.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }
    if (task.done === undefined) task.done = false;
    if (!task.createdAt) task.createdAt = new Date().toISOString();
    if (!task.order) task.order = this._cache.tasks.length;
    this._cache.tasks.push(task);
    this._put('tasks', task);
    return task;
  },

  updateTask(id, updates) {
    const t = this._cache.tasks.find(t => t.id === id);
    if (t) {
      Object.assign(t, updates);
      this._put('tasks', t);
    }
    return t;
  },

  // 完成语义：重复任务推进到下一次，非重复任务翻转 done。
  completeTask(id) {
    const t = this._cache.tasks.find(t => t.id === id);
    if (!t) return t;
    if (t.repeat) {
      const next = Recurrence.nextOccurrence(t.date, t.repeat, t.repeatInterval || 1, t.date);
      if (!next || (t.repeatEnd && next > t.repeatEnd)) {
        t.done = true;
      } else {
        t.date = next;
      }
    } else {
      t.done = !t.done;
    }
    this._put('tasks', t);
    return t;
  },

  deleteTask(id) {
    this._cache.tasks = this._cache.tasks.filter(t => t.id !== id);
    this._delete('tasks', id);
  },

  reorderTasks(ids) {
    ids.forEach((id, i) => {
      const t = this._cache.tasks.find(t => t.id === id);
      if (t) { t.order = i; this._put('tasks', t); }
    });
    this._cache.tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getSetting(key) { return this._cache.settings[key]; },

  setSetting(key, val) {
    this._cache.settings[key] = val;
    this._put('settings', { key, value: val });
  },

  getSettings() { return { ...this._cache.settings }; },

  async exportData() {
    const tasks = this.getTasks();
    const settings = this.getSettings();
    return JSON.stringify({ version: 3, tasks, settings, history: this.getHistory(), exportedAt: new Date().toISOString() });
  },

  async importData(jsonStr) {
    const data = JSON.parse(jsonStr);
    await this._clear('tasks');
    await this._clear('settings');
    await this._clear('history');
    this._cache.tasks = [];
    this._cache.settings = { ...this._defaults };
    this._cache.history = [];
    if (data.tasks) {
      for (const t of data.tasks) {
        await this._put('tasks', t);
        this._cache.tasks.push(t);
      }
    }
    if (data.settings) {
      for (const [k, v] of Object.entries(data.settings)) {
        await this._put('settings', { key: k, value: v });
        this._cache.settings[k] = v;
      }
    }
    if (data.history) {
      for (const h of data.history) {
        await this._put('history', h);
        this._cache.history.push(h);
      }
    }
  },

  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return { usage: est.usage || 0, quota: est.quota || 0 };
    }
    return { usage: 0, quota: 0 };
  }
};
