import assert from 'node:assert/strict';
import test from 'node:test';
import { followerCount, uptimeState } from '../js/twitch.mjs';

test('only a duration confirms that the stream is live', () => {
  for (const input of ['1 hour, 2 minutes', ' 1 day, 3 hours and 4 seconds ', '1 second']) {
    assert.equal(uptimeState(input), 'live');
  }
  for (const input of ['offline', 'ilyynina is offline.']) assert.equal(uptimeState(input), 'offline');
  for (const input of ['', '503 Service Unavailable', 'Error: offline lookup failed', 'Invalid user']) {
    assert.equal(uptimeState(input), 'unknown');
  }
});

test('follower errors containing numbers never replace the saved count', () => {
  assert.equal(followerCount('32,133'), 32133);
  assert.equal(followerCount(' 0 '), 0);
  for (const input of ['retry in 60s', '32,13', '-1', '', '1234567890123456789']) {
    assert.equal(followerCount(input), null);
  }
});
