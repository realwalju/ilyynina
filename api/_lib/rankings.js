'use strict';
const {redis} = require('./arcade');
const base = 'ilyynina:{patch-v1}:';
const daily = day => base+'day:'+day;

// Award only the improvement. Concurrent finishes, lower scores, and a
// retry after a network interruption cannot inflate either sorted set.
const UPDATE = `
local old = tonumber(redis.call('ZSCORE', KEYS[1], ARGV[1]) or 0)
local score = tonumber(ARGV[2])
local delta = math.max(0, score-old)
if delta > 0 then
  redis.call('ZADD', KEYS[1], score, ARGV[1])
  redis.call('EXPIRE', KEYS[1], 3024000)
  redis.call('ZINCRBY', KEYS[2], delta, ARGV[1])
end
redis.call('HSET', KEYS[3], ARGV[1], ARGV[3])
return {math.max(old,score),delta}
`;
const READ = `
local scores = redis.call('ZREVRANGE', KEYS[1], 0, 9, 'WITHSCORES')
local rows = {}
for i=1,#scores,2 do
  local profile = redis.call('HGET', KEYS[2], scores[i])
  local rank = redis.call('ZCOUNT', KEYS[1], '('..scores[i+1], '+inf') + 1
  table.insert(rows, {profile, scores[i+1], rank})
end
local own = redis.call('ZSCORE', KEYS[1], ARGV[1])
local rank = own and redis.call('ZCOUNT', KEYS[1], '('..own, '+inf') + 1 or 0
return {rows,own or '0',rank}
`;
async function record(user,day,score) {
  const [best,added] = await redis(['EVAL',UPDATE,3,daily(day),base+'total',base+'profiles',
    user.id,score,JSON.stringify({login:user.login,name:user.name})]);
  return {best,added};
}
async function board(user,day,period) {
  const [rows,points,rank] = await redis(['EVAL',READ,2,period==='total' ? base+'total' : daily(day),
    base+'profiles',user?.id || '']);
  return {rows:rows.map(([profile,score,place]) => ({...JSON.parse(profile),score:Number(score),rank:place})),
    mine:rank ? {rank,score:Number(points)} : null};
}
module.exports = {record,board};
