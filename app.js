const sourceUrl = 'https://www.facebook.com/share/p/19x1PjGU3N/';
const $ = (selector) => document.querySelector(selector);
const elements = {
  topics: $('#topics'),
  status: $('#status-filters'),
  search: $('#search'),
  savedFilter: $('#saved-filter'),
  list: $('#question-list'),
  count: $('#results-count'),
  empty: $('#empty-state'),
  expandAll: $('#expand-all'),
  toast: $('#toast')
};

const state = { topic: '全部主題', status: 'all', savedOnly: false, query: '', open: new Set(), saved: new Set() };
let questions = [];
let toastTimer;

try {
  const stored = JSON.parse(localStorage.getItem('taipei-48-saved') || '[]');
  if (Array.isArray(stored)) state.saved = new Set(stored.filter(Number.isInteger));
} catch { /* The reader still works when browser storage is unavailable. */ }

function announce(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 2500);
}

function saveBookmarks() {
  try { localStorage.setItem('taipei-48-saved', JSON.stringify([...state.saved])); } catch { /* Optional browser storage. */ }
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function visibleQuestions() {
  const query = state.query.trim().toLocaleLowerCase();
  return questions.filter((item) => {
    if (state.topic !== '全部主題' && item.category !== state.topic) return false;
    if (state.status !== 'all' && item.status !== state.status) return false;
    if (state.savedOnly && !state.saved.has(item.id)) return false;
    return !query || `${item.question} ${item.answer.join(' ')} ${item.category}`.toLocaleLowerCase().includes(query);
  });
}

function renderTopics() {
  const counts = new Map();
  for (const item of questions) counts.set(item.category, (counts.get(item.category) || 0) + 1);
  elements.topics.replaceChildren();
  for (const [topic, count] of [['全部主題', questions.length], ...counts.entries()]) {
    const button = make('button', `topic-button${state.topic === topic ? ' active' : ''}`);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(state.topic === topic));
    button.append(make('span', '', topic), make('small', '', String(count).padStart(2, '0')));
    button.addEventListener('click', () => {
      state.topic = topic;
      render();
      if (window.innerWidth < 761) $('#questions').scrollIntoView({ block: 'start' });
    });
    elements.topics.append(button);
  }
}

function renderStatus() {
  const options = [['all', '全部'], ['summary', '原文附有整理'], ['unanswered', '原文未附回答']];
  elements.status.replaceChildren();
  for (const [value, label] of options) {
    const button = make('button', `segment${state.status === value ? ' active' : ''}`, label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(state.status === value));
    button.addEventListener('click', () => { state.status = value; render(); });
    elements.status.append(button);
  }
  elements.savedFilter.setAttribute('aria-pressed', String(state.savedOnly));
  elements.savedFilter.querySelector('span').textContent = state.savedOnly ? '★' : '☆';
}

