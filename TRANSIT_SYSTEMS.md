# Subway & tram system types

New City now lets you choose, separately, how the **subway** and the **tram**
networks are laid out. Two new rows in the New City dialog: *Subway system* and
*Tram system*, each offering **Random**, **Full grid**, or **Ring-radial**. The
choice is saved with the city and restored on load. Adding more types later is a
one-line addition to the `TRANSIT_SYS` list.

## The three types

**Random** — the layout's own organic network, exactly what the city built
before this option existed: arterial corridors on the grown layouts
(Standard / Organized / Random), district-strip lines on a Planned city. Nothing
about the old behaviour changed; Random is the default.

**Full grid** — stops on an even N×N grid, with a line along every row and every
column. Each interior station sits where a row line crosses a column line, so it
becomes an interchange for free. **N grows with the map**: a village gets a
coarse grid, a metropolis on the Huge map a fine one (capped so the biggest maps
don't drown in track). A grid *tram* keeps the arterial corridor treatment you
chose — protected bike lane and promenade alongside the track — while a grid
*subway* runs straight tunnels between stops.

**Ring-radial** — concentric ring lines around the city centre, crossed by two
diagonal radial lines that meet at the middle. The rings put stops at the eight
compass points; the radials reuse each ring's four corner stops, so every place
a radial crosses a ring is automatically an interchange — the transfer hubs fall
out of the geometry, exactly like a real ring-radial metro. The number of rings
scales with the footprint (2 on a small city, up to 4 on a big one). A subway
draws clean chords between stops; a tram follows the streets between the same
stops and so reads as a stepped ring, which is the honest thing for track.

You can mix them — e.g. a ring-radial subway under a grid of tram arterials.

## How it fits the existing design

- **Coverage still holds.** Every combination keeps the city inside the design's
  access standard (≥90% of buildings within reach of a stop or bike path); in
  practice all of them land at 98–100%.
- **The journey planner needs no changes.** Routing is driven entirely by the
  placed stops and lines, so grid and ring networks plan and animate journeys
  the same way — verified across hundreds of trips with zero routing-invariant
  failures.
- **Applies to every layout**, including Planned (whose own district network is
  its "Random").
- **Arterials are preserved** for the grid tram, per your call, so a grid city
  still gets the shared tram+bike-lane+promenade corridors and the "long trips
  prefer arterials" routing.

## Where it lives in the code

- `TRANSIT_SYS` — the list of types (add new ones here).
- `buildTramSystem` / `buildSubwaySystem` — dispatch on the choice; `random`
  calls the layout's own builder passed in as a callback.
- `buildTramGrid`, `buildGridStops`, `buildRingRadial` — the new generic
  builders, driven off the city footprint.
- Wired into `generateCity` (grown layouts) and `planTransit` (Planned), the
  New City dialog, and `serialise` / `applyCity` for save/load.
