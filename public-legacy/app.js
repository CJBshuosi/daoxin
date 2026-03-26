// ═══════════════════════════════════════════════════════
//  道心文案 · app.js
//  修改这个文件来调整功能逻辑
//  修改 style.css 来调整界面样式
//  修改 index.html 来调整页面结构
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = 'daoxin_v1';
const COLORS = ['#5a7a5a','#7a5a3a','#4a5a7a','#8b4513','#6a4a7a','#4a7a7a','#7a4a4a','#7a7a3a','#3a5a7a','#7a5a6a'];

// ─── State（所有数据都在这里）────────────────────────
const state = {
  tracks: [],
  currentId: null,
  editingTrackId: null,
};

// ─── 持久化：读 / 存 ──────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.tracks    = parsed.tracks    ?? [];
      state.currentId = parsed.currentId ?? null;
    }
  } catch (e) {
    console.warn('读取本地数据失败，使用默认值', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tracks:    state.tracks,
      currentId: state.currentId,
    }));
  } catch (e) {
    console.warn('保存本地数据失败', e);
  }
}

// ─── 初始化默认赛道（首次使用）────────────────────────
function initDefaults() {
  if (state.tracks.length > 0) return;
  [
    { name: '道家养生', desc: '传统道家养生知识', color: '#5a7a5a', banned: '治疗,根治,特效', fewShot: '' },
    { name: '国学',     desc: '经典国学智慧分享', color: '#7a5a3a', banned: '',                fewShot: '' },
    { name: '修心',     desc: '内心成长与冥想',   color: '#4a5a7a', banned: '',                fewShot: '' },
  ].forEach(addTrackData);
  state.currentId = state.tracks[0].id;
  saveState();
}

function genId() {
  return 't' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function addTrackData({ name, desc, color, banned, fewShot }) {
  const id = genId();
  state.tracks.push({
    id, name, desc, color,
    banned:      banned  ?? '',
    fewShot:     fewShot ?? '',
    memory:      '',
    refAccounts: [],
    count:       0,
  });
  return id;
}

function getTrack(id) {
  return state.tracks.find(t => t.id === id);
}

// ─── 侧边栏渲染 ───────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById('trackList');
  list.innerHTML = '';
  state.tracks.forEach(t => {
    const btn = document.createElement('div');
    btn.className = 'track-btn' + (t.id === state.currentId ? ' active' : '');
    btn.innerHTML = `
      <span class="track-dot" style="background:${t.color}"></span>
      <span class="track-name">${esc(t.name)}</span>
      <span class="track-count">${t.count}</span>
      <button class="track-del" title="删除赛道" onclick="event.stopPropagation();deleteTrack('${t.id}')">×</button>
    `;
    btn.addEventListener('click', () => selectTrack(t.id));
    list.appendChild(btn);
  });
}

// ─── 选中 Track ───────────────────────────────────────
function selectTrack(id) {
  state.currentId = id;
  saveState();
  renderSidebar();

  const t = getTrack(id);
  if (!t) return;

  const badge = document.getElementById('currentBadge');
  badge.textContent = t.name;
  badge.style.cssText = `background:${t.color}22;color:${t.color};border:1px solid ${t.color}44;font-size:12px;font-weight:500;padding:3px 12px;border-radius:3px;letter-spacing:1px`;
  document.getElementById('currentDesc').textContent = t.desc;
  document.getElementById('promptInput').placeholder = `输入「${t.name}」相关的视频主题...`;

  renderRefRow(t);
  updateMemDisplay(t);
}

// ─── 对标账号 ─────────────────────────────────────────
function renderRefRow(t) {
  const row = document.getElementById('refRow');
  row.innerHTML = `<span class="ref-label">对标账号：</span>`;

  t.refAccounts.forEach((acc, i) => {
    const span = document.createElement('span');
    span.className = 'ref-tag active';
    span.textContent = acc;
    span.title = '点击移除';
    span.onclick = () => { t.refAccounts.splice(i, 1); saveState(); renderRefRow(t); };
    row.appendChild(span);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'ref-add';
  addBtn.textContent = '+ 添加账号';
  addBtn.onclick = () => {
    const name = prompt('输入对标账号名（如 @道家真传）：');
    if (name?.trim()) { t.refAccounts.push(name.trim()); saveState(); renderRefRow(t); }
  };
  row.appendChild(addBtn);
}

function addRef() { /* 由 renderRefRow 内的按钮调用 */ }

// ─── 记忆展示 ─────────────────────────────────────────
function updateMemDisplay(t) {
  document.getElementById('memDisplay').textContent =
    t.memory || '（空）— 生成后AI会自动学习偏好';
}

// ─── 新增 / 编辑 Track ───────────────────────────────
function openAddTrack() {
  state.editingTrackId = null;
  document.getElementById('trackModalTitle').textContent = '新增赛道';
  document.getElementById('tName').value    = '';
  document.getElementById('tDesc').value    = '';
  document.getElementById('tBanned').value  = '';
  document.getElementById('tFewShot').value = '';
  renderColorPicker(COLORS[Math.floor(Math.random() * COLORS.length)]);
  document.getElementById('trackModal').classList.add('open');
  setTimeout(() => document.getElementById('tName').focus(), 100);
}

function renderColorPicker(selected) {
  const row = document.getElementById('colorRow');
  row.innerHTML = '';
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c === selected ? ' selected' : '');
    sw.style.background = c;
    sw.onclick = () => {
      row.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    };
    row.appendChild(sw);
  });
}

