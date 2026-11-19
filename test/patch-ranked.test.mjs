import test from 'node:test';
import assert from 'node:assert/strict';
import arcade from '../api/arcade.js';
import callback from '../api/auth/callback.js';
import auth from '../api/_lib/arcade.js';
import { dailyPanels, MAX_ACTIONS, panelPoints, rankTarget, replayScore } from '../js/game/patch-score.mjs';
import { rotate, trace, wiring } from '../js/game/patch-bay.mjs';

function solution(panel) {
  const sockets = wiring(panel);
  const moves = [];
  for (const cell of panel.route) {
    for (let i = 0; i < (4 - panel.turns[cell]) % 4; i++) {
      if (trace(panel, sockets).live) return moves;
      rotate(sockets, cell);
      moves.push(cell);
    }
  }
  assert.ok(trace(panel, sockets).live);
  return moves;
}

test('daily circuits are stable, start disconnected and award efficiency per panel', () => {
  const day = '2026-11-18';
  const panels = dailyPanels(day);
  assert.deepEqual(panels, dailyPanels(day));
  assert.notDeepEqual(panels, dailyPanels('2026-11-19'));
  for (const panel of panels) assert.equal(trace(panel, wiring(panel)).live, false);
  const moves = panels.map(solution);
  const score = replayScore(day, moves);
  assert.equal(score, 2700 - 10 * moves.flat().length);
  const reset = [[0, -1, ...moves[0]], ...moves.slice(1)];
  assert.equal(replayScore(day, reset), score - 20);
  assert.equal(panelPoints(0, 60), 200);
  for (const invalid of [null, [], moves.slice(1), [[], ...moves.slice(1)],
    [[...moves[0], 0], ...moves.slice(1)], [[99], ...moves.slice(1)],
    [Array(MAX_ACTIONS + 1).fill(-1), ...moves.slice(1)]]) {
    assert.equal(replayScore(day, invalid), null);
  }
});

test('the library serves 60 distinct solvable combinations with a connected camera input', () => {
  const sets = new Set(), byTier = [new Set(), new Set(), new Set()];
  for (let dayIndex = 0; dayIndex < 60; dayIndex++) {
    const day = new Date(Date.UTC(2026, 10, 1 + dayIndex)).toISOString().slice(0, 10);
    const panels = dailyPanels(day, 2);
    sets.add(panels.map(p => p.name).join('/'));
    panels.forEach((p, i) => {
      byTier[i].add(p.name);
      assert.equal(p.difficulty, ['Easy', 'Medium', 'Hard'][i]);
      assert.equal(new Set(p.route).size, p.route.length);
      const start = trace(p, wiring(p));
      assert.equal(start.live, false);
      if (i === 0) assert.ok(start.powered.size >= 2);
      assert.deepEqual([...trace(p, wiring(p, false)).powered], p.route);
    });
    assert.ok(replayScore(day, panels.map(solution), 2) > 0);
  }
  assert.equal(sets.size, 60);
  assert.deepEqual(byTier.map(tier => tier.size), [3, 4, 5]);
});

test('the original circuit format preserves its published layout and rejects unknown versions', () => {
  const day = '2026-11-19';
  const old = dailyPanels(day, 1);
  assert.deepEqual(old.map(p => p.turns.join('')), ['102221331', '102100112210', '2210120000230130']);
  assert.ok(replayScore(day, old.map(solution), 1) > 0);
  assert.equal(replayScore(day, old.map(solution), 99), null);
});

