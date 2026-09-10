const KirbyChat = {
  _lastAddedTaskIds: [],

  init() {
    document.getElementById('kirby-send').addEventListener('click', () => this.send());
    const input = document.getElementById('kirby-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
  },

  async send() {
    const input = document.getElementById('kirby-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    const welcome = document.querySelector('.kirby-welcome');
    if (welcome) welcome.style.display = 'none';

    this._addMsg(text, 'user');
    this._showLoading();

    const apiUrl = Store.getSetting('apiUrl');
    const apiKey = Store.getSetting('apiKey');
    const model = Store.getSetting('model');

    if (!apiUrl || !apiKey || !model) {
      this._hideLoading();
      this._addMsg('请先在 设置 → API 配置 中填写 URL、Key 并选择模型', 'ai');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const dow = ['日','一','二','三','四','五','六'][new Date().getDay()];
    const systemPrompt = `你是日程助手卡比。用户会发来一段安排文字，请提取日程信息。

严格输出JSON（不要输出其他内容）：
{"title":"标题","date":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm","location":"地点","priority":0,"note":"备注"}

title必须是5个字以内的精炼总结，例如"组会""面试""取快递""约饭"。
priority: 0=无,1=低,2=中,3=高
没有的字段填空字符串。今天是${today}(周${dow})，请据此计算相对日期。多个事件输出JSON数组。`;

    try {
      const resp = await fetch(apiUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.3 })
      });
      if (!resp.ok) throw new Error('API ' + resp.status);
      const data = await resp.json();
      const content = data.choices[0].message.content;
      this._hideLoading();
      this._handleResponse(content);
    } catch (err) {
      this._hideLoading();
      this._addMsg('出错了: ' + err.message, 'ai');
    }
  },

  _handleResponse(content) {
    let parsed;
    try {
      const m = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!m) throw new Error();
      parsed = JSON.parse(m[0]);
      if (!Array.isArray(parsed)) parsed = [parsed];
    } catch {
      this._addMsg(content, 'ai');
      return;
    }

    parsed.forEach(item => this._showReviewCard(item));
  },

  _showReviewCard(item) {
    const wrap = document.createElement('div');
    wrap.className = 'kirby-msg ai';

    const fields = [
      { key: 'title', label: '标题', val: item.title || '' },
      { key: 'date', label: '日期', val: item.date || '' },
      { key: 'startTime', label: '开始', val: item.startTime || '' },
      { key: 'endTime', label: '结束', val: item.endTime || '' },
      { key: 'location', label: '地点', val: item.location || '' },
      { key: 'priority', label: '优先级', val: String(item.priority || 0) },
      { key: 'note', label: '备注', val: item.note || '' }
    ];

    let isEditing = false;

    const renderCard = (editable) => {
      let html = `<div class="review-card"><div class="review-title">${editable ? '编辑日程' : '提取结果'}</div>`;
      fields.forEach(f => {
        html += `<div class="review-field">
          <span class="rf-label">${f.label}</span>
          ${editable
            ? `<input class="rf-input" data-key="${f.key}" value="${f.val}" />`
            : `<span class="rf-value">${f.key === 'priority' ? ['无','低','中','高'][+f.val] : (f.val || '—')}</span>`
          }
        </div>`;
      });
      html += `<div class="review-actions">`;
      if (editable) {
        html += `<button class="review-confirm" data-action="save">保存</button>`;
        html += `<button class="review-edit" data-action="cancel">取消</button>`;
      } else {
        html += `<button class="review-confirm" data-action="add">添加到日程</button>`;
        html += `<button class="review-edit" data-action="edit">编辑</button>`;
      }
      html += `</div></div>`;
      return html;
    };

    const update = () => {
      wrap.innerHTML = renderCard(isEditing);
      wrap.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'edit') {
            isEditing = true;
            update();
          } else if (action === 'cancel') {
            isEditing = false;
            update();
          } else if (action === 'save') {
            wrap.querySelectorAll('.rf-input').forEach(inp => {
              const f = fields.find(f => f.key === inp.dataset.key);
              if (f) f.val = inp.value;
            });
            isEditing = false;
            update();
          } else if (action === 'add') {
            this._addTaskFromReview(fields, wrap);
          }
        });
      });
    };

    update();
    document.getElementById('kirby-messages').appendChild(wrap);
    this._scrollBottom();
  },

  _addTaskFromReview(fields, wrap) {
    const colors = Array.from({ length: 10 }, (_, i) => `var(--color-${i + 1})`);
    const data = {};
    fields.forEach(f => { data[f.key] = f.val; });

    const task = Store.addTask({
      title: data.title || '未命名',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      location: data.location || '',
      priority: parseInt(data.priority) || 0,
      note: data.note || '',
      color: colors[Math.floor(Math.random() * colors.length)]
    });

    this._lastAddedTaskIds.push(task.id);

    wrap.innerHTML = `
      <div class="review-card" style="text-align:center;padding:16px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin:0 auto 8px"><circle cx="12" cy="12" r="10" fill="var(--green)" opacity="0.15"/><path d="M8 12l3 3 5-5" stroke="var(--green)" stroke-width="2" stroke-linecap="round"/></svg>
        <div style="font-weight:600;margin-bottom:4px">已添加</div>
        <div style="font-size:13px;color:var(--text-secondary)">${data.title}</div>
      </div>`;

    const undo = document.createElement('div');
    undo.className = 'undo-banner';
    undo.innerHTML = `<span>已添加日程</span><button data-undo="true">撤回</button>`;
    undo.querySelector('[data-undo]').addEventListener('click', () => {
      Store.deleteTask(task.id);
      this._lastAddedTaskIds.pop();
      undo.remove();
      wrap.innerHTML = `<div class="review-card" style="text-align:center;padding:16px;color:var(--text-secondary)">已撤回</div>`;
    });
    document.getElementById('kirby-messages').appendChild(undo);
    this._scrollBottom();

    setTimeout(() => { if (undo.parentElement) undo.remove(); }, 8000);
  },

  _addMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'kirby-msg ' + role;
    el.textContent = text;
    document.getElementById('kirby-messages').appendChild(el);
    this._scrollBottom();
  },

  _showLoading() {
    const el = document.createElement('div');
    el.className = 'kirby-msg ai loading';
    el.id = 'kirby-loading';
    el.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('kirby-messages').appendChild(el);
    this._scrollBottom();
  },

  _hideLoading() {
    const el = document.getElementById('kirby-loading');
    if (el) el.remove();
  },

  _scrollBottom() {
    const c = document.getElementById('kirby-chat');
    c.scrollTop = c.scrollHeight;
  }
};
