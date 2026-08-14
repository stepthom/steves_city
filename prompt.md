# Steve's City — build prompt

**Premise.** Build me *Steve's City*, a fun, beautiful, browser-based sandbox for designing and watching near-future, car-free cities. I place tall dense buildings, transit, and green space, then sit back and watch citizens live. It should feel alive, calm, and fresh. North star: *"I made this place, but I could not have designed it exactly."* Optimize for that feeling of emergence — I arrange the pieces; the life that results should surprise me.

## Tech & delivery
- A single self-contained `index.html` (inline CSS + JS). No build step, no bundler, no framework.
- 3D, using **Three.js loaded from a CDN via an importmap**. Low-poly but believable ("stylized-real"): clean massing, soft shadows, harmonious materials — not photoreal, but not blocky-ugly either.
- Must run by just opening the file or serving the folder: `python -m http.server 8626 -d .`
- Target a smooth ~60fps on a laptop with a city of a few thousand objects and ~2,400 animated people.
  - Merge the whole city into a couple of meshes; write boxes and ground quads straight into typed arrays rather than creating thousands of geometry objects per rebuild.
  - Instance trees, people, trams and lamps. Keep draw calls and shadow cost sane.
  - Editing rebuilds the city geometry, so a rebuild must stay fast enough to feel instant.

## Look & feel
- Warm daytime sunlight, a gradient sky shader with a sun disc and stars at night, soft hemisphere fill. Calm, cohesive palette: sky blues, warm sun, lots of varied greens, cream/terracotta/glass building tones, teal water.
- Green everywhere: street trees, green roofs, parks, forests, waterfront. The city should read as leafy and human.
- A large body of water the city sits beside, with an animated surface — moving wave normals, fresnel sky reflection, sun specular, and shallower colour near the beach.
- A full 24-hour day/night cycle: sky, sun colour, fog and ambient shift through dawn → noon → golden hour → dusk → night. Building windows glow warm after dark, shopfronts and signage light up, streetlights pool on the pavement, and the city visibly quiets.
- Everything is tone-mapped consistently (colours authored in sRGB, converted to linear), so the sky, water and city all sit in the same light.

## The map
- The world is a square buildable grid of 9 m cells with a wavy coastline running along one side and open countryside on the other three. Beyond the buildable area the ground fades to a muted grey-green, and a pale luminous rail marks the boundary — following the terrain, floating just above the water where it crosses the sea, with posts and taller corner markers.
- Blocks are 5 cells of buildable land plus a 1-cell street, so the street grid is on a 54 m pitch with 9 m car-free streets.
- Map size is chosen when starting a new city: **Small 0.9 km / Medium 1.3 km / Large 1.7 km / Huge 2.2 km** square. Everything scales with it — occupancy grids, the routing lattice, terrain, how far out the coast sits, camera limits.
- Streets only appear where the city has actually grown: paved where buildings are, soft meandering footpaths where the neighbouring blocks are parkland, untouched grass out in the countryside.

## Objects (the things I place)
One palette entry per *kind* of thing, grouped by category. Every placed object carries its own properties, which I can edit afterwards.

- **Housing:** Apartments — 4 to 110 storeys, 2×2 to 5×5 cells.
- **Work:** Office (4–200 storeys), Shopping Mall (wide, low, 2–8 storeys), Factory (very wide and deep, 1–8 storeys).
- **Civic:** Hospital (4–60), School (4–16), Library (4–14), Stadium (big — 5×5 up to 11×11 cells).
- **Green & leisure:** Park, Forest, Lake, Sports Field, Plaza, Waterfront Promenade — all resizable.
- **Transit:** tram stop, subway stop, bike path, walking path. Bike and walking routes are painted cell by cell along streets; tram and subway are drawn as lines between stops (see below).
- **Landmarks:** an Eiffel-like Spire, a ~200-storey Megatower, a Gateway-Arch-like Arch.

### Editable properties
Selecting an object (or picking a palette tool before placing) opens an inspector showing live residents / jobs / footprint / height, with controls for:
- **Storeys**, within sensible per-type limits.
- **Base width and depth**, in cells. Growing something that no longer fits nudges it into the block rather than refusing.
- **Colour**, from a shared set of eight facade tones.
- **Architectural style**, for buildings and landmarks: **Modern, Art deco, Glass, Gothic, Brick**. Style is not just paint — it changes the massing: how many setbacks and how sharply the tower tapers, cornices, deco fins, gothic corner buttresses, brick string courses, and a distinct crown for each (stepped ziggurat and spire, sliced glass cap, pinnacles, parapet and water tower). Decoration must follow the taper, narrowing at each setback rather than standing proud of the upper storeys. Style also drives the window pattern in the facade shader, from near-continuous glazing on Glass to small punched openings on Brick.
- **Sport**, for sports fields and stadiums: soccer, tennis or basketball, with correct markings, nets, hoops and goals. A field bigger than one pitch tiles them, choosing the orientation that fits the most, and adds floodlights once there is more than one.

