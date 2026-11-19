const byId = id => document.getElementById(id);
const formatPoints = value => Number(value).toLocaleString();
const storageKey = 'ilyynina.patch.pending.v1';

async function api(action, data, period) {
  const params = new URLSearchParams({action});
  if (period) params.set('period', period);
  const options = {cache: 'no-store', signal: AbortSignal.timeout(15000)};
  if (data !== undefined) {
    options.method = 'POST';
    options.headers = {'Content-Type': 'application/json'};
    options.body = JSON.stringify(data);
  }
  const response = await fetch('/api/arcade?' + params, options);
  if (!response.ok) throw Object.assign(new Error('Arcade request failed'), {status: response.status});
  return response.json();
}

function rankRow(row) {
  const item = document.createElement('li');
  const place = document.createElement('span');
  const player = document.createElement('a');
  const points = document.createElement('strong');
  place.textContent = '#' + row.rank;
  player.href = 'https://www.twitch.tv/' + encodeURIComponent(row.login);
  player.textContent = row.name;
  points.textContent = formatPoints(row.score) + ' pts';
  item.append(place, player, points);
  return item;
}

export function leaderboard(onStart) {
  let user = null;
  let busy = false;
  let playing = false;
  let available = false;
  let request = 0;
  let pending = {};
  try { pending = JSON.parse(sessionStorage.getItem(storageKey)) || {}; }
  catch { /* Storage is optional. */ }

  function remember(player, run) {
    if (run) pending[player] = run;
    else delete pending[player];
    try { sessionStorage.setItem(storageKey, JSON.stringify(pending)); }
    catch { /* The in-memory submission can still be retried. */ }
  }

  function controls() {
    const hasSubmission = Boolean(user && pending[user.id]);
    byId('rank-start').hidden = !user || playing;
    byId('rank-start').disabled = busy || hasSubmission || !available;
    byId('signout').hidden = !user;
    byId('signout').disabled = playing || busy;
    byId('retry-score').hidden = !hasSubmission;
    byId('retry-score').disabled = busy;
  }

  async function refresh() {
    const sequence = ++request;
    const period = byId('period').value;
    try {
      const data = await api('board', undefined, period);
      if (sequence !== request) return;
      user = data.user;
      available = !data.unavailable;
      byId('signin').hidden = Boolean(user) || !data.loginAvailable;
      byId('account').textContent = user ? 'Signed in as ' + user.name
        : data.loginAvailable ? 'Sign in to play a ranked daily circuit.' : 'Twitch sign-in is unavailable.';
      byId('rank-rows').replaceChildren(...data.rows.map(rankRow));
      byId('my-rank').textContent = data.mine
        ? 'Your rank is #' + data.mine.rank + ' with ' + formatPoints(data.mine.score) + ' points.' : '';
      if (!available) byId('board-status').textContent = 'Standings are unavailable. You can keep practicing.';
      else if (!data.rows.length) byId('board-status').textContent = 'No scores yet for this board.';
      else byId('board-status').textContent = period === 'day' ? data.day + ' · Top players' : 'All-time top players';
    } catch {
      if (sequence !== request) return;
      available = false;
      byId('board-status').textContent = 'Online rankings are unavailable. You can keep practicing.';
      byId('rank-rows').replaceChildren();
      byId('my-rank').textContent = '';
    }
    controls();
  }

  async function submit() {
    const player = user?.id;
    const run = pending[player];
    if (!run || busy) return;
    busy = true;
    controls();
    byId('submission').textContent = 'Verifying your circuit…';
    try {
      const result = await api('finish', run);
      remember(player, null);
      byId('submission').textContent = formatPoints(result.score) + ' verified points. Daily best '
        + formatPoints(result.best) + '. All-time gain +' + formatPoints(result.added) + '.';
    } catch (err) {
      if (err.status === 403 || err.status === 400) {
        remember(player, null);
        byId('submission').textContent = 'This run could not be ranked. Start a fresh daily circuit.';
      } else {
        byId('submission').textContent = 'Your run is saved in this tab. Retry submission while signed in with the same account.';
      }
    } finally {
      busy = false;
      controls();
      await refresh();
    }
  }

  byId('rank-start').addEventListener('click', async () => {
    if (busy || playing) return;
    busy = true;
    controls();
    try {
      const run = await api('start', {});
      playing = true;
      byId('submission').textContent = '';
      onStart(run);
    } catch {
      byId('submission').textContent = 'Could not start the daily circuit. Refresh standings and try again.';
    } finally { busy = false; controls(); }
  });

  byId('signout').addEventListener('click', async () => {
    busy = true;
    controls();
    try { await api('logout', {}); user = null; await refresh(); }
    catch { byId('account').textContent = 'Could not sign out. Try again.'; }
    finally { busy = false; controls(); }
  });
  byId('retry-score').addEventListener('click', submit);
  byId('refresh-board').addEventListener('click', refresh);
  byId('period').addEventListener('change', refresh);
  const outcome = new URLSearchParams(location.search).get('signin');
  if (outcome) byId('submission').textContent = outcome === 'cancelled'
    ? 'Twitch sign-in cancelled.' : 'Twitch sign-in did not complete. Try again.';
  refresh();

  return {
    finish(run, history) {
      remember(run.player, {ticket: run.ticket, history});
      playing = false;
      controls();
      submit();
    },
    abandon() { playing = false; controls(); }
  };
}
