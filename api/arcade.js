'use strict';
const {randomBytes} = require('node:crypto');
const a = require('./_lib/arcade');
const rankings = require('./_lib/rankings');
const methods = { board:'GET', login:'GET', logout:'POST', start:'POST', finish:'POST' };

module.exports = a.handler(async (req,res) => {
  const action = req.query.action || 'board';
  const game = req.query.game ?? 'patch';
  if (game !== 'raid' && game !== 'patch') throw new a.HttpError(404,'unknown_game');
  const raid = game === 'raid';
  if (!Object.hasOwn(methods,action)) throw new a.HttpError(404,'not_found');
  if (req.method !== methods[action]) throw new a.HttpError(405,'method_not_allowed');
  if (action === 'login') {
    const page = raid ? '/raid-relay.html' : '/patch-bay.html';
    if (!a.loginAvailable()) return a.redirect(res,page+'?signin=unavailable#leaderboard');
    if (req.headers.host !== new URL(a.origin()).host) return a.redirect(res,a.origin()+'/api/arcade?action=login'+(raid ? '&game=raid' : ''));
    const {id} = a.credentials();
    const state = (raid ? 'raid.' : '') + randomBytes(24).toString('hex');
    a.setCookie(res,'nina_oauth',a.signed('nina-oauth',state,600000),600);
    const params = new URLSearchParams({client_id:id,redirect_uri:a.origin()+'/api/auth/callback',
      response_type:'code',scope:'',state});
    return a.redirect(res,'https://id.twitch.tv/oauth2/authorize?'+params);
  }
  if (action === 'logout') {
    await a.logout(req,res);
    return a.json(res,200,{ok:true});
  }
  const user = await a.session(req);
  const day = a.today();
  if (action === 'board') {
    let standings;
    try {
      if (raid) standings = await rankings.raidBoard(user,day,req.query.period);
      else {
        const {CIRCUIT_VERSION} = await import('../js/game/patch-score.mjs');
        standings = await rankings.board(user,day,req.query.period,CIRCUIT_VERSION);
      }
    }
    catch { standings = {rows:[],mine:null,unavailable:true}; }
    return a.json(res,200,{...standings,day,user:user || null,loginAvailable:a.loginAvailable()});
  }
  if (!user) throw new a.HttpError(401,'sign_in_required');
  if (raid) return rankedPinball(req,res,user,day,action);
  const {CIRCUIT_VERSION,replayScore} = await import('../js/game/patch-score.mjs');
  if (action === 'start') {
    const version = await rankings.circuitVersion(day,CIRCUIT_VERSION);
    if (version > (req.body?.maxVersion ?? 1) || version > CIRCUIT_VERSION) throw new a.HttpError(409,'update_required');
    const run = {day,player:user.id,version};
    return a.json(res,200,{...run,ticket:a.signed('patch-v1',run,2*3600000)});
  }
  const {ticket,history} = req.body || {};
  const run = a.verify('patch-v1',ticket);
  if (!run || run.player !== user.id) throw new a.HttpError(403,'expired_run');
  const score = replayScore(run.day,history,run.version ?? 1);
  if (score === null) throw new a.HttpError(400,'invalid_run');
  const result = await rankings.record(user,run.day,score);
  a.json(res,200,{...result,score,day:run.day,today:day});
});

async function rankedPinball(req,res,user,day,action) {
  const {RAID_VERSION,replayRaidScore} = await import('../js/game/raid-score.mjs');
  if (action === 'start') {
    const maxVersion = req.body?.maxVersion ?? 1;
    if (!Number.isInteger(maxVersion) || maxVersion < RAID_VERSION) throw new a.HttpError(409,'update_required');
    const run = {day,player:user.id,version:RAID_VERSION};
    return a.json(res,200,{...run,ticket:a.signed('raid-v1',run,2*3600000)});
  }
  const {ticket,history} = req.body || {};
  const run = a.verify('raid-v1',ticket);
  if (!run || run.player !== user.id) throw new a.HttpError(403,'expired_run');
  const score = replayRaidScore(history,run.version);
  if (score === null) throw new a.HttpError(400,'invalid_run');
  const result = await rankings.recordRaid(user,run.day,score);
  return a.json(res,200,{...result,score,day:run.day,today:day});
}
