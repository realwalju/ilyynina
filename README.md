# ilyynina

A static creator-site prototype with two browser games. Serve the repository root with a static HTTP server that serves `.mjs` as JavaScript. For example, run `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/play.html` for Raid Relay or `/patch-bay.html` for Patch Bay.

## Updating the site

- Edit `js/config.js` for profile details, social and partner links, emotes, gear, clips and archived broadcasts. The stream list and follower fallback are snapshots. Update their dates and copy when refreshing them.
- Page sections live in the corresponding HTML file. Shared navigation and content renderers live in `js/site.js`. The home and watch pages load `js/live.mjs` for live status. Set `live.status` in the config to `true`, `false` or `'auto'` to preview each mode.
- Raid Relay’s rails, bumpers, jackpot gate and flipper pivots are defined in `js/game/table.mjs`. Both the renderer and collision code read the same coordinates. The illustration under the hardware is `assets/game/raid-relay.webp`.
- `js/game/pinball.mjs` advances the ball and moving flippers at 240 fixed steps per second and owns the three-ball rules. `playfield.mjs` caches the printed table and draws the live pieces. `play.mjs` handles input, optional synthesized audio, pause and device-local records.
- Patch Bay panels are defined in `js/game/patch-bay.mjs`. Each panel specifies dimensions, an intended path from the left edge to the right edge, and clockwise starting rotations. Signal tracing accepts any connected route. `patch-controls.mjs` handles keyboard and touch interaction.

## Verification

Run `node --test` with Node 22 or later. The game tests cover the launch orbit, flippers, pause, ball saves, drains, jackpot qualification and a complete raid shot starting from an ordinary serve. Twitch response parsing has its own tests.
