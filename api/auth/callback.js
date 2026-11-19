'use strict';
const a = require('../_lib/arcade');
module.exports = a.handler(async (req,res) => {
  if (req.method !== 'GET') throw new a.HttpError(405,'method_not_allowed');
  const state = a.verify('nina-oauth',a.cookie(req,'nina_oauth'));
  const returnState = state || req.query.state;
  const back = typeof returnState === 'string' && returnState.startsWith('raid.') ? '/raid-relay.html' : '/patch-bay.html';
  a.setCookie(res,'nina_oauth','',0);
  if (!state || state !== req.query.state) return a.redirect(res,back+'?signin=expired#leaderboard');
  if (req.query.error || !req.query.code) return a.redirect(res,back+'?signin=cancelled#leaderboard');
  const {id,password} = a.credentials();
  let token;
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',
      body:new URLSearchParams({client_id:id,client_secret:password,code:req.query.code,
        grant_type:'authorization_code',redirect_uri:a.origin()+'/api/auth/callback'}),signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw Error();
    token = (await response.json()).access_token;
    const profile = await fetch('https://api.twitch.tv/helix/users',{headers:{Authorization:'Bearer '+token,'Client-Id':id},signal:AbortSignal.timeout(8000)});
    if (!profile.ok) throw Error();
    const user = (await profile.json()).data[0];
    if (!user || !/^\d+$/.test(user.id) || !/^\w+$/.test(user.login)) throw Error();
    await a.createSession(res, {id:user.id,login:user.login,name:user.display_name || user.login});
  } catch { return a.redirect(res,back+'?signin=failed#leaderboard'); }
  finally {
    if (token) await fetch('https://id.twitch.tv/oauth2/revoke',{method:'POST',
      body:new URLSearchParams({client_id:id,token}),signal:AbortSignal.timeout(3000)}).catch(()=>{});
  }
  a.redirect(res,back+'#leaderboard');
});
