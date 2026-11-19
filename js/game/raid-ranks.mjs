import { arcadeLeaderboard } from './arcade-ranks.mjs';
import { RAID_VERSION } from './raid-score.mjs';

export function raidLeaderboard(onStart) {
  return arcadeLeaderboard({
    game: 'raid', version: RAID_VERSION, title: 'Raid Relay', onStart,
    resultText({score, best, allTimeBest, rank, day, today}) {
      const period = day === today ? 'Today' : day;
      return {
        summary: score.toLocaleString() + ' verified points.',
        target: period + ' · #' + rank + ' with ' + best.toLocaleString() +
          ' points. All-time best ' + allTimeBest.toLocaleString() + '.'
      };
    }
  });
}
