const SettingsView = {
  init() {
    this._loadValues();
    this._bindNavigation();
    this._bindToggles();
    this._bindAPI();
    this._bindTheme();
    this._bindSelects();
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
      document.getElementById('setting-dark-mode').classList.add('on');
      document.getElementById('setting-dark-mode').setAttribute('aria-checked', 'true');
    }
    if (s.showLunar) {
      document.getElementById('setting-lunar').classList.add('on');
      document.getElementById('setting-lunar').setAttribute('aria-checked', 'true');
    }
    if (s.showHolidays) {
      document.getElementById('setting-holidays').classList.add('on');
      document.getElementById('setting-holidays').setAttribute('aria-checked', 'true');
    }
    if (s.showWeekNum) {
      document.getElementById('setting-weeknum').classList.add('on');
      document.getElementById('setting-weeknum').setAttribute('aria-checked', 'true');
    }
    if (s.theme && s.theme !== 'default') {
      document.body.classList.add('theme-' + s.theme);
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      const tc = document.querySelector(`.theme-card[data-theme="${s.theme}"]`);
      if (tc) tc.classList.add('active');
    }
    if (s.model) {
      const sel = document.getElementById('setting-model');
      sel.innerHTML = `<option value="${s.model}" selected>${s.model}</option>`;
    }
  },

  _bindNavigation() {
    document.querySelectorAll('.settings-item[data-setting]').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.setting;
        const sub = document.getElementById('settings-' + key);
        if (sub) {
          document.getElementById('settings-main').classList.add('hidden');
          sub.classList.remove('hidden');
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
    const toggleMap = {
      'setting-dark-mode': { key: 'darkMode', onToggle: v => {
        document.body.classList.toggle('dark', v);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = v ? '#0d1117' : '#0969da';
      }},
      'setting-lunar': { key: 'showLunar' },
      'setting-holidays': { key: 'showHolidays' },
      'setting-weeknum': { key: 'showWeekNum' }
    };

    Object.entries(toggleMap).forEach(([id, cfg]) => {
      const btn = document.getElementById(id);
      btn.addEventListener('click', () => {
        const isOn = btn.classList.toggle('on');
        btn.setAttribute('aria-checked', isOn);
        Store.setSetting(cfg.key, isOn);
        if (cfg.onToggle) cfg.onToggle(isOn);
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
        const resp = await fetch(url + '/models', {
          headers: { 'Authorization': 'Bearer ' + key }
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const models = (data.data || []).map(m => m.id).sort();
        const sel = document.getElementById('setting-model');
        sel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
        if (models.length === 0) sel.innerHTML = '<option value="">无可用模型</option>';
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
      alert('配置已保存');
    });
  },

  _bindTheme() {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const theme = card.dataset.theme;
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (theme !== 'default') document.body.classList.add('theme-' + theme);
        if (Store.getSetting('darkMode')) document.body.classList.add('dark');
        Store.setSetting('theme', theme);
      });
    });
  },

  _bindSelects() {
    document.getElementById('setting-week-start').addEventListener('change', e => {
      Store.setSetting('weekStart', parseInt(e.target.value));
    });
    document.getElementById('setting-default-view').addEventListener('change', e => {
      Store.setSetting('defaultView', e.target.value);
    });
    document.getElementById('setting-reminder').addEventListener('change', e => {
      Store.setSetting('reminder', parseInt(e.target.value));
    });
  }
};
