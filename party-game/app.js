// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const BOT_USERNAME = 'charlie_party_bot';

let currentMode = null;
let questionCount = 0;
let currentQuestion = null;
let usedIndices = {};

function pick(arr, mode) {
  if (!usedIndices[mode]) usedIndices[mode] = new Set();
  if (usedIndices[mode].size >= arr.length) usedIndices[mode].clear();
  let idx;
  do { idx = Math.floor(Math.random() * arr.length); } while (usedIndices[mode].has(idx));
  usedIndices[mode].add(idx);
  return arr[idx];
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showMenu() {
  currentMode = null;
  questionCount = 0;
  showScreen('menu');
  if (tg) tg.BackButton.hide();
}

function startGame(mode) {
  currentMode = mode;
  questionCount = 0;
  showScreen('game');
  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(showMenu);
  }
  updateTitle();
  nextQuestion();
}

function updateTitle() {
  const titles = {
    truth: '🎯 Правда',
    dare: '🔥 Дія',
    never: '🍺 Я ніколи не...',
    rather: '⚖️ Що б ти обрав?',
    random: '🎲 Мікс'
  };
  document.getElementById('game-title').textContent = titles[currentMode] || '🎲 Гра';
}

function nextQuestion() {
  questionCount++;
  document.getElementById('counter').textContent = '#' + questionCount;

  let mode = currentMode;
  if (mode === 'random') {
    mode = ['truth', 'dare', 'never', 'rather'][Math.floor(Math.random() * 4)];
  }

  const card = document.getElementById('question-card');
  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');

  const ratherOpts = document.getElementById('rather-options');
  const neverBtns = document.getElementById('never-btns');
  ratherOpts.classList.add('hidden');
  neverBtns.classList.add('hidden');

  // Reset option button styles
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

  if (tg) tg.HapticFeedback?.impactOccurred('light');

  if (mode === 'truth') {
    currentQuestion = pick(TRUTHS, 'truth');
    document.getElementById('question-text').textContent = '🎯 ' + currentQuestion;
  } else if (mode === 'dare') {
    currentQuestion = pick(DARES, 'dare');
    document.getElementById('question-text').textContent = '🔥 ' + currentQuestion;
  } else if (mode === 'never') {
    currentQuestion = pick(NEVERS, 'never');
    document.getElementById('question-text').textContent = currentQuestion;
    neverBtns.classList.remove('hidden');
  } else if (mode === 'rather') {
    const pair = pick(RATHERS, 'rather');
    currentQuestion = pair;
    document.getElementById('question-text').textContent = 'Що б ти обрав?';
    document.getElementById('optA').textContent = pair[0];
    document.getElementById('optB').textContent = pair[1];
    ratherOpts.classList.remove('hidden');
  }
}

function vote(choice) {
  if (tg) tg.HapticFeedback?.impactOccurred('medium');
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.remove('selected'));
  if (choice === 'A') btns[0].classList.add('selected');
  else btns[1].classList.add('selected');
}

function react(type) {
  if (tg) tg.HapticFeedback?.impactOccurred('medium');
  if (type === 'drink') {
    tg?.showAlert?.('🍺 Ти робив це!') || alert('🍺 Ти робив це!');
  } else {
    tg?.showAlert?.('😇 Чистий/чиста!') || alert('😇 Чистий/чиста!');
  }
}

function shareBot() {
  const userId = tg?.initDataUnsafe?.user?.id || '';
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
  const text = '🎲 Грай у Правду чи Дію з друзями!';

  if (tg?.switchInlineQuery) {
    // Share via inline
    tg.switchInlineQuery('', ['users', 'groups', 'channels']);
  } else {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`, '_blank');
  }
}

function shareQuestion() {
  let text = '';
  if (Array.isArray(currentQuestion)) {
    text = `⚖️ Що б ти обрав?\n🅰️ ${currentQuestion[0]}\n🅱️ ${currentQuestion[1]}`;
  } else {
    text = currentQuestion;
  }
  text += `\n\n🎲 Грати → @${BOT_USERNAME}`;

  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery('', ['users', 'groups', 'channels']);
  } else {
    window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank');
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  showScreen('menu');
});
