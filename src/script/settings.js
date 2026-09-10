const SettingsView = {
  init() {
    this._loadValues();
    this._bindNav();
    this._bindToggles();
    this._bindAPI();
    this._bindTheme();
    this._bindSelects();
    this._bindData();
  },

  _loadValues() {
    const s = Store.getSettings();
    document.getElementById('setting-week-start').value = s.weekStart;
    document.getElementById('setting-default-view').value = s.defaultView;
    document.getElementById('setting-reminder').value = s.reminder;
    document.getElementById('setting-api-url').value = s.apiUrl || '';
    document.getElementById('setting-api-key').value = s.apiKey || '';

    if (s.darkMode) {
      document.body.classList.add('dark');
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.content = '#000000';
      this._setToggle('setting-dark-mode', true);
    }
    this._setToggle('setting-lunar', s.showLunar !== false);
    this._setToggle('setting-holidays', s.showHolidays !== false);
    this._setToggle('setting-weeknum', !!s.showWeekNum);

    if (s.theme && s.theme !== 'default') {
      document.body.classList.add('theme-' + s.theme);
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      const tc = document.querySelector(`.theme-card[data-theme="${s.theme}"]`);
      if (tc) tc.classList.add('active');
    }
    if (s.model) {
      document.getElementById('setting-model').innerHTML = `<option value="${s.model}" selected>${s.model}</option>`;
    }
  },

  _setToggle(id, on) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', on);
  },

  _bindNav() {
    document.querySelectorAll('.settings-item[data-setting]').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.setting;
        const sub = document.getElementById('settings-' + key);
        if (sub) {
          document.getElementById('settings-main').classList.add('hidden');
          sub.classList.remove('hidden');
          if (key === 'data') this._updateStorageInfo();
        }
      });
    });
    document.querySelectorAll('.settings-back').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.settings-sub').classList.add('hidden');
        document.getElementById('settings-main').classList.remove('hidden');
      });
    });
  },

  _bindToggles() {
    const map = {
      'setting-dark-mode': {
        key: 'darkMode',
        cb: v => {
          document.body.classList.toggle('dark', v);
          const m = document.querySelector('meta[name="theme-color"]');
          if (m) m.content = v ? '#000000' : '#f2f2f7';
        }
      },
      'setting-lunar': { key: 'showLunar' },
      'setting-holidays': { key: 'showHolidays' },
      'setting-weeknum': { key: 'showWeekNum' }
    };

    Object.entries(map).forEach(([id, cfg]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const on = btn.classList.toggle('on');
        btn.setAttribute('aria-checked', on);
        Store.setSetting(cfg.key, on);
        if (cfg.cb) cfg.cb(on);
      });
    });
  },

  _bindAPI() {
    document.getElementById('btn-fetch-models').addEventListener('click', async () => {
      const url = document.getElementById('setting-api-url').value.trim();
      const key = document.getElementById('setting-api-key').value.trim();
      if (!url || !key) { alert('请先填写 URL 和 Key'); return; }

      const btn = document.getElementById('btn-fetch-models');
      btn.textContent = '拉取中...';
      btn.disabled = true;
      try {
        const resp = await fetch(url + '/models', { headers: { 'Authorization': 'Bearer ' + key } });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const models = (data.data || []).map(m => m.id).sort();
        const sel = document.getElementById('setting-model');
        sel.innerHTML = models.length
          ? models.map(m => `<option value="${m}">${m}</option>`).join('')
          : '<option value="">无可用模型</option>';
      } catch (err) {
        alert('拉取失败: ' + err.message);
      } finally {
        btn.textContent = '拉取模型列表';
        btn.disabled = false;
      }
    });

    document.getElementById('btn-save-api').addEventListener('click', () => {
      Store.setSetting('apiUrl', document.getElementById('setting-api-url').value.trim());
      Store.setSetting('apiKey', document.getElementById('setting-api-key').value.trim());
      Store.setSetting('model', document.getElementById('setting-model').value);
      const btn = document.getElementById('btn-save-api');
      btn.textContent = '已保存';
      setTimeout(() => { btn.textContent = '保存配置'; }, 1500);
    });
  },

  _bindTheme() {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const theme = card.dataset.theme;
        document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
        if (theme !== 'default') document.body.classList.add('theme-' + theme);
        if (Store.getSetting('darkMode')) document.body.classList.add('dark');
        Store.setSetting('theme', theme);
      });
    });
  },

  _bindSelects() {
    document.getElementById('setting-week-start').addEventListener('change', e => Store.setSetting('weekStart', parseInt(e.target.value)));
    document.getElementById('setting-default-view').addEventListener('change', e => Store.setSetting('defaultView', e.target.value));
    document.getElementById('setting-reminder').addEventListener('change', e => Store.setSetting('reminder', parseInt(e.target.value)));
  },

  _bindData() {
    document.getElementById('btn-export').addEventListener('click', async () => {
      const json = await Store.exportData();
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      const blob = new Blob([json], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kd_${dateStr}.bck`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.bck,.json';
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          await Store.importData(text);
          alert('导入成功，将刷新页面');
          location.reload();
        } catch (err) {
          alert('导入失败: ' + err.message);
        }
      });
      input.click();
    });

    document.getElementById('btn-clear-data').addEventListener('click', async () => {
      if (!confirm('确定要清除所有数据吗？此操作不可恢复。')) return;
      await Store.importData(JSON.stringify({ version: 2, tasks: [], settings: {} }));
      alert('数据已清除，将刷新页面');
      location.reload();
    });
  },

  async _updateStorageInfo() {
    const est = await Store.getStorageEstimate();
    const taskCount = Store.getTasks().length;
    const el = document.getElementById('storage-info');
    if (!el) return;

    const usageMB = (est.usage / (1024 * 1024)).toFixed(2);
    const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
    const pct = est.quota > 0 ? (est.usage / est.quota * 100) : 0;

    el.innerHTML = `
      <div style="font-size:14px;font-weight:600;margin-bottom:8px">已存储 ${taskCount} 条任务</div>
      <div class="storage-meter"><div class="storage-meter-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="storage-label">${usageMB} MB / ${quotaMB} MB</div>`;
  }
};
