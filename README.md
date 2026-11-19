# ilyynina

A creator site with two browser games and a Twitch-linked leaderboard for Patch Bay. Run `node scripts/dev.mjs` and open [Patch Bay](http://localhost:4175/patch-bay.html) or [Raid Relay](http://localhost:4175/play.html). The local server runs the same API handlers as Vercel. Both games also support guest play on static hosting.

## Ranked Patch Bay

Players sign in with Twitch and select **Start daily circuit**. Everyone gets the same three layouts for a given UTC date. Each solved panel awards 200, 400 or 600 base points plus an efficiency bonus starting at 500. Each turn or reset uses 10 bonus points until the bonus reaches zero. The server replays the submitted actions and scores all three panels. A ranked ticket lasts two hours and counts toward the date it started.

The daily board keeps each Twitch account's highest score. The all-time board sums those daily bests. A better replay adds the difference, even if submissions arrive together. Equal scores share a rank. Both boards show the top ten players and the signed-in player's own standing.

### Connecting Twitch and Redis

1. Register a confidential web application in the [Twitch developer console](https://dev.twitch.tv/console/apps). Add the exact callback URL `https://<your-site-domain>/api/auth/callback`. For local sign-in, also register `http://localhost:4175/api/auth/callback`.
2. In the Vercel project's environment settings, set `ARCADE_ORIGIN` to the canonical site origin, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` to the app credentials, and `SESSION_SECRET` to a private random value of at least 32 characters. Serve the site on the canonical domain so the browser sends its session cookie. Use separate settings for previews.
3. Connect an Upstash Redis database and set its REST URL and read/write token as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` aliases also work. Redeploy after setting the variables. Data is keyed by Twitch user ID under the prefix `ilyynina:{patch-v1}:`.
4. To test locally, place development credentials in the ignored `.env.local`, set `ARCADE_ORIGIN=http://localhost:4175`, and run `node --env-file=.env.local scripts/dev.mjs`. Open the localhost URL above. Use a development Redis database for these scores.

Sign-in requests the public Twitch identity with no additional scopes. The callback uses an HTTP-only signed session after reading the profile and requests revocation of the Twitch access token. Public leaderboard entries link to the player's channel.

## Updating the site

- Edit `js/config.js` for profile details, social and partner links, emotes, gear, clips and archived broadcasts. The stream list and follower fallback are snapshots. Update their dates and copy when refreshing them.
- Page sections live in the corresponding HTML file. Shared navigation and content renderers live in `js/site.js`. The home and watch pages load `js/live.mjs` for live status. Set `live.status` in the config to `true`, `false` or `'auto'` to preview each mode.
- Raid Relay’s rails, bumpers, jackpot gate and flipper pivots are defined in `js/game/table.mjs`. Both the renderer and collision code read the same coordinates. The illustration under the hardware is `assets/game/raid-relay.webp`.
- `js/game/pinball.mjs` advances the ball and moving flippers at 240 fixed steps per second and owns the three-ball rules. `playfield.mjs` caches the printed table and draws the live pieces. `play.mjs` handles input, optional synthesized audio, pause and device-local records.
- Patch Bay panels are defined in `js/game/patch-bay.mjs`. Each panel specifies dimensions, an intended path from the left edge to the right edge, and clockwise starting rotations. Signal tracing accepts any connected route. `patch-controls.mjs` handles keyboard and touch interaction.

## Verification

Run `node --test` with Node 22 or later. Tests cover pinball physics, Patch Bay routing, daily scoring, signed ranked runs, and the Twitch callback with simulated upstream responses.
