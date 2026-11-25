# Phalanx (Marathon 490 BC): notes

Multi-file game (no build): `index.html`, `style.css`, `js/` (i18n, core, audio, models, world, fx, game).
Linked from the home page, README, sitemap; thumbnail `thumbs/phalanx.jpg`.
Style choices (questionnaire): refined statuettes, golden dawn, fallen without blood, Italian + English.

## Beat indicator (done)
- Canvas in `#beat` (`BEATUI` in game.js). A white ring closes on the gold target circle and touches it exactly on
  the beat (the time the player hears it: `hearNow()` = audio clock − output latency − calibration), then keeps
  going inward and fades (red if the beat was not stepped on). Radius is a linear clock, so the pale band (good)
  and the gold band (perfect) are the real windows. The ring turns gold while it is inside the window.
- A tap leaves a mark where the ring was: outside the target = early, inside = late; the judge label adds
  "early/late" under Good and Off-beat. The drum in the middle thumps on every beat.
- Windows: Hoplite ±75/±150 ms, Story ±100/±210 ms. A tap is also compared with the next not-yet-scheduled beat.
- Menu → "Calibrate the beat": 12 taps on the drum (sound only), median of the last 10 stored in `phalanx.calib`.

## Verified (virtual-time sim + screenshots)
- Balance, bot with the pincer: Hoplite 142–160 home (acc 0.8–1, center 3/4/7/10), Story ~165–170;
  3/7 ships with a greedy steering bot (beach line now sidesteps at 4.4 m/s, launches 42…97 s after the clash).
- Retry the clash, pause/resume of the drum, defeat screen. Phone portrait HUD (stacked layout ≤640 px,
  beat above the touch buttons, name labels hidden over the beat circle).
- Fixed: arrow hitting a man whose shield was never drawn crashed (`shM` null); soldier counter was never updated.

## Possible next steps
- Rhythm accuracy matters little for the outcome (acc 0.8 ≈ perfect): could weigh streaks more in the clash.
- Deployment changes the clash only a little; a thin center (3) could bend more visibly.
- Hills on the sides look flat; arrows in flight are hard to see from the run camera.
