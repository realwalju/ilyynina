# ilyynina

A static creator-site prototype with a browser game. Serve the repository root with a static HTTP server that serves `.mjs` as JavaScript. For example, run `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/play.html`.

## Updating the site

- Edit `js/config.js` for profile details, social and partner links, emotes, gear, clips and archived broadcasts. The stream list and follower fallback are snapshots. Update their dates and copy when refreshing them.
- Page sections live in the corresponding HTML file. Shared navigation and content renderers live in `js/site.js`. The home and watch pages load `js/live.mjs` for live status. Set `live.status` in the config to `true`, `false` or `'auto'` to preview each mode.
- Tune course length, lives, gate spacing and scoring in `js/game/run.mjs`. Keep the instructions in `play.html` in sync. The mountain renderer also draws the homepage preview. Browser input, pause handling and device-local records live in `js/game/play.mjs`.

## Verification

Run `node --test` with Node 22 or later. The tests cover lane bounds, collision and finish rules, scoring, pause behavior and Twitch response parsing.
