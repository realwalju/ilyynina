'use strict';
const {randomBytes} = require('node:crypto');
const a = require('./_lib/arcade');
const rankings = require('./_lib/rankings');
const methods = { board:'GET', login:'GET', logout:'POST', start:'POST', finish:'POST' };

module.exports = a.handler(async (req,res) => {
  const action = req.query.action || 'board';
  if (!Object.hasOwn(methods,action)) throw new a.HttpError(404,'not_found');
  if (req.method !== methods[action]) throw new a.HttpError(405,'method_not_allowed');
  if (action === 'login') {
    if (!a.loginAvailable()) return a.redirect(res,'/patch-bay.html?signin=unavailable#leaderboard');
    if (req.headers.host !== new URL(a.origin()).host) return a.redirect(res,a.origin()+'/api/arcade?action=login');
    const {id} = a.credentials();
    const state = randomBytes(24).toString('hex');
    a.setCookie(res,'nina_oauth',a.signed('nina-oauth',state,600000),600);
    const params = new URLSearchParams({client_id:id,redirect_uri:a.origin()+'/api/auth/callback',
      response_type:'code',scope:'',state});
    return a.redirect(res,'https://id.twitch.tv/oauth2/authorize?'+params);
  }
  if (action === 'logout') {
    a.setCookie(res,'nina_session','',0);
    return a.json(res,200,{ok:true});
  }
  const user = a.session(req);
  const day = a.today();
  if (action === 'board') {
    let standings;
    try { standings = await rankings.board(user,day,req.query.period); }
    catch { standings = {rows:[],mine:null,unavailable:true}; }
    return a.json(res,200,{...standings,day,user:user || null,loginAvailable:a.loginAvailable()});
  }
  if (!user) throw new a.HttpError(401,'sign_in_required');
  if (action === 'start') {
    return a.json(res,200,{day,player:user.id,ticket:a.signed('patch-v1',{day,player:user.id},2*3600000)});
  }
  const {ticket,history} = req.body || {};
  const run = a.verify('patch-v1',ticket);
  if (!run || run.player !== user.id) throw new a.HttpError(403,'expired_run');
  const {replayScore} = await import('../js/game/patch-score.mjs');
  const score = replayScore(run.day,history);
  if (score === null) throw new a.HttpError(400,'invalid_run');
  const result = await rankings.record(user,run.day,score);
  a.json(res,200,{...result,score,day:run.day});
});
