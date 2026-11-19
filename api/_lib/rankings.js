'use strict';
const {redis} = require('./arcade');
const base = 'ilyynina:{patch-v1}:';
const daily = day => base+'day:'+day;
const versionKeys = day => [base+'library-first-day', base+'circuit:'+day];

// Pre-library starts left no Redis record. Preserve the original layout for
// that transition date, including anyone still holding an unversioned ticket.
// Subsequently, whichever release opens a date first pins its rules for everyone.
const PIN = `
local function pin(firstKey, dayKey, day, latest)
  local saved = redis.call('GET', dayKey)
  if saved then return tonumber(saved) end
  redis.call('SET', firstKey, day, 'NX')
  local firstDay = redis.call('GET', firstKey)
  local version = day <= firstDay and 1 or tonumber(latest)
  redis.call('SET', dayKey, version, 'EX', 3024000)
  return version
end
`;
async function circuitVersion(day, latest) {
  return redis(['EVAL',PIN + 'return pin(KEYS[1], KEYS[2], ARGV[1], ARGV[2])',2,...versionKeys(day),day,latest]);
}

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
const READ_STANDINGS = `
local scores = redis.call('ZREVRANGE', KEYS[1], 0, 9, 'WITHSCORES')
local rows = {}
for i=1,#scores,2 do
  local profile = redis.call('HGET', KEYS[2], scores[i])
  local rank = redis.call('ZCOUNT', KEYS[1], '('..scores[i+1], '+inf') + 1
  table.insert(rows, {profile, scores[i+1], rank})
end
local own = redis.call('ZSCORE', KEYS[1], ARGV[1])
local rank = own and redis.call('ZCOUNT', KEYS[1], '('..own, '+inf') + 1 or 0
`;
const READ = PIN + READ_STANDINGS + "return {rows,own or '0',rank,pin(KEYS[3], KEYS[4], ARGV[2], ARGV[3])}";
async function record(user,day,score) {
  const [best,added,rank,nextScore,nextRank] = await redis(['EVAL',UPDATE,3,daily(day),base+'total',base+'profiles',
    user.id,score,JSON.stringify({login:user.login,name:user.name})]);
  return {best,added,rank,nextPlace:nextRank ? {rank:nextRank,score:nextScore} : null};
}
async function board(user,day,period,latest) {
  const [rows,points,rank,circuitVersion] = await redis(['EVAL',READ,4,period==='total' ? base+'total' : daily(day),
    base+'profiles',...versionKeys(day),user?.id || '',day,latest]);
  return {...standings(rows,points,rank),circuitVersion};
}
function standings(rows,points,rank) {
  return {rows:rows.map(([profile,score,place]) => ({...JSON.parse(profile),score:Number(score),rank:place})),
    mine:rank ? {rank,score:Number(points)} : null};
}

const raidBase = 'ilyynina:{raid-v1}:';
const RAID_READ = READ_STANDINGS + "return {rows,own or '0',rank}";
const RAID_UPDATE = `
redis.call('ZADD', KEYS[1], 'GT', ARGV[2], ARGV[1])
redis.call('ZADD', KEYS[2], 'GT', ARGV[2], ARGV[1])
redis.call('HSET', KEYS[3], ARGV[1], ARGV[3])
redis.call('EXPIRE', KEYS[1], 3024000)
local best = redis.call('ZSCORE', KEYS[1], ARGV[1])
local rank = redis.call('ZCOUNT', KEYS[1], '('..best, '+inf') + 1
return {best,redis.call('ZSCORE', KEYS[2], ARGV[1]),rank}
`;
async function raidBoard(user,day,period) {
  const key = period === 'total' ? raidBase+'best' : raidBase+'day:'+day;
  const result = await redis(['EVAL',RAID_READ,2,key,raidBase+'profiles',user?.id || '']);
  return standings(...result);
}
async function recordRaid(user,day,score) {
  const [dailyBest,allTimeBest,rank] = await redis(['EVAL',RAID_UPDATE,3,
    raidBase+'day:'+day,raidBase+'best',raidBase+'profiles',user.id,score,
    JSON.stringify({login:user.login,name:user.name})]);
  return {best:Number(dailyBest),allTimeBest:Number(allTimeBest),rank};
}
module.exports = {record,board,circuitVersion,raidBoard,recordRaid};