function getSelectedColor() {
  return document.querySelector('.color-swatch.selected')?.style.background ?? COLORS[0];
}

function closeTrackModal() {
  document.getElementById('trackModal').classList.remove('open');
}

function saveTrack() {
  const name = document.getElementById('tName').value.trim();
  if (!name) { alert('请输入赛道名称'); return; }

  const data = {
    name,
    desc:    document.getElementById('tDesc').value.trim(),
    color:   getSelectedColor(),
    banned:  document.getElementById('tBanned').value.trim(),
    fewShot: document.getElementById('tFewShot').value.trim(),
  };

  if (state.editingTrackId) {
    Object.assign(getTrack(state.editingTrackId), data);
  } else {
    const id = addTrackData(data);
    state.currentId = id;
  }

  saveState();
  closeTrackModal();
  renderSidebar();
  if (state.currentId) selectTrack(state.currentId);
}

function deleteTrack(id) {
  const t = getTrack(id);
  if (!t) return;
  if (!confirm(`确认删除赛道「${t.name}」？\n该赛道的记忆和配置将一并删除。`)) return;

  state.tracks = state.tracks.filter(tr => tr.id !== id);
  state.currentId = state.tracks[0]?.id ?? null;
  saveState();
  renderSidebar();

  if (state.currentId) {
    selectTrack(state.currentId);
  } else {
    document.getElementById('currentBadge').textContent = '请先选择赛道';
    document.getElementById('currentBadge').style.cssText = '';
    document.getElementById('currentDesc').textContent = '';
    document.getElementById('memDisplay').textContent = '选择一个Track后显示';
  }
}

// ─── 记忆 Modal ───────────────────────────────────────
function openMemModal() {
  const t = getTrack(state.currentId);
  if (!t) return;
  document.getElementById('memTrackName').textContent = t.name;
  document.getElementById('memEditArea').value = t.memory;
  document.getElementById('memModal').classList.add('open');
}

function closeMemModal() {
  document.getElementById('memModal').classList.remove('open');
}

function saveMemory() {
  const t = getTrack(state.currentId);
  if (t) {
    t.memory = document.getElementById('memEditArea').value.trim();
    saveState();
    updateMemDisplay(t);
  }
  closeMemModal();
}

// ─── Prompt 组装（核心）──────────────────────────────
// 想提升生成质量，主要改这个函数
function buildSystemPrompt(t) {
  const refs = t.refAccounts.length ? t.refAccounts.join('、') : '无指定';

  let p = `你是一个专业的短视频文案生成Agent，专注于「${t.name}」垂直赛道。`;
  if (t.desc) p += `（${t.desc}）`;

  p += `\n\n【对标账号风格参考】${refs}`;

  // 注入①：用户偏好记忆
  if (t.memory) {
    p += `\n\n【用户偏好记忆】\n${t.memory}`;
  }

  // 注入②：Few-shot爆款文案（最影响质量）
  if (t.fewShot) {
    p += `\n\n【参考风格文案】请仔细学习以下文案的节奏、用词、钩子方式，模仿其风格：\n---\n${t.fewShot}\n---`;
  }

  // 注入③：禁忌词
  const banned = t.banned
    ? t.banned + '，以及绝对化医疗表述'
    : '绝对化表述、医疗建议、政治敏感词';
  p += `\n\n【必须避免的词语和表达】${banned}`;

  // 固定：结构规范
  p += `\n\n【文案结构】
1. 开头钩子（前3秒）：用悬念/数字/反常识/痛点开场，让人不划走
2. 核心内容：价值输出，节奏感强，多短句，200-350字
3. 结尾引导：引导评论互动或软性关注，不要硬广`;

  // 固定：输出格式
  p += `\n\n【输出格式】严格返回以下JSON，不输出任何其他内容：
{
  "copytext": "正文内容（换行用\\n）",
  "titles": ["标题1", "标题2", "标题3"],
  "music": ["BGM风格1", "BGM风格2", "BGM风格3"],
  "memory_update": "一句话总结本次生成体现的用户偏好"
}`;

  return p;
}

