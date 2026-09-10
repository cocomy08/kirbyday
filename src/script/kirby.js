const KirbyChat = {
  init() {
    document.getElementById('kirby-send').addEventListener('click', () => this.send());
    const input = document.getElementById('kirby-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
  },

  async send() {
    const input = document.getElementById('kirby-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const welcome = document.querySelector('.kirby-welcome');
    if (welcome) welcome.style.display = 'none';

    this._addMsg(text, 'user');
    this._showLoading();

    const apiUrl = Store.getSetting('apiUrl');
    const apiKey = Store.getSetting('apiKey');
    const model = Store.getSetting('model');

    if (!apiUrl || !apiKey || !model) {
      this._hideLoading();
      this._addMsg('请先在设置 > API 配置中填写 URL、Key 并选择模型。', 'ai');
      return;
    }

    const systemPrompt = `你是一个日程助手叫卡比。用户会发给你一段文字（可能是从老师、领导、同事那复制的安排），请你从中提取日程信息。

请严格按照以下JSON格式输出（不要输出其他内容）：
{
  "title": "事件标题",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "location": "地点",
  "priority": 0-3,
  "note": "备注"
}

priority: 0=无, 1=低, 2=中, 3=高
如果信息中没有的字段填空字符串，date如果只有相对日期（如明天、下周一）请根据今天是${new Date().toISOString().slice(0,10)}来计算。如果有多个事件，输出JSON数组。`;

    try {
      const resp = await fetch(apiUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3
        })
      });

      if (!resp.ok) throw new Error('API 请求失败: ' + resp.status);
      const data = await resp.json();
      const content = data.choices[0].message.content;
      this._hideLoading();
      this._handleAIResponse(content);
    } catch (err) {
      this._hideLoading();
      this._addMsg('出错了: ' + err.message, 'ai');
    }
  },

  _handleAIResponse(content) {
    let parsed;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no json');
      parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) parsed = [parsed];
    } catch {
      this._addMsg(content, 'ai');
      return;
    }

    parsed.forEach(item => {
      const msgEl = document.createElement('div');
      msgEl.className = 'kirby-msg ai';

      let html = '<div class="parsed-task">';
      const fields = [
        ['标题', item.title],
        ['日期', item.date],
        ['时间', (item.startTime || '') + (item.endTime ? ' - ' + item.endTime : '')],
        ['地点', item.location],
        ['优先级', ['无','低','中','高'][item.priority || 0]],
        ['备注', item.note]
      ];
      fields.forEach(([label, val]) => {
        if (val) html += `<div class="parsed-field"><span class="label">${label}</span><span>${val}</span></div>`;
      });
      html += '</div>';
      html += '<button class="add-to-cal-btn">添加到日程</button>';
      msgEl.innerHTML = html;

      msgEl.querySelector('.add-to-cal-btn').addEventListener('click', () => {
        const colors = [
          'var(--color-1)','var(--color-2)','var(--color-3)','var(--color-4)','var(--color-5)',
          'var(--color-6)','var(--color-7)','var(--color-8)','var(--color-9)','var(--color-10)'
        ];
        Store.addTask({
          title: item.title || '未命名任务',
          date: item.date || '',
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          location: item.location || '',
          priority: item.priority || 0,
          note: item.note || '',
          color: colors[Math.floor(Math.random() * colors.length)]
        });
        msgEl.querySelector('.add-to-cal-btn').textContent = '已添加';
        msgEl.querySelector('.add-to-cal-btn').disabled = true;
        msgEl.querySelector('.add-to-cal-btn').style.opacity = '0.5';
      });

      document.getElementById('kirby-messages').appendChild(msgEl);
      this._scrollToBottom();
    });
  },

  _addMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'kirby-msg ' + role;
    el.textContent = text;
    document.getElementById('kirby-messages').appendChild(el);
    this._scrollToBottom();
  },

  _showLoading() {
    const el = document.createElement('div');
    el.className = 'kirby-msg ai loading';
    el.id = 'kirby-loading';
    el.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('kirby-messages').appendChild(el);
    this._scrollToBottom();
  },

  _hideLoading() {
    const el = document.getElementById('kirby-loading');
    if (el) el.remove();
  },

  _scrollToBottom() {
    const chat = document.getElementById('kirby-chat');
    chat.scrollTop = chat.scrollHeight;
  }
};
