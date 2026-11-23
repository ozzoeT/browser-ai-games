# Phalanx (Marathon 490 BC): work in progress

Multi-file game (no build): `index.html`, `style.css`, `js/` (i18n, core, audio, models, world, fx, game).
Playable end-to-end: menu → story → deployment → I march → II run (volleys) → III clash (pincer) → IV ships → results.
**Not linked from the home page / README / sitemap yet** (and no `thumbs/phalanx.jpg`).

Style choices (questionnaire): refined statuettes, golden dawn, fallen without blood, Italian + English.

## 1. Rhythm feedback is NOT intuitive (top priority, user feedback)
"I don't understand when to tap: with the circle at a similar size I sometimes get Perfect, sometimes Off-beat."
Likely causes:
- `updateBeatUI` (game.js): the ring shrinks 1.9 → 1 and **jumps back to 1.9 right after the beat**, so a tap a
  little late sees a *big* ring while a tap a little early sees a *small* one. Same "error", opposite look.
- Windows are tight on Hoplite (±62 ms perfect / ±125 ms good) and audio output latency on Windows is uncertain.
Ideas:
- Show a flash/pulse of the core exactly on the beat (and keep the ring at the core for ~120 ms after it).
- Feedback "Early" / "Late" (with the ms offset) instead of just "Off-beat"; a small timing bar under the circle.
- A clear "hit zone" ring drawn at the core size; maybe a horizontal lane with notes scrolling to a line instead.
- Wider windows (e.g. ±90/±180 ms on Hoplite, more on Story) and a latency calibration in the menu
  (tap along to 8 beats, store the mean offset in localStorage, subtract it in `INPUT.onStep`).
- Make feet/drum of the soldiers visibly hit on the beat (dust puff + core flash) so the eye can follow the line.

## 2. Still to verify / refine
- Re-run the virtual-time playthrough after the last edits (new Corinthian helmet + arched crest, dim rims that
  turn gold only when protected, bigger ships without the "leg" steering oars). Test hook: `__phalanx.sim(sec,{bot,acc,shield,steer,until})`
  and `__phalanx.render()`; headless swiftshader is too slow to play in real time.
- Balance (perfect bot, Hoplite, center 4): ~20 lost in the run, 130/192 home, 5/7 ships. Check imperfect play
  (`acc` 0.8–0.9), other deployments (3, 7, 10) and Story mode; perfect play should bring home ~165+.
- Bot test lowered shields while arrows were in flight: fixed with `G.incoming`; re-check arrow losses.
- Camera: closer behind the line in march/run (back 10.5, h 6.6), deploy view lifted above the panel: verify, also portrait/phone.
- Labels of the named friends: now only nearby + no overlap; check readability.
- Arrows were almost invisible: made thicker/longer; check in a volley screenshot.
- Ground/lighting: brighter golden grass, hemi 1.4; check it is not washed out; hills on the sides look flat.
- Clash: check the wing wheeling (turn) looks right, sparks/dust at the contact line, Persian edge files turning.
- Beach: rearguard charges, ships launching/captured, boarders on deck, runner leaving for Athens at the end.
- Mobile: touch buttons layout, performance (POST off on small screens), particle counts.
- Pause/resume of the beat clock, "Retry the clash" checkpoint, language switch mid-game.

## 3. When finished
- Thumbnail `thumbs/phalanx.jpg`, card on `index.html` (+ JSON-LD entry), README table row, `sitemap.xml`.
- Add a row to `.claude/skills/game-visuals/SKILL.md` Registro.
