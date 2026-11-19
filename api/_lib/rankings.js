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
local best = math.max(old,score)
local rank = redis.call('ZCOUNT', KEYS[1], '('..best, '+inf') + 1
local higher = redis.call('ZRANGEBYSCORE', KEYS[1], '('..best, '+inf', 'WITHSCORES', 'LIMIT', 0, 1)
if #higher == 0 then return {best,delta,rank,0,0} end
local nextRank = redis.call('ZCOUNT', KEYS[1], '('..higher[2], '+inf') + 1
return {best,delta,rank,tonumber(higher[2]),nextRank}
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
  const [best,added,rank,nextScore,nextRank] = await redis(['EVAL',UPDATE,3,daily(day),base+'total',base+'profiles',
    user.id,score,JSON.stringify({login:user.login,name:user.name})]);
  return {best,added,rank,nextPlace:nextRank ? {rank:nextRank,score:nextScore} : null};
}
async function board(user,day,period) {
  const [rows,points,rank] = await redis(['EVAL',READ,2,period==='total' ? base+'total' : daily(day),
    base+'profiles',user?.id || '']);
  return {rows:rows.map(([profile,score,place]) => ({...JSON.parse(profile),score:Number(score),rank:place})),
    mine:rank ? {rank,score:Number(points)} : null};
}
module.exports = {record,board};
