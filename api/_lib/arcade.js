'use strict';
const crypto = require('node:crypto');

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function origin() {
  const site = process.env.ARCADE_ORIGIN || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (!site) throw new HttpError(503, 'not_configured');
  return new URL(site).origin;
}
function secret() {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32) throw new HttpError(503, 'not_configured');
  return key;
}
function signed(type, data, lifetime) {
  const body = Buffer.from(JSON.stringify({type, data, expires: Date.now()+lifetime})).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}
function verify(type, token) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256',secret()).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(expected,actual)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[0],'base64url'));
    return p.type === type && p.expires > Date.now() ? p.data : null;
  } catch { return null; }
}
function cookie(req, name) {
  const field = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name+'='));
  return field && field.slice(name.length+1);
}
function setCookie(res, name, value, age) {
  const flags = '; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+(origin().startsWith('https:') ? '; Secure' : '');
  res.setHeader('Set-Cookie', [].concat(res.getHeader('Set-Cookie') || [], name+'='+value+flags));
}
const session = req => verify('nina-session',cookie(req,'nina_session'));
const today = () => new Date().toISOString().slice(0,10);
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
function redirect(res, url) { res.statusCode = 302; res.setHeader('Location',url); res.end(); }
function handler(fn) {
  return async (req,res) => {
    res.setHeader('Cache-Control','private, no-store');
    try {
      if (req.method === 'POST' && req.headers.origin !== origin()) throw new HttpError(403,'bad_origin');
      await fn(req,res);
    } catch (err) {
      json(res, err.status || 503, {error: err instanceof HttpError ? err.message : 'temporarily_unavailable'});
    }
  };
}
function credentials() {
  const id = process.env.TWITCH_CLIENT_ID, password = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !password) throw new HttpError(503,'not_configured');
  return {id,password};
}
function loginAvailable() {
  try { credentials(); origin(); secret(); return true; }
  catch { return false; }
}
async function redis(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new HttpError(503,'not_configured');
  const response = await fetch(url, {method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(command), signal:AbortSignal.timeout(7000)});
  if (!response.ok) throw new HttpError(503,'storage_unavailable');
  const data = await response.json();
  if (data.error) throw new HttpError(503,'storage_unavailable');
  return data.result;
}
module.exports = {HttpError,origin,signed,verify,cookie,setCookie,session,today,json,redirect,handler,credentials,loginAvailable,redis};