// ─── 生成文案 ─────────────────────────────────────────
async function generate() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const prompt = document.getElementById('promptInput').value.trim();
  const t = getTrack(state.currentId);

  if (!t)      { alert('请先选择或新增一个赛道'); return; }
  if (!prompt) { alert('请输入主题'); return; }
  if (!apiKey) { alert('请在右上角输入 Anthropic API Key'); return; }

  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.textContent = '生成中...';
  document.getElementById('emptyState')?.remove();

  const lid = 'l' + Date.now();
  const loadEl = document.createElement('div');
  loadEl.className = 'loading-card';
  loadEl.id = lid;
  loadEl.innerHTML = `<div class="spinner"></div><span>正在生成「${esc(t.name)}」文案...</span>`;
  document.getElementById('outputArea').prepend(loadEl);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: buildSystemPrompt(t),
        messages: [{ role: 'user', content: `主题：${prompt}` }],
      }),
    });

    if (!resp.ok) {
      const e = await resp.json();
      throw new Error(e.error?.message ?? `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const raw  = data.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { copytext: raw, titles: ['（标题解析失败）'], music: [], memory_update: '' };
    }

    // 更新记忆
    if (parsed.memory_update) {
      t.memory = t.memory
        ? t.memory + '\n' + parsed.memory_update
        : parsed.memory_update;
      updateMemDisplay(t);
    }
    t.count++;
    saveState();
    renderSidebar();

    document.getElementById(lid)?.remove();
    renderResult(parsed, prompt, t);

  } catch (err) {
    document.getElementById(lid)?.remove();
    const errEl = document.createElement('div');
    errEl.className = 'loading-card';
    errEl.style.color = 'var(--red)';
    errEl.textContent = '❌ ' + err.message;
    document.getElementById('outputArea').prepend(errEl);
    setTimeout(() => errEl.remove(), 6000);
  } finally {
    btn.disabled = false;
    btn.textContent = '生 成';
  }
}

// ─── 渲染结果卡片 ─────────────────────────────────────
function renderResult(data, prompt, t) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="card-header">
      <span style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44;font-size:11px;padding:2px 8px;border-radius:3px;font-weight:500">${esc(t.name)}</span>
      <span style="font-size:12px;color:var(--ink3);font-style:italic">${esc(prompt.slice(0, 40))}${prompt.length > 40 ? '…' : ''}</span>
      <span class="card-time">${time}</span>
    </div>
    <div class="card-body">
      <div>
        <div class="sec-label">正文文案</div>
        <div class="copytext">${esc(data.copytext ?? '')}</div>
      </div>
      <div>
        <div class="sec-label">爆款标题</div>
        ${(data.titles ?? []).map((ti, i) => `
          <div class="title-item" onclick="copyStr(${JSON.stringify(ti)}, this)">
            <span class="title-num">${i + 1}</span>
            <span>${esc(ti)}</span>
          </div>
        `).join('')}
      </div>
      ${data.music?.length ? `
        <div>
          <div class="sec-label">BGM 推荐</div>
          <div class="music-row">${data.music.map(m => `<span class="music-tag">${esc(m)}</span>`).join('')}</div>
        </div>` : ''}
    </div>
    <div class="card-actions">
      <button class="act-btn primary" onclick="copyStr(${JSON.stringify(data.copytext ?? '')}, this, '已复制 ✓')">复制正文</button>
      <button class="act-btn" onclick="document.getElementById('promptInput').value=${JSON.stringify(prompt)};generate()">重新生成</button>
      <button class="act-btn" onclick="this.closest('.result-card').remove()">删除</button>
      <span style="font-size:11px;color:var(--ink3);margin-left:auto">${esc(t.refAccounts.join('、'))}</span>
    </div>
  `;
  document.getElementById('outputArea').prepend(card);
}

// ─── 工具函数 ─────────────────────────────────────────
function copyStr(text, el, label = '已复制 ✓') {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.textContent;
    el.textContent = label;
    setTimeout(() => { el.textContent = orig; }, 1500);
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── 快捷键 ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('promptInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
  });
});

// ─── 启动 ─────────────────────────────────────────────
loadState();
initDefaults();
renderSidebar();
if (state.currentId) selectTrack(state.currentId);
