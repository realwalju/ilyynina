import { channelInfo, followerCount, uptimeState } from './twitch.mjs';

const { twitchHandle, goal, live } = window.SITE;
const info = field => channelInfo(twitchHandle, field);
const goalPanel = document.querySelector('[data-goal]');
if (goalPanel) {
  function paint(count) {
    const track = goalPanel.querySelector('.goal-track');
    const value = Math.min(count, goal.target);
    goalPanel.querySelector('[data-goal-label]').textContent = goal.label;
    goalPanel.querySelector('[data-goal-count]').textContent =
      count.toLocaleString('en-US') + ' / ' + goal.target.toLocaleString('en-US');
    goalPanel.querySelector('[data-goal-bar]').style.width = (100 * value / goal.target) + '%';
    track.setAttribute('aria-valuemax', goal.target);
    track.setAttribute('aria-valuenow', value);
  }
  paint(goal.saved);
  info('followcount').then(text => {
    const count = followerCount(text);
    if (count !== null) paint(count);
  }).catch(() => { /* Keep the configured snapshot when Twitch is unavailable. */ });
}

const card = document.querySelector('[data-live-card]');
const screen = card.querySelector('[data-live-screen]');
const message = screen.firstElementChild;
const eyebrow = document.querySelector('[data-live-eyebrow]');
const meta = card.querySelector('[data-live-meta]');
function render(state, details = '') {
  const isLive = state === 'live';
  card.dataset.state = state;
  card.querySelector('[data-live-pill]').textContent =
    ({ live: 'Live', offline: 'Offline', unknown: 'Status unknown' })[state];
  if (eyebrow) {
    eyebrow.classList.toggle('is-live', isLive);
    eyebrow.querySelector('[data-live-eyebrow-text]').textContent = isLive ? 'Live now on Twitch' : 'XSET Fortnite';
  }
  meta.hidden = !isLive || !details;
  meta.textContent = details;
  if (isLive) {
    if (screen.firstElementChild !== message) return;
    const frame = document.createElement('iframe');
    const params = new URLSearchParams({ channel: twitchHandle, parent: location.hostname || 'localhost', muted: 'true' });
    frame.src = 'https://player.twitch.tv/?' + params;
    frame.title = twitchHandle + ' live on Twitch';
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    screen.replaceChildren(frame);
  } else {
    message.querySelector('[data-live-title]').textContent = live[state + 'Title'];
    message.querySelector('[data-live-note]').textContent = live[state + 'Note'];
    if (screen.firstElementChild !== message) screen.replaceChildren(message);
  }
}

async function refresh() {
  try {
    const state = uptimeState(await info('uptime'));
    render(state);
    if (state === 'live') {
      const results = await Promise.allSettled([info('game'), info('title')]);
      render(state, results.filter(r => r.status === 'fulfilled').map(r => r.value).filter(Boolean).join(' · '));
    }
  } catch { render('unknown'); }
  setTimeout(refresh, 90000);
}
if (live.status === 'auto') refresh();
else render(live.status === true ? 'live' : 'offline');
