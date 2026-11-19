import assert from 'node:assert/strict';
import test from 'node:test';
import arcade from '../api/arcade.js';
import callback from '../api/auth/callback.js';
import auth from '../api/_lib/arcade.js';

const origin = 'https://arcade.example';
const player = {id:'123',login:'pinballer',name:'Pinballer'};

async function call(action, {method='GET',game='raid',cookie='',params={},body}={}) {
  const headers = {};
  const res = {
    setHeader(name,value) { headers[name] = value; },
    getHeader(name) { return headers[name]; },
    end(data) { this.body = data && JSON.parse(data); }
  };
  const handler = action === 'callback' ? callback : arcade;
  await handler({method,headers:{origin,host:'arcade.example',cookie},query:{action,game,...params},body},res);
  return {status:res.statusCode,headers,body:res.body};
}

test('Raid Relay uses the shared Twitch login and records only completed pinball games in its own standings', async t => {
  const env = {ARCADE_ORIGIN:origin, SESSION_SECRET:'test-only-'.repeat(4), TWITCH_CLIENT_ID:'unit-client',
    TWITCH_CLIENT_SECRET:'unit-secret', KV_REST_API_URL:'https://redis.example', KV_REST_API_TOKEN:'unit-token'};
  for (const [key,value] of Object.entries(env)) {
    const original = process.env[key];
    process.env[key] = value;
    t.after(() => { if (original === undefined) delete process.env[key]; else process.env[key] = original; });
  }
  const reads = [], writes = [];
  t.mock.method(globalThis, 'fetch', async (url,options) => {
    if (url === 'https://id.twitch.tv/oauth2/token') return Response.json({access_token:'unit-token'});
    if (url === 'https://api.twitch.tv/helix/users') return Response.json({data:[{...player,display_name:player.name}]});
    if (url === 'https://id.twitch.tv/oauth2/revoke') return Response.json({});
    assert.equal(url,env.KV_REST_API_URL);
    const cmd = JSON.parse(options.body);
    if (cmd[0] === 'SET') return Response.json({result:'OK'});
    if (cmd[0] === 'GET') return Response.json({result:JSON.stringify(player)});
    if (cmd[2] === 2) {
      reads.push(cmd[3]);
      return Response.json({result:[[[JSON.stringify({login:player.login,name:player.name}),'900',1]],'0',0]});
    }
    writes.push(cmd);
    return Response.json({result:['600','900',2]});
  });

  const login = await call('login');
  const state = new URL(login.headers.Location).searchParams.get('state');
  const stateCookie = login.headers['Set-Cookie'][0].split(';')[0];
  const expired = await call('callback',{params:{state}});
  assert.equal(expired.headers.Location,'/raid-relay.html?signin=expired#leaderboard');
  const success = await call('callback',{cookie:stateCookie,params:{state,code:'unit-code'}});
  assert.equal(success.headers.Location,'/raid-relay.html#leaderboard');
  const cookie = success.headers['Set-Cookie'].find(line=>line.startsWith('nina_session=')).split(';')[0];

  const board = await call('board');
  assert.equal(board.body.rows[0].score,900);
  assert.equal(board.body.rows[0].name,player.name);
  await call('board',{params:{period:'total'}});
  assert.deepEqual(reads,['ilyynina:{raid-v1}:day:'+board.body.day,'ilyynina:{raid-v1}:best']);
  assert.equal((await call('start',{method:'POST'})).status,401);
  assert.equal((await call('start',{method:'POST',cookie,body:{maxVersion:0}})).status,409);
  const {body:run} = await call('start',{method:'POST',cookie,body:{maxVersion:1}});
  assert.deepEqual(auth.verify('raid-v1',run.ticket),{day:run.day,player:player.id,version:1});
  const finish = (body,game='raid') => call('finish',{method:'POST',game,cookie,body});
  assert.equal((await finish({ticket:run.ticket,history:[4],score:99999})).status,400);
  const foreignPlayer = auth.signed('raid-v1',{day:run.day,version:1,player:'456'},10000);
  assert.equal((await finish({ticket:foreignPlayer,history:[31340]})).status,403);
  assert.equal((await finish({ticket:auth.signed('patch-v1',run,10000),history:[31340]})).status,403);
  assert.equal((await finish({ticket:run.ticket,history:[31340]},'patch')).status,403);
  assert.equal(writes.length,0);

  // Three v1 balls draining without flips, including the automatic ball saves.
  const result = await finish({ticket:run.ticket,history:[31340],score:99999});
  assert.equal(result.status,200);
  assert.deepEqual(result.body,{score:600,best:600,allTimeBest:900,rank:2,day:run.day,today:run.day});
  assert.deepEqual(writes[0].slice(3,8),
    ['ilyynina:{raid-v1}:day:'+run.day,'ilyynina:{raid-v1}:best','ilyynina:{raid-v1}:profiles',player.id,600]);
});