Properties chosen on a palette tool stick around, so I can dial in 40-storey 3×3 apartments and place a dozen of them.

### Tram and subway lines
Two steps, in this order. **First place stops** from the palette like any other object — they auto-orient to the street they land on, and `R` turns them if I want them facing another way. **Then connect them** with the **Draw Tram Line** or **Draw Subway Line** tool: click one stop, then the next, and so on. Stops light up with a highlight column as the cursor comes near, the rubber band snaps to whichever one it would connect, and a click links it. Clicking anywhere that isn't near a stop does nothing but remind me to place one. `Enter` finishes the line.

A panel lists the lines for whichever tool I'm holding, with colour, stop count, and buttons to extend, recolour or delete, plus **Auto-connect** to chain up any stops I've left dangling. Picking up either tool drops me into the transit view and puts the view back when I'm done.

Lines are also objects I can click. With no tool in hand, clicking a tram track — or a subway tube in transit view — selects that line: it lights up white, and a panel shows its stop count, length in kilometres, colour swatches, **Extend** and **Delete**. `Delete` removes it too. Clicking a drag still orbits, so only a click without movement selects.

**Tram track is derived, not painted.** Between consecutive stops the line finds the shortest route through the street grid, and twin tracks are laid along every cell of it. Track begins and ends at a stop — never a metre beyond the last one. It's **green track**: rails set into a grass bed with tufts growing between and beside them, not a grey ballast strip. Trams run the length of their own line and **pause a couple of seconds at every stop**, longer at each terminus before reversing. The track disappears when the line or its stops do. Subway lines are tunnels, drawn straight between stops.

Stops themselves are compact: a single island platform beside the track with a shelter, a kerb edge and a sign — nothing spilling into the neighbouring cells.

Routing follows the lines I drew — no line, no service. A stop on two lines becomes an interchange. Generated cities arrive with several tram lines along their main corridors and one to three subway lines, depending on size.

### Stacking
Some objects host others, on a second occupancy layer:
- A **shopping mall** carries buildings on its roof — place apartments anywhere fully inside its footprint and they sit on top, lifted by the mall's height.
- A **forest** carries paths — a walking or bike path placed on a street cell inside one runs through the trees, and the tree scatter avoids it.
- Deleting a host takes its riders with it; dragging one carries them along; anything orphaned quietly drops to ground level.

### Emblems
Buildings wear a symbol so I can read the city at a glance: a red cross on hospitals, a book on libraries, an apple on schools, a green `$` on offices, a cog on factories, a shopping bag on malls, a ball on stadiums, a family on apartments, and an `M` roundel on metro entrances. Draw them into a small canvas atlas at startup and map them onto quads on all four walls, just below the parapet — never on the roof, where crowns and plant rooms bury them, and always standing clear of whatever trim that style adds.

### Ground-floor life
Apartment blocks get a wider 3–4 storey base of shops, cafés and small businesses: glazed bays with mullions, striped awnings, hanging signs and the occasional pavement café with parasols. The glass reads dark by day and glows warm at night on its own material, independent of the tower windows above.

## City structure
- Placement snaps to the grid. Buildings sit on blocks; transit runs along streets. Objects large enough to swallow a block (stadium, mall, factory, forest) may span streets — the street surface disappears beneath them and the buried intersection drops out of the walking network so people route around.
- Clicking never simply refuses: a placement snaps to the nearest legal slot, so the ghost shows exactly where it will land. Only water and the edge of the map are off limits, and the message says which.
- Placing something on top of existing objects deletes them. Same when dragging one building onto its neighbours.
- **New City** opens a dialog: map size, city size, or a **blank map** (terrain and water only, dropped straight into Edit mode).
- City sizes are **Village (~18k), Town (~45k), City (~200k), Metropolis (~800k)** residents. Bigger cities occupy more blocks *and* build taller — a village is 6–18 storey blocks, a metropolis mostly 56–72 storey ones.
- A generated city has real structure:
  - A footprint hugging the wavy coastline, with open country beyond it on all other sides.
  - **Neighbourhoods** — apartments, schools, libraries, local parks and plazas. No office towers.
  - **One to three business centres** near the water: office towers and plazas, with the Megatower and Spire among them, plus a mixed ring of hospitals and taller flats around the edge.
  - **A megapark** spanning several whole blocks, Central Park style — the streets crossing it become meandering footpaths instead of pavement, and it holds one or two animated lakes, sports fields, patches of woodland and the Great Arch.
  - A light-industrial edge of factories on one flank, and woodland out beyond the last streets.
  - A waterfront promenade along the shore, and a walking street behind it.
  - Tram and bike corridors linking the centres to the neighbourhoods, and a handful of subway stops.

