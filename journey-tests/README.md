# Steve's City — journey planner tests

Automated tests that exercise the **real** routing code in `../index.html`
(walk / bike / tram / subway planning, the per-mode quotes, the drawn route,
and — optionally — end-to-end "watch the journey" timing).

The game loads three.js from a CDN and keeps everything inside one module
closure. The tests run offline by vendoring three from `node_modules`, rewriting
the importmap in a throwaway copy of the page, serving it over localhost, and
driving it with Playwright. They read the routing functions through the
`window.__city` debug hook that `index.html` already exposes. **Your
`index.html` is never modified** — a patched copy is written into `.build/`.

## Running

```bash
cd journey-tests
npm install                    # pulls playwright + three@0.160.0
npx playwright install chromium
npm test                       # fast: routing + quote invariants  (~30s)
npm run test:timing            # also runs watched-journey timing   (a few min)
```

`npm test` exits non-zero if anything fails, so it drops straight into CI.

## What it checks

**Routing invariants** (250 random journeys on a generated city):
- every route's `pk` (per-segment kind) array lines up with its points,
- `total == onFoot + riding + waiting`,
- the headline total equals the sum of the step list shown to the player
  *(this is the regression test for Bug 1)*,
- no NaN / negative times or coordinates,
- every ride record names a real boarding & alighting stop, in order,
- a route badged "by tram"/"by subway" always contains an actual ride,
- the planner never throws.

**Bug regressions** (on your saved `test_paths.json` scenario):
- *Bug 1* — a rail trip's `waiting` equals the sum of its wait steps, and the
  total equals the sum of every step (office → apartment, tram and subway).
- *Bug 2* — a tram ride is timed and measured along the **track** it follows,
  not the straight line between platforms, and the route's reported distance
  matches the polyline actually drawn on the map.

**Correctness of "no route":**
- with the transit lines removed, tram/subway return *none* (not a disguised
  walk) while walking still routes,
- with the bike paths removed, the bike option returns *nothing*,
- a zero-length walk (a stop right outside the door) is a valid 0-second walk.

**Route continuity:** no absurd gaps on walk/bike segments (straight tram track
and subway tunnels are exempt).

**Transit system types** (random / full grid / ring-radial):
- all nine subway×tram combinations generate, keep the chosen type, and still
  meet the ≥90% access-coverage standard,
- a full grid gets finer as the map grows (a metropolis has more lines than a
  village),
- journeys route correctly on both the grid and ring-radial networks with no
  invariant violations,
- the chosen system type survives a save/load round-trip.

**End-to-end timing** (`test:timing`): sends a traveller office → apartment at
60× and checks the watched arrival lands within tolerance of the quote and that
every step is reached in order. Walk/bike land within ±10–12%; tram/subway
within ~±15% at 1×–60×.

> Note: the timing test drives the live animation loop, so on a machine with a
> slow/software GPU it runs slowly (the sim advances in real time × speed). On
> normal hardware each journey finishes in about a second. Rail trips drift
> higher at 600× — see "Known limitation" in the audit report — so the timing
> test uses 60×.

## Files
- `run-tests.cjs` — the suite and its assertions.
- `setup.cjs` — boots the game offline (vendors three, serves, launches Chromium).
- `.build/` — throwaway patched copy of the game (safe to delete).
