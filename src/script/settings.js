const SettingsView = {
  init() {
    this._loadValues();
    this._bindNav();
    this._bindToggles();
    this._bindAPI();
    this._bindSelects();
    this._bindData();
    this._bindPeriod();
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
      this._setToggle('setting-dark-mode', true);
    }
    this._setToggle('setting-lunar', s.showLunar !== false);
    this._setToggle('setting-holidays', s.showHolidays !== false);
    this._setToggle('setting-weeknum', !!s.showWeekNum);

    if (s.model) {
      document.getElementById('setting-model').innerHTML = `<option value="${s.model}" selected>${s.model}</option>`;
    }
    this._applyThemeColor();
  },

  // 让 iOS/Android PWA 状态栏颜色跟随当前主题背景
  _applyThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    if (bg) meta.content = bg;
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
          this._applyThemeColor();
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
  },

  _bindPeriod() {
    const cycleSel = document.getElementById('setting-period-cycle');
    const daysSel = document.getElementById('setting-period-days');
    const recDaysSel = document.getElementById('period-days');

    for (let i = 20; i <= 45; i++) {
      const o = document.createElement('option');
      o.value = i; o.textContent = i + ' 天';
      cycleSel.appendChild(o);
    }
    for (let i = 1; i <= 10; i++) {
      const o1 = document.createElement('option');
      o1.value = i; o1.textContent = i + ' 天';
      daysSel.appendChild(o1);
      const o2 = document.createElement('option');
      o2.value = i; o2.textContent = i + ' 天';
      recDaysSel.appendChild(o2);
    }

    cycleSel.value = Store.getSetting('periodCycle') || 30;
    daysSel.value = Store.getSetting('periodDuration') || 5;
    recDaysSel.value = Store.getSetting('periodDuration') || 5;

    cycleSel.addEventListener('change', e => {
      Store.setSetting('periodCycle', parseInt(e.target.value) || 30);
      this._renderPeriod();
    });
    daysSel.addEventListener('change', e => {
      Store.setSetting('periodDuration', parseInt(e.target.value) || 5);
      this._renderPeriod();
    });

    document.getElementById('btn-period-add').addEventListener('click', () => {
      document.getElementById('period-edit-id').value = '';
      document.getElementById('period-start').value = new Date().toISOString().slice(0, 10);
      document.getElementById('period-start-time').value = '';
      document.getElementById('period-days').value = Store.getSetting('periodDuration') || 5;
      document.getElementById('period-form').classList.remove('hidden');
    });

    document.getElementById('period-cancel').addEventListener('click', () => {
      document.getElementById('period-form').classList.add('hidden');
    });

    document.getElementById('period-save').addEventListener('click', () => {
      const start = document.getElementById('period-start').value;
      if (!start) { alert('请选择开始日期'); return; }
      const data = {
        start,
        startTime: document.getElementById('period-start-time').value,
        days: parseInt(document.getElementById('period-days').value) || (Store.getSetting('periodDuration') || 5)
      };
      const editId = document.getElementById('period-edit-id').value;
      if (editId) Store.updatePeriod(editId, data);
      else Store.addPeriod(data);
      document.getElementById('period-form').classList.add('hidden');
      this._renderPeriod();
    });

    this._renderPeriod();
  },

  _renderPeriod() {
    this._renderPeriodList();
    this._renderPrediction();
  },

  _renderPeriodList() {
    const list = document.getElementById('period-list');
    const recs = Period.sorted().slice().reverse();
    list.innerHTML = '';
    if (!recs.length) {
      list.innerHTML = '<div class="settings-card" style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:13px">暂无记录</div>';
      return;
    }
    const card = document.createElement('div');
    card.className = 'settings-card';
    recs.forEach(r => {
      const [y, m, d] = r.start.split('-');
      const txt = `${+m}月${+d}日` + (r.startTime ? ` ${r.startTime}` : '') + ` · ${r.days}天`;

      const row = document.createElement('div');
      row.className = 'settings-item';

      const left = document.createElement('div');
      left.className = 'settings-item-left';
      left.innerHTML = `<div class="si-icon pink" style="width:28px;height:28px;border-radius:8px"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-period"/></svg></div><span>${txt}</span>`;

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:4px;flex-shrink:0';
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.style.cssText = 'width:30px;height:30px';
      editBtn.innerHTML = Icon('edit', 15);
      editBtn.addEventListener('click', () => {
        document.getElementById('period-edit-id').value = r.id;
        document.getElementById('period-start').value = r.start;
        document.getElementById('period-start-time').value = r.startTime || '';
        document.getElementById('period-days').value = r.days || (Store.getSetting('periodDuration') || 5);
        document.getElementById('period-form').classList.remove('hidden');
      });
      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn';
      delBtn.style.cssText = 'width:30px;height:30px';
      delBtn.innerHTML = Icon('trash', 15);
      delBtn.addEventListener('click', () => {
        Store.deletePeriod(r.id);
        this._renderPeriod();
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(actions);
      card.appendChild(row);
    });
    list.appendChild(card);
  },

  _renderPrediction() {
    const el = document.getElementById('period-predict');
    if (!el) return;
    const pred = Period.nextPrediction();
    if (!pred) { el.textContent = ''; return; }
    const [, m, d] = pred.split('-');
    el.textContent = `预测下次：${+m}月${+d}日（前两天为可能提前日）`;
  }
};
