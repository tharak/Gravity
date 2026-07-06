# Verify Gravity changes in the running game

## Launch
- Serve: `python3 -m http.server 4173` from the repo root (no build step).
- Headless browser: `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome --headless=new --no-sandbox --remote-debugging-port=<port> --user-data-dir=$(mktemp -d) --window-size=1280,800 <url>`, then drive over raw CDP with Node's built-in WebSocket (no deps).

## Drive
- Switch maps via the app's own buttons: `document.querySelector('[data-test-map="FleetBattle"]').click()`. Formation buttons use lowercase ids: `[data-fleet-formation="line"]`.
- Fire the player gun with `Input.dispatchMouseEvent`: move → press → **hold ≥250ms** → release. Instant press/release is never sampled by the fixed-step sim. Holding the button fires continuously (one shot per cooldown).
- Magnify small details with `Page.captureScreenshot` `clip: {x,y,width,height,scale:3..4}`.
- Read flagship HP from the DOM: `document.body.innerText.match(/HP\s+([\d.]+\/[\d.]+)/)`. Overlays: `#game-over`, `#battle-won`, `#game-won` toggle `is-hidden`.

## A/B against the old build
- Copy the working tree (`cp -r`, drop `.git`) and `git archive HEAD | tar -x` into scratch dirs, serve on 4174/4175, run the identical script on both.
- Config-only tweaks in the copies make effects observable fast: `fireCooldownSeconds: 0.5` for rapid fire, delete the `raider-*` entries in `src/config/shipConfig.js` for a quiet enemy-free FleetBattle, `regionCount: 1` in spaceMapConfig for instant campaign wins.

## Gotchas
- **FleetTest ships have no factions** — faction-dependent behavior must be verified on FleetBattle or Battle (those rosters set `FactionId`).
- Projectiles are slow on screen at fleet zoom (260 u/s ≈ 18 px/s, 2.5s lifetime ≈ 45 px) — aim across short gaps, don't expect long visible tracks.
- One gun (8 dmg / 5s) never outpaces shield regen; sustained-damage checks need the rapid-fire config tweak.
- `pkill -f "http.server 417"` kills your own shell — bracket a char: `pkill -f "http.server 417[345]"`.
