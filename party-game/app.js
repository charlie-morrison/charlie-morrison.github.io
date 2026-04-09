// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const BOT_USERNAME = 'charlie_party_bot';

// i18n strings
const i18n = isEn ? {
  title: '🎲 Party Game',
  subtitle: 'Pick a game and play with friends!',
  truth: '🎯 Truth', dare: '🔥 Dare', never: '🍺 Never Have I Ever', rather: '⚖️ Would You Rather',
  random: '🎲 Random question', invite: '📢 Invite friends', next: '➡️ Next', back: '← Back',
  share: '📢 Share this question', iDid: '🍺 I did!', notMe: '😇 Not me!',
  choose: 'Would you rather...?', mix: '🎲 Mix',
  sessionTitle: '🏆 Your session', questions: 'questions', truths: '🎯 truths', dares: '🔥 dares',
  nevers: '🍺 never', choices: '⚖️ choices',
  shareResult: '📢 Share results', continueGame: '🎲 Continue', toMenu: '← Menu',
  played: 'played', rounds: 'rounds in Party Game!',
  confessions: 'confessions',
  playToo: 'Play too →',
  funTitles: ['🎉 Party started!', '🔥 You\'re on fire!', '🎊 Party legend!', '🤩 Unstoppable!']
} : {
  title: '🎲 Party Game',
  subtitle: 'Обери гру та грай з друзями!',
  truth: '🎯 Правда', dare: '🔥 Дія', never: '🍺 Я ніколи не...', rather: '⚖️ Що б ти обрав?',
  random: '🎲 Випадкове питання', invite: '📢 Запросити друзів', next: '➡️ Наступне', back: '← Назад',
  share: '📢 Поділитися питанням', iDid: '🍺 Я робив!', notMe: '😇 Не я!',
  choose: 'Що б ти обрав?', mix: '🎲 Мікс',
  sessionTitle: '🏆 Твоя сесія', questions: 'питань', truths: '🎯 правд', dares: '🔥 дій',
  nevers: '🍺 ніколи', choices: '⚖️ виборів',
  shareResult: '📢 Поділитися результатом', continueGame: '🎲 Продовжити гру', toMenu: '← В меню',
  played: 'зіграв', rounds: 'раундів у Party Game!',
  confessions: 'зізнань',
  playToo: 'Грай і ти →',
  funTitles: ['🎉 Вечірка в розпалі!', '🔥 Ти вогонь!', '🎊 Легенда вечірки!', '🤩 Нестримний/нестримна!']
};

let currentMode = null;
let questionCount = 0;
let currentQuestion = null;
let usedIndices = {};
let sessionStats = { total: 0, truth: 0, dare: 0, never: 0, rather: 0, drinks: 0, clean: 0 };
const SUMMARY_INTERVAL = 10;

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
    truth: i18n.truth,
    dare: i18n.dare,
    never: i18n.never,
    rather: i18n.rather,
    random: i18n.mix
  };
  document.getElementById('game-title').textContent = titles[currentMode] || i18n.mix;
}

function nextQuestion() {
  // Show summary every N questions
  if (questionCount > 0 && questionCount % SUMMARY_INTERVAL === 0) {
    showSummary();
    return;
  }

  questionCount++;
  sessionStats.total++;
  document.getElementById('counter').textContent = '#' + questionCount;

  let mode = currentMode;
  if (mode === 'random') {
    mode = ['truth', 'dare', 'never', 'rather'][Math.floor(Math.random() * 4)];
  }
  // Track per-category
  if (sessionStats[mode] !== undefined) sessionStats[mode]++;

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
    document.getElementById('question-text').textContent = i18n.choose;
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
    sessionStats.drinks++;
    const msg = isEn ? '🍺 You did it!' : '🍺 Ти робив це!';
    tg?.showAlert?.(msg) || alert(msg);
  } else {
    sessionStats.clean++;
    const msg = isEn ? '😇 Clean!' : '😇 Чистий/чиста!';
    tg?.showAlert?.(msg) || alert(msg);
  }
}

function showSummary() {
  document.getElementById('stat-total').textContent = sessionStats.total;
  document.getElementById('stat-truths').textContent = sessionStats.truth;
  document.getElementById('stat-dares').textContent = sessionStats.dare;
  document.getElementById('stat-nevers').textContent = sessionStats.never;
  document.getElementById('stat-rathers').textContent = sessionStats.rather;

  // Fun title based on stats
  const titleIdx = Math.min(Math.floor(sessionStats.total / SUMMARY_INTERVAL) - 1, i18n.funTitles.length - 1);
  document.getElementById('summary-title').textContent = i18n.funTitles[titleIdx];

  showScreen('summary');
  if (tg) tg.HapticFeedback?.notificationOccurred('success');
}

function continueGame() {
  showScreen('game');
  nextQuestion();
}

function shareResults() {
  const userId = tg?.initDataUnsafe?.user?.id || '';
  const name = tg?.initDataUnsafe?.user?.first_name || 'Хтось';
  const refLink = `https://t.me/charlie_party_bot/partygame`;

  let text = `🎲 ${name} ${i18n.played} ${sessionStats.total} ${i18n.rounds}\n`;
  if (sessionStats.truth) text += `🎯 ${sessionStats.truth} ${isEn ? 'truths' : 'правд'}\n`;
  if (sessionStats.dare) text += `🔥 ${sessionStats.dare} ${isEn ? 'dares' : 'дій'}\n`;
  if (sessionStats.never) text += `🍺 ${sessionStats.never} "${isEn ? 'never' : 'ніколи'}" (${i18n.confessions}: ${sessionStats.drinks})\n`;
  if (sessionStats.rather) text += `⚖️ ${sessionStats.rather} ${isEn ? 'tough choices' : 'складних виборів'}\n`;
  text += `\n${i18n.playToo} ${refLink}`;

  const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

function shareBot() {
  const userId = tg?.initDataUnsafe?.user?.id || '';
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
  const text = isEn ? '🎲 Play Truth or Dare with friends!' : '🎲 Грай у Правду чи Дію з друзями!';

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
  text += isEn ? `\n\n🎲 Play → @${BOT_USERNAME}` : `\n\n🎲 Грати → @${BOT_USERNAME}`;

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
