# Steve's City — journey planner audit

Audit of the point-to-point journey system (pick two places → get door-to-door
times on foot / by bike / by tram / by subway → take the journey and watch it).
The goal was to make the feature robust and correct before building on top of it.

## How it was audited

The routing code lives inside one module closure in `index.html`, so I stood up
a headless test rig — the real game booted in Chromium with three.js vendored
locally — and drove the actual planner (`tripPlan`, `planWalk`, `planBike`,
`planByService`, the leg-splitter, the graph builder) two ways:

1. **Static review** of every journey function against the design notes in
   `prompt.md`.
2. **Empirical fuzzing** — hundreds of random journeys on generated cities plus
   your saved `test_paths.json` scenario, checking route invariants, and
   *actually sending travellers* and timing the watched arrival against the
   quote at 1×, 60× and 600×.

The fuzzing is what pinned the bugs down: across ~1,600 planned routes, exactly
one class of invariant failed, and end-to-end timing localised the rest.

## Bugs found and fixed

### Bug 1 — a rail trip's quoted total disagreed with its own step list
*Severity: medium — wrong number shown, and a systematic under-quote.*

When routing by tram or subway, the search seeds the **cheapest wait on the
whole network** (the shortest half-headway of any line) for the first boarding,
as an optimistic lower bound while it decides which stop to use. That optimistic
figure was then reported as the actual wait — but the checklist under it showed
the **real** wait of the line you actually board. So the headline "of about
4 min" could be built from steps that add up to more than 4 minutes, and the
quote sat below what you'd watch.

Measured on your saved city: tram quote said `Wait 25 s` in the total but the
wait step said `30 s`; the total was ~5 s short of its own steps. On other lines
the gap reached ~22 s.

**Fix:** the reported wait now sums the real half-headway of each line actually
boarded, so the total equals the sum of the steps and reflects the service the
traveller waits for. (The search still uses the optimistic lower bound to *rank*
routes — that part was fine.)

### Bug 2 — a tram ride was timed and measured in a straight line, ignoring the track
*Severity: medium — under-quoted rail time, and the shown distance didn't match the drawn route.*

A tram follows the streets, so the track between two stops can bend well away
from the straight line joining them. The planner quoted the ride from the
**crow-flies stop-to-stop distance**, while the vehicle (and the route drawn on
the map) followed the longer bent track. Two consequences:

- the ride time was under-quoted wherever the track bends — on your saved city a
  boarded hop is 378 m straight but **432 m along the track (+14%)**, so a 44 s
  quote should have been 49 s;
- the route's reported distance (**"0.6 km"**) was *shorter than the line
  actually drawn on the screen* — 620 m reported vs 710 m drawn.

This was the main driver of tram journeys running longer than quoted.

**Fix:** tram ride edges are now measured along the line's own waypoints — the
same points the drawn route and the vehicle use — so the ride time, the reported
distance and the on-screen route agree. Subway stays straight-line, because a
tunnel *is* straight.

### Effect of the fixes (watched vs quoted, your saved city)

| mode   | before | after |
|--------|:------:|:-----:|
| walk   | +4%    | +4%   |
| bike   | +1%    | +1%   |
| tram (60×) | +15% | **+11%** |
| tram (600×) | +33% | **+28%** |

Walk and bike were already spot-on; the rail quotes moved toward what you watch
and are now internally consistent.

## Investigated and deliberately *not* changed

- **"Slow" tram/subway options between nearby buildings are intended.** For two
  close places the planner may still offer a tram that's slower than walking —
  the design explicitly says to always show a real service and let its honest
  time speak, rather than hide it. The "each ride must get you materially closer
  to the destination" guard is working, so these never loop out-and-back; they're
  just honestly slow, and walking shows as *fastest*. Not a bug.
- **A journey from a place to *itself*** (only reachable programmatically, the UI
  blocks it) can still produce a pointless tram loop. Left as-is since it isn't
  user-reachable, but flagged here in case a future "round trip" feature needs a
  guard.

## Known limitation (documented, not a regression)

**Subway journeys drift high at 600× speed** (e.g. a 99 s trip watched as ~210 s).
At 600× a single frame is ~60 simulated seconds, and catching a *specific
invisible train* on a short 2-stop line means the boarding and alighting each
cost up to a frame of latency — which is a big fraction of a short trip. This is
the same discreteness the design notes call "irreducible" for rail at 600×; tram
shows it mildly (+28%), subway more because its trains are faster and its lines
shorter. Fixing it would mean re-tuning the shared tram/subway vehicle model,
which also drives the ambient crowd — not worth the regression risk for the
top-speed setting. At 1×–60× (normal play) rail lands within ~15%.

## What holds up well

The planner is otherwise solid: separate networks per mode (no falling back to
the street grid), honest "no route" answers, zero-length walks handled, the
leg-splitter and same-station joyride guards correct, the follow-camera riding
the actual vehicle (including gliding with the invisible subway), and no
crashes/NaNs across the whole fuzz. Only the two quoting bugs above were real.

## Tests

A runnable suite ships in `journey-tests/` (see its README). `npm test` runs 24
routing/quote invariant + regression checks in ~30 s and exits non-zero on
failure; `npm run test:timing` adds the end-to-end watched-journey timing. Both
pass against the patched `index.html`, and the two regression tests fail against
the old code, so they lock the fixes in.

## Note on `index.html`

The `window.__city` debug object at the bottom of the file now also exposes the
journey functions (`tripPlan`, `planByService`, `trackDist`, `tripTakeIt`, …).
That's what lets the suite test the real code; it's an additive, harmless
extension of a hook that was already there. Everything else changed is the two
fixes above.