const site = 'https://nina.example';
test('rank targets use the last run, respect exhausted bonuses and handle first place', () => {
  const result = {score: 2000, best: 2020, nextPlace: {rank: 11, score: 2030}};
  assert.match(rankTarget(result, [9, 12, 18]), /3 turns.*tie #11/);
  assert.match(rankTarget(result, [51, 12, 18]), /30 more points.*tie #11/);
  assert.match(rankTarget({...result, score: 2020}, [9, 12, 18]), /1 turn on/);
  assert.equal(rankTarget({...result, nextPlace: null}, [9, 12, 18]), '');
});
async function invoke(handler, action, {method = 'GET', cookie = '', query = {}, body, origin = site} = {}) {
  const headers = {};
  const res = {
    setHeader(name, value) { headers[name] = value; },
    getHeader(name) { return headers[name]; },
    end(data) { this.data = data && JSON.parse(data); }
  };
  await handler({method, headers: {origin, cookie, host: 'nina.example'}, query: {action, ...query}, body}, res);
  return {status: res.statusCode, headers, data: res.data};
}

test('Twitch identity binds a verified circuit to the player who started it', async t => {
  const previous = {...process.env};
  Object.assign(process.env, {ARCADE_ORIGIN: site, SESSION_SECRET: 'unit-test-only-'.repeat(3),
    TWITCH_CLIENT_ID: 'test-app', TWITCH_CLIENT_SECRET: 'test-only',
    KV_REST_API_URL: 'https://redis.example', KV_REST_API_TOKEN: 'test-only'});
  t.after(() => {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  });
  const updates = [];
  const sessions = new Map();
  let sessionStoreAvailable = true;
  let revoked = false;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    switch (url) {
      case 'https://id.twitch.tv/oauth2/token':
        assert.equal(options.body.get('redirect_uri'), site + '/api/auth/callback');
        return Response.json({access_token: 'unit-test-token'});
      case 'https://api.twitch.tv/helix/users':
        assert.equal(options.headers.Authorization, 'Bearer unit-test-token');
        return Response.json({data: [{id: '42', login: 'viewer', display_name: 'Viewer'}]});
      case 'https://id.twitch.tv/oauth2/revoke':
        revoked = true;
        return Response.json({});
      case 'https://redis.example': {
        const command = JSON.parse(options.body);
        if (command[0] === 'SET') {
          assert.deepEqual(command.slice(3), ['EX', 30 * 86400]);
          sessions.set(command[1], command[2]);
          return Response.json({result: 'OK'});
        }
        if (command[0] === 'GET') return Response.json({result: sessions.get(command[1]) ?? null});
        if (command[0] === 'DEL') {
          if (!sessionStoreAvailable) return Response.json({}, {status: 503});
          return Response.json({result: Number(sessions.delete(command[1]))});
        }
        if (command[2] === 2) return Response.json({result: 2});
        if (command[2] === 4) return Response.json({result: [[], '0', 0, 2]});
        updates.push(command.slice(6));
        return Response.json({result: [command[7], command[7], 4, command[7] + 20, 2]});
      }
      default: throw Error('Unexpected upstream');
    }
  });

  const anonymous = await invoke(arcade, 'board');
  assert.deepEqual(anonymous.data.rows, []);
  assert.equal(anonymous.data.user, null);
  assert.equal(anonymous.data.loginAvailable, true);
  assert.equal(anonymous.data.circuitVersion, 2);
  const login = await invoke(arcade, 'login');
  const authorize = new URL(login.headers.Location);
  assert.equal(authorize.origin, 'https://id.twitch.tv');
  assert.equal(authorize.searchParams.get('scope'), '');
  const cookie = login.headers['Set-Cookie'][0].split(';')[0];
  const query = {code: 'test-code', state: authorize.searchParams.get('state')};
  const expired = await invoke(callback, '', {query});
  assert.match(expired.headers.Location, /signin=expired/);
  const signIn = await invoke(callback, '', {cookie, query});
  const sessionHeader = signIn.headers['Set-Cookie'].find(s => s.startsWith('nina_session='));
  assert.match(sessionHeader, /HttpOnly/);
  assert.match(sessionHeader, /Secure/);
  assert.equal(revoked, true);
  const state = {method: 'POST', cookie: sessionHeader.split(';')[0]};
  assert.equal(sessions.size, 1);
  assert.ok(![...sessions.keys()][0].includes(state.cookie.slice('nina_session='.length)));
  const legacy = auth.signed('nina-session', {id: '42', login: 'viewer', name: 'Viewer'}, 300000);
  assert.equal((await invoke(arcade, 'board', {cookie: 'nina_session=' + legacy})).data.user, null);
  assert.equal((await invoke(arcade, 'start', {method: 'POST'})).status, 401);
  assert.equal((await invoke(arcade, 'start', {...state, origin: 'https://another.example'})).status, 403);
  assert.equal((await invoke(arcade, 'start', state)).status, 409);
  const {ticket, day, player, version} = (await invoke(arcade, 'start', {...state, body: {maxVersion:2}})).data;
  assert.equal(player, '42');
  assert.equal(version, 2);
  assert.deepEqual(auth.verify('patch-v1', ticket), {day, player, version});
  const history = dailyPanels(day).map(solution);
  const finish = body => invoke(arcade, 'finish', {...state, body});
  assert.equal((await finish({ticket, score: 30000})).status, 400);
  assert.equal((await finish({ticket: auth.signed('patch-v1', {day, player: '13'}, 5000), history})).status, 403);
  assert.equal((await finish({ticket: auth.signed('patch-v1', {day, player}, -1), history})).status, 403);
  assert.equal(updates.length, 0);
  const result = await finish({ticket, history, score: 30000});
  assert.equal(result.data.score, replayScore(day, history));
  assert.equal(result.data.rank, 4);
  assert.deepEqual(result.data.nextPlace, {rank: 2, score: result.data.score + 20});
  assert.deepEqual(updates, [['42', result.data.score, JSON.stringify({login: 'viewer', name: 'Viewer'})]]);
  const oldHistory = dailyPanels(day, 1).map(solution);
  const oldTicket = auth.signed('patch-v1', {day, player}, 5000);
  const oldFinish = await finish({ticket:oldTicket, history:oldHistory});
  assert.equal(oldFinish.data.score, replayScore(day, oldHistory, 1));
  sessionStoreAvailable = false;
  const unavailableLogout = await invoke(arcade, 'logout', state);
  assert.equal(unavailableLogout.status, 503);
  assert.equal(unavailableLogout.headers['Set-Cookie'], undefined);
  sessionStoreAvailable = true;
  assert.match((await invoke(arcade, 'logout', state)).headers['Set-Cookie'][0], /Max-Age=0/);
  assert.equal(sessions.size, 0);
  assert.equal((await invoke(arcade, 'start', state)).status, 401);
  assert.equal((await finish({ticket, history})).status, 401);
  assert.equal((await invoke(arcade, 'board', {cookie: state.cookie})).data.user, null);
  assert.equal((await invoke(arcade, 'logout', state)).status, 200);
});