function questionCard(item) {
  const open = state.open.has(item.id);
  const id = `q-${String(item.id).padStart(2, '0')}`;
  const card = make('article', `question-card${open ? ' open' : ''}`);
  card.id = id;

  const main = make('div', 'question-main');
  const number = make('span', 'question-number', String(item.id).padStart(2, '0'));
  const heading = make('div', 'question-heading');
  const meta = make('div', 'question-meta');
  meta.append(make('span', 'question-topic', item.category));
  meta.append(make('span', `status-tag${item.status === 'unanswered' ? ' unanswered' : ''}`, item.status === 'unanswered' ? '原文未附回答' : '原文附有整理'));
  const title = make('button', 'question-toggle', item.question);
  title.type = 'button';
  title.setAttribute('aria-expanded', String(open));
  title.setAttribute('aria-controls', `${id}-answer`);
  title.addEventListener('click', () => {
    if (state.open.has(item.id)) state.open.delete(item.id);
    else state.open.add(item.id);
    renderList();
    document.getElementById(id)?.querySelector('.question-toggle')?.focus();
  });
  heading.append(meta, title);
  main.append(number, heading, make('span', 'question-chevron', '+'));
  card.append(main);

  const body = make('div', 'question-body');
  body.id = `${id}-answer`;
  body.hidden = !open;
  body.append(make('p', 'answer-label', item.status === 'unanswered' ? '原文回答狀態' : '原貼文整理的回答'));
  if (item.status === 'unanswered') {
    body.append(make('div', 'unanswered-message', '原貼文在這一題後未提供回答。本頁保留問題，等待後續資訊。'));
  } else {
    const content = make('div', 'answer-content');
    for (const paragraph of item.answer) content.append(make('p', '', paragraph));
    body.append(content);
  }

  const actions = make('div', 'question-actions');
  const bookmark = make('button', state.saved.has(item.id) ? 'saved' : '', state.saved.has(item.id) ? '★ 已收藏' : '☆ 收藏此題');
  bookmark.type = 'button';
  bookmark.setAttribute('aria-pressed', String(state.saved.has(item.id)));
  bookmark.setAttribute('aria-label', `${state.saved.has(item.id) ? '取消收藏' : '收藏'}第 ${item.id} 題`);
  bookmark.addEventListener('click', () => {
    if (state.saved.has(item.id)) state.saved.delete(item.id);
    else state.saved.add(item.id);
    saveBookmarks();
    renderList();
    announce(state.saved.has(item.id) ? '已收藏；儲存在此裝置' : '已取消收藏');
  });
  const copy = make('button', '', '複製此題連結 ↗');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#${id}`;
    try { await navigator.clipboard.writeText(url); announce('已複製此題連結'); }
    catch { location.hash = id; announce('已定位此題，請複製網址列連結'); }
  });
  const source = make('a', 'question-source', '原始 Facebook 貼文 ↗');
  source.href = sourceUrl;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  actions.append(bookmark, copy, source);
  body.append(actions);
  card.append(body);
  return card;
}

function renderList() {
  const visible = visibleQuestions();
  elements.list.replaceChildren(...visible.map(questionCard));
  elements.count.replaceChildren(document.createTextNode('顯示 '), make('strong', '', String(visible.length)), document.createTextNode(` / ${questions.length} 題`));
  elements.empty.hidden = visible.length > 0;
  elements.expandAll.hidden = visible.length === 0;
  const allOpen = visible.length > 0 && visible.every((item) => state.open.has(item.id));
  elements.expandAll.innerHTML = `${allOpen ? '全部收合' : '全部展開'} <span aria-hidden="true">${allOpen ? '↗' : '↘'}</span>`;
}

function render() { renderTopics(); renderStatus(); renderList(); }

function handleHash() {
  const match = location.hash.match(/^#q-(\d{2})$/);
  if (!match) return;
  const id = Number(match[1]);
  if (!questions.some((item) => item.id === id)) return;
  state.topic = '全部主題'; state.status = 'all'; state.savedOnly = false; state.query = ''; elements.search.value = '';
  state.open.add(id);
  render();
  requestAnimationFrame(() => document.getElementById(`q-${match[1]}`)?.scrollIntoView({ block: 'center' }));
}

elements.search.addEventListener('input', (event) => { state.query = event.target.value; renderList(); });
elements.savedFilter.addEventListener('click', () => { state.savedOnly = !state.savedOnly; renderStatus(); renderList(); });
elements.expandAll.addEventListener('click', () => {
  const visible = visibleQuestions();
  const allOpen = visible.every((item) => state.open.has(item.id));
  for (const item of visible) allOpen ? state.open.delete(item.id) : state.open.add(item.id);
  renderList();
});
$('#reset-filters').addEventListener('click', () => {
  state.topic = '全部主題'; state.status = 'all'; state.savedOnly = false; state.query = ''; elements.search.value = '';
  render(); elements.search.focus();
});
window.addEventListener('hashchange', handleHash);

try {
  const response = await fetch('./data.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  questions = data.questions;
  const answered = questions.filter((item) => item.status === 'summary').length;
  $('#total-count').textContent = questions.length;
  $('#answered-count').textContent = answered;
  $('#unanswered-count').textContent = questions.length - answered;
  render();
  handleHash();
} catch (error) {
  elements.list.append(make('p', 'load-error', '內容暫時無法載入，請重新整理頁面。'));
  console.error('Failed to load questions', error);
}