## Simulation & emergence (the heart of it)
- **Population** derives from housing: residents scale with storeys × footprint, so a 48-storey 3×3 tower is a thousand-plus people. Show the true total in the HUD, along with jobs and how many people are out and about right now.
- **Rendered agents** are a representative animated *sample* — up to ~2,400 visible, each standing for however many residents that works out to. The stats reflect everyone.
- Agents follow a **daily schedule** that produces natural rhythms without me scripting anything:
  - **Night:** most people home; windows lit; streets genuinely empty around 3–5 am.
  - **Morning (~6–9):** commute to work and school; transit and paths get busy; sunrise.
  - **Midday:** people mostly inside; parks lightly used.
  - **Lunch (~12–1:30):** people spill out to nearby plazas, parks and the waterfront — visible crowding.
  - **Evening commute (~5–7):** flow home; golden hour.
  - **Evening (~7–11):** parks, promenades and sports fields fill; then wind down to night.
- **Sports fields** draw their own crowd: about half of residents have a sport habit — workers in the evening, everyone else around midday — and each claims a slot at their nearest field, walks around it for about an hour, then heads home. Each field has a hard cap of 5–10 visitors, counted at claim time so people already walking there count against it.
- **Mode choice** by trip distance: short trips walk, medium bike, longer trips take tram or subway. Agents route over a lattice of street intersections with cached A* — tram and bike links are derived from the infrastructure I actually placed, and subway riders vanish underground and pop out at the far station. Prioritize visual plausibility over perfect routing; fall back to a straight walk if no route exists.
- Trams run as real vehicles on **twin tracks**, each direction keeping to its own rail so they pass each other rather than overlapping.
- When an agent reaches a destination building it "enters" (despawns) and reappears when its schedule sends it out again. Leisure trips linger outdoors instead, milling around the park.
- The goal of all this: I place towers, transit and parks, and the *patterns* — rush-hour flows, a lunchtime crowd at a plaza, a busy tram line, a lively waterfront at dusk, a five-a-side game in the evening — emerge from my layout in ways I didn't explicitly design.

## Modes & controls
Two clearly toggled modes (Tab switches):
- **View mode:** can't edit; just watch.
- **Edit mode:** select, move, resize, restyle, delete; place new objects from the palette.

Camera, both modes: **left-drag orbits** (with a sensible tilt clamp), **right- or middle-drag pans**, scroll zooms, WASD/arrows move, `F` resets to frame the city. Make it feel effortless.

Edit interactions: left-click an object to select it (left-drag on empty ground still orbits), drag to move, `R` to rotate, `Delete` to remove, `Esc` to cancel. Hovering anything shows a tooltip with its type, size, storeys, style and capacity.

**Transit view** (`M` or a HUD button) shows every way people get around, over a city faded to about a tenth opacity:
- Tram lines as ribbons in their own line colours, with the trams still running, plus bike and walking paths as ribbons at slightly different heights so overlaps stay readable.
- Subway lines as coloured tubes — one colour per line, stacked slightly so parallels read — with tunnel traces on the ground, pillar-and-beacon markers at each stop, bigger white caps at interchanges, and grey markers for stops not yet on a line.
- A legend naming the four colours.

While it's on, the view is a transit editor: only transit objects can be hovered, selected or edited, non-transit palette entries dim, and choosing one of them drops back out of the view.

## HUD
A clean, unobtrusive overlay: the running 24h clock and time of day, total residents, jobs and people outside, counts of every kind of building plus tram and bike kilometres, a mode toggle, time controls (pause, 1×/4×/16×, and a jump-to-hour slider), Metro toggle, New City, and Save / Load. Minimal and pretty — glass panels, tabular numbers, nothing shouting.

## Save & load
- Save to a JSON file I can download: map size, seed, clock, camera, every subway line, and every object with its stable id, position, rotation, storeys, footprint, colour, style, sport and layer. Load by picking a file back — including one saved on a different map size.
- Autosave to localStorage so a refresh doesn't lose my city.

## Non-goals (keep it a joyful sandbox)
No money/budget, no utilities (power, water, sewage), no pollution or traffic-failure sims, no disasters, no win/lose or failure states, no obstacle-course tutorial. This is a relaxing toy for prototyping ideas and enjoying the result — nothing to manage and nothing to lose.

## Definition of done
It opens (or serves) and immediately shows a living, green, car-free city beside water with people moving. The clock runs through a full day with visibly different rhythms — morning commute, lunchtime crowds, an evening game, a quiet night of lit windows and glowing shopfronts. I can toggle view/edit, move the camera around easily, place anything anywhere, tune its height, footprint, colour and architectural style, stack flats on a mall, run a path through a forest, draw my own subway lines and flip to the metro map, start a fresh city at any size or from a blank map, and save/load to a file. It looks beautiful and calm and makes me want to keep watching. You have creative latitude on execution and procedural details — use it to maximize beauty and that feeling of *"I made this, but I couldn't have designed it exactly."*
