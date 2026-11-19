import { arcadeLeaderboard } from './arcade-ranks.mjs';
import { CIRCUIT_VERSION, rankTarget } from './patch-score.mjs';

export function leaderboard(onStart, onDailyPractice) {
  const byId = id => document.getElementById(id);
  let boardDay, boardVersion;
  const ranks = arcadeLeaderboard({
    game: 'patch', version: CIRCUIT_VERSION, title: 'Patch Bay', onStart,
    onBoard(data) {
      boardDay = data.day;
      boardVersion = data.circuitVersion ?? (data.unavailable ? undefined : 1);
    },
    onControls({busy, playing, canStart}) {
      byId('daily-practice').disabled = busy || playing;
      byId('replay-ranked').disabled = !canStart;
      byId('replay-practice').disabled = busy;
    },
    resultText(result, history) {
      const place = result.rank ? ' · #' + result.rank : '';
      return {
        summary: result.score.toLocaleString() + ' verified points. Daily best ' + result.best.toLocaleString() +
          place + '. All-time gain +' + result.added.toLocaleString() + '.',
        target: result.today && result.day !== result.today ? 'A new daily circuit is open.'
          : rankTarget(result, history.map(panel => panel.length))
      };
    }
  });
  byId('replay-ranked').addEventListener('click', ranks.startRanked);
  byId('daily-practice').addEventListener('click', () => {
    const day = new Date().toISOString().slice(0,10);
    const version = day === boardDay ? boardVersion : undefined;
    if (version > CIRCUIT_VERSION) {
      byId('submission').textContent = 'Reload Patch Bay to play today’s updated circuit.';
      return;
    }
    onDailyPractice(day, version);
  });
  return ranks;
}
