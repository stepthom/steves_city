# Steve's City — build prompt

**Premise.** Build me *Steve's City*, a fun, beautiful, browser-based sandbox for designing and watching near-future, car-free cities. I place tall dense buildings, transit, and green space, then sit back and watch citizens live. It should feel alive, calm, and fresh. North star: *"I made this place, but I could not have designed it exactly."* Optimize for that feeling of emergence — I arrange the pieces; the life that results should surprise me.

## Tech & delivery
- A single self-contained `index.html` (inline CSS + JS). No build step, no bundler, no framework.
- 3D, using **Three.js loaded from a CDN via an importmap**. Low-poly but believable ("stylized-real"): clean massing, soft shadows, harmonious materials — not photoreal, but not blocky-ugly either.
- Must run by just opening the file or serving the folder: `python -m http.server 8626 -d .`
- Target a smooth ~60fps on a laptop with a city of a few thousand objects and up to ~16,000 animated people.
  - Merge the whole city into a couple of meshes; write boxes and ground quads straight into typed arrays rather than creating thousands of geometry objects per rebuild.
  - Instance trees, people, trams and lamps. Keep draw calls and shadow cost sane.
  - Editing rebuilds the city geometry, so a rebuild must stay fast enough to feel instant.

## Look & feel
- Warm daytime sunlight, a gradient sky shader with a sun disc and stars at night, soft hemisphere fill. Calm, cohesive palette: sky blues, warm sun, lots of varied greens, cream/terracotta/glass building tones, teal water.
- Green everywhere: street trees, green roofs, parks, forests, waterfront. The city should read as leafy and human.
- A large body of water the city sits beside, with an animated surface — moving wave normals, fresnel sky reflection, sun specular, and shallower colour near the beach.
- A full 24-hour day/night cycle: sky, sun colour, fog and ambient shift through dawn → noon → golden hour → dusk → night. See **Night** below — after dark is a set piece, not an afterthought.
- Everything is tone-mapped consistently (colours authored in sRGB, converted to linear), so the sky, water and city all sit in the same light.

## The map
- The world is a square buildable grid of 9 m cells with a wavy coastline running along one side and open countryside on the other three. Beyond the buildable area the ground fades to a muted grey-green, and a pale luminous rail marks the boundary — following the terrain, floating just above the water where it crosses the sea, with posts and taller corner markers.
- Blocks are 5 cells of buildable land plus a 1-cell street, so the street grid is on a 54 m pitch with 9 m car-free streets.
- Map size is chosen when starting a new city: **Small 0.9 km / Medium 1.3 km / Large 2.2 km / Huge 5.0 km** square. Everything scales with it — occupancy grids, the routing lattice, terrain, how far out the coast sits, camera limits. Huge is genuinely huge: keep the terrain mesh resolution capped so it doesn't balloon, and note that a full metropolis on it runs to five thousand objects and takes the best part of a second to rebuild. That's the price of the biggest setting.
- Streets only appear where the city has actually grown: paved where buildings are, soft meandering footpaths where the neighbouring blocks are parkland, untouched grass out in the countryside.

## Objects (the things I place)
One palette entry per *kind* of thing, grouped by category. Every placed object carries its own properties, which I can edit afterwards.

- **Housing:** Apartments — 4 to 110 storeys, 2×2 to 5×5 cells.
- **Work:** Office (4–200 storeys), **Shopping** (a high-street block, 2–14 storeys, 2×2 to 5×5), Shopping Mall (wide, low, 2–8 storeys, 3–11 cells), Factory (very wide and deep, 1–8 storeys, up to 12×12).
- **Civic:** Hospital (4–60), School (4–16), Library (4–14), Stadium (big — 5×5 up to 11×11 cells).
- **Green & leisure:** Park, Forest, Lake, Sports Field, **Sports Park**, Plaza, Waterfront Promenade — all resizable.
- **Transit:** tram stop, subway stop, bike path, walking path. Bike and walking routes are painted cell by cell along streets; tram and subway are drawn as lines between stops (see below).
- **Landmarks:** an Eiffel-like **Spire** (40–190 storeys), a **Megatower** (60–300), a Gateway-Arch-like **Arch** (15–90), a **Statue**, a **Fountain**, and a **Cathedral**.

### The Sports Park
A whole municipal sports complex on one plot, 4×4 up to 10×10 cells, spanning streets like a stadium does. It holds an **athletics track** with a grass infield, an **outdoor swimming pool** with lane markings and poolside benches, **two hard courts**, a small **clubhouse** with a lit frontage, a **jogging path** running the full perimeter, and **floodlight masts on all four corners** that glow after dark. It counts as a sports venue for residents, with a bigger visitor cap than a plain field.

### Editable properties
Selecting an object (or picking a palette tool before placing) opens an inspector showing live residents / jobs / footprint / height, with controls for:
- **Storeys**, within sensible per-type limits.
- **Base width and depth**, in cells. Growing something that no longer fits nudges it into the block rather than refusing.
- **Colour**, from a shared set of eight facade tones. Objects with a fixed material (statue, fountain, cathedral stonework accents) don't offer it.
- **Architectural style**, for buildings and most landmarks: **Modern, Art deco, Glass, Gothic, Brick**. Style is not just paint — it changes the massing: how many setbacks and how sharply the tower tapers, cornices, deco fins, gothic corner buttresses, brick string courses, and a distinct crown for each (stepped ziggurat and spire, sliced glass cap, pinnacles, parapet and water tower). Decoration must follow the taper, narrowing at each setback rather than standing proud of the upper storeys. Style also drives the window pattern in the facade shader, from near-continuous glazing on Glass to small punched openings on Brick.
- **Sport**, for sports fields and stadiums: **soccer, tennis, basketball or athletics**, with correct markings, nets, hoops, goals, and — for athletics — a four-lane oval track with an infield and a short row of stands along the straight. A field bigger than one pitch tiles them, choosing the orientation that fits the most, and adds floodlights once there is more than one.

Properties chosen on a palette tool stick around, so I can dial in 40-storey 3×3 apartments and place a dozen of them.

### The three sculptural landmarks
- **Statue** — 1×1 to 3×3 cells. A paved apron, a stepped stone plinth, and a bronze standing figure with a cloak line, one arm down and one raised. Roughly 10 m on the smallest plot to 16 m on the largest; benches and a pair of lamps around the base. It rotates with `R`.
- **Fountain** — 2×2 to 4×4 cells. A stone outer basin holding real animated water, two smaller tiers stacked above it on turned stems, a central jet with falling streams around it, plus benches, trees and lamps on the apron.
- **Cathedral** — 3–6 by 4–10 cells, 8–28 storeys, spanning streets. A full gothic massing: nave with side aisles and lead-roofed lean-tos, a transept crossing, a polygonal apse with its own conical roof, flying buttresses stepping down both flanks, twin west towers with spirelets, a rose window over the west door, and a crossing spire topped with a cross. At the default size it stands about 98 m to the cross. Its windows glow on the residential evening curve, so it lights up beautifully at dusk.

### Tram and subway lines
Two steps, in this order. **First place stops** from the palette like any other object — they auto-orient to the street they land on, and `R` turns them if I want them facing another way. **Then connect them** with the **Draw Tram Line** or **Draw Subway Line** tool: click one stop, then the next, and so on. Stops light up with a highlight column as the cursor comes near, the rubber band snaps to whichever one it would connect, and a click links it. Clicking anywhere that isn't near a stop does nothing but remind me to place one. `Enter` finishes the line.

A panel lists the lines for whichever tool I'm holding, with colour, stop count, and buttons to extend, recolour or delete, plus **Auto-connect** to chain up any stops I've left dangling. Picking up either tool drops me into the transit view and puts the view back when I'm done.

Lines are also objects I can click. With no tool in hand, clicking a tram track — or a subway tube in transit view — selects that line: it lights up white, and a panel shows its stop count, length in kilometres, colour swatches, **Extend** and **Delete**. `Delete` removes it too. Clicking a drag still orbits, so only a click without movement selects.

**Tram track is derived, not painted.** Between consecutive stops the line finds the shortest route through the street grid, and twin tracks are laid along every cell of it. The grass bed takes 8.2 m of a 9 m street, so **nothing else may stand in the corridor**: clear street trees, lamp posts, and the trees that towers and parks scatter onto the pavement out of any cell carrying track. Do this once at the end of the rebuild rather than trying to guard every place that plants something — nothing else knows where the line ended up running, and a tram driving through a tree ruins the illusion instantly. Roof gardens are exempt, obviously. Track begins and ends at a stop — never a metre beyond the last one. It's **green track**: rails set into a grass bed with tufts growing between and beside them, not a grey ballast strip. Trams run the length of their own line and **pause a couple of seconds at every stop**, longer at each terminus before reversing. They carry **headlamps at both ends** and cast a soft beam on the track ahead of whichever end is leading — see **Night**. The track disappears when the line or its stops do. Subway lines are tunnels, drawn straight between stops.

Stops themselves are compact: a single island platform beside the track with a shelter, a kerb edge and a sign — nothing spilling into the neighbouring cells.

Routing follows the lines I drew — no line, no service. A stop on two lines becomes an interchange. Generated cities arrive with several tram lines along their main corridors and one to three subway lines, depending on size.

### Stacking
Some objects host others, on a second occupancy layer:
- A **shopping mall** carries buildings on its roof — place apartments anywhere fully inside its footprint and they sit on top, lifted by the mall's height.
- A **forest** carries paths — a walking or bike path placed on a street cell inside one runs through the trees, and the tree scatter avoids it.
- Deleting a host takes its riders with it; dragging one carries them along; anything orphaned quietly drops to ground level.

### Emblems
Buildings wear a symbol so I can read the city at a glance: a red cross on hospitals, a book on libraries, an apple on schools, a green `$` on offices, a cog on factories, a shopping bag on malls, **a grocery basket with fruit poking out of it on Shopping**, a ball on stadiums, a family on apartments, and an `M` roundel on metro entrances. Draw them into a small canvas atlas at startup and map them onto quads on all four walls, just below the parapet — never on the roof, where crowns and plant rooms bury them, and always standing clear of whatever trim that style adds.

### Roof gardens
**Apartments, schools and hospitals always get a usable roof garden**, not just a green-painted slab — a little park up there. A lawn, a loop of decking just inside the edge, raised planting beds with a tree in each corner, benches facing out, a timber pergola once the roof is big enough, and a low parapet with a rail on top so it reads as somewhere people could actually stand. Everything sits in a ring near the edge, leaving the middle clear for whatever crown the architectural style puts there. Keep it cheap in geometry — a solid parapet band rather than a fence full of posts — because a hundred and fifty of these get built at once. Other low modern and glass blocks still get a plain green roof.

### Ground-floor life
Apartment blocks get a wider 3–4 storey base of shops, cafés and small businesses: glazed bays with mullions, striped awnings, hanging signs and the occasional pavement café with parasols. The glass reads dark by day and glows warm at night on its own material, independent of the tower windows above.

## Night
After dark the city should look inhabited and *legible*, not uniformly speckled. Three things do the work:

**1. Windows go out on a schedule, and different buildings keep different hours.** The facade shader picks lit windows by hashing each window cell against a threshold, and that threshold comes from one of three curves keyed off the building's use, packed into the same per-vertex seed attribute that carries style and jitter:
- **Homes** (apartments, mixed-use towers, leisure landmarks) peak around 21:00, start dropping after 22:00, and are essentially dark by **23:00**.
- **Workplaces** (offices, schools, libraries, malls, factories) run through the working day, wind down through the evening, and are essentially dark by **21:00**. An office district should visibly empty out an hour or two before the residential blocks do.
- **Round-the-clock places** (hospitals) barely dim at all — they're still lit at 3 am.

**2. Every path is lit.** Walking and bike paths carry slim post-top lamps roughly every 18 m, alternating sides. Park footpaths — the meandering ones that replace pavement inside a megapark — get their own posts. Plazas, promenades, stations, statues, fountains and the cathedral forecourt each place lamps too. Lamps are instanced: a warm bulb plus a translucent pool on the ground, both fading in as night comes on. Walking or cycling across the city after dark should be an obviously lit route, never a dark gap.

**3. Trams have headlights.** A pair of lenses at each end, on their own unlit-material instanced mesh so they read as light sources rather than shaded boxes, plus an additive ground beam ahead of the leading end that flips when the tram reverses at a terminus. Both fade up with the night factor.

And **the streets genuinely quiet down.** Evening outings are the exception rather than the rule, most people are home by 22:00, and only a small night-owl minority is still out after that. The outdoor crowd should peak at lunchtime and again at dusk, then thin out to a handful of figures by 23:00 and effectively nobody at 3 am.

## City structure
- Placement snaps to the grid. Buildings sit on blocks; transit runs along streets. Objects large enough to swallow a block (stadium, mall, factory, forest, sports park, cathedral) may span streets — the street surface disappears beneath them and the buried intersection drops out of the walking network so people route around.
- Clicking never simply refuses: a placement snaps to the nearest legal slot, so the ghost shows exactly where it will land. Only water and the edge of the map are off limits, and the message says which.
- Placing something on top of existing objects deletes them. Same when dragging one building onto its neighbours.
- **New City** opens a dialog: map size, city size, **layout**, or a **blank map** (terrain and water only, dropped straight into Edit mode).
- City sizes are **Village (~18k), Town (~150k), City (~500k), Metropolis (~2 million)** residents — each step is a bit over three times the last. Bigger cities occupy more blocks *and* build taller: a village is mostly 6–18 storey blocks, a town runs to 16–60, a city leans on 32–72, and a metropolis is 40% blocks of 56–72 storeys. Footprints run from about 8 × 7 blocks up to 48 × 33, so a metropolis only reaches full size on the Huge map; on smaller maps it trims to fit and lands proportionally lower.
- Whatever numbers the New City dialog quotes should be **what actually gets built** — calibrate the per-block figure against real generated cities rather than guessing, and re-check it whenever the density mix changes. A dialog that promises 200k and delivers 600k is worse than no estimate at all.

### Layout
Three ways to plan the city, chosen when starting a new one:

- **Random** — no planning at all. Every block outside the great park takes whatever zoning it happens to land on, so offices, flats and factories end up shoulder to shoulder. Chaotic on purpose.
- **Standard** — the default described below: business centres by the water, neighbourhoods around them, a blended ring in between.
- **Organized** — proper zoning. Offices are grouped into districts placed at the **inland edge of the footprint, well back from the water**, so the shore stays residential. The office district holds tall towers, some shops, some plazas and parks, **and nothing to live in** — not even flats on a mall roof. Light industry sits out beyond it on open ground. Everything else is residential: apartments, parks, schools, libraries, shops and sports fields.

  Critically, the two are held apart by a **green belt** rather than meeting at a line: a band of woodland, parkland, plazas and playing fields wrapping the office district, with nothing to live in and nothing to work in. Scale the belt to the footprint — a fixed width would swallow half of a small city — so it runs from about a block and a half in a town up to three blocks in a metropolis, and **scale the number of districts to the footprint too**, since each one carries its own belt: a town wants a single large district, not three that between them eat the whole map. The result should be stark next to Standard: an office's nearest block of flats goes from around 30 m away to 90–200 m, with a median separation of 150–300 m, and a metropolis grows from nine patches of woodland to well over a hundred. Organized should cost some population — the belt is real land — but only about 10% in a city, not half of it.

### Sports complexes
Standard and Organized cities both get **tournament-grade sports complexes: one for every 250,000 residents, and always at least one**, even in a village. A complex is a reserved patch of ground — up to four blocks by three — tiled with a **two-by-two grid of full-size Sports Parks**, each with its own track, pool, courts and floodlights, plus pitches and a gathering plaza squeezed into the gaps. Somewhere you could run a weekend kids' tournament across several fields at once.

Reserve the ground during zoning, before anything else is placed, so the rest of the city builds around it. Claim the biggest sites first and only fall back to smaller ones if the town has no room, size the parks so they tile the site exactly two across and two deep, keep complexes in different quarters of the city rather than letting them merge into one, and site them towards a flank and well back from the shore — sports parks span streets, so they need space the waterfront doesn't have. Random cities get none; the whole point of Random is that nobody planned anything.

- A generated city has real structure:
  - A footprint hugging the wavy coastline, with open country beyond it on all other sides.
  - **Neighbourhoods** — apartments, schools, libraries, shops, local parks and plazas. No office towers.
  - **One to three business centres** near the water: office towers and plazas, with the Megatower and Spire among them, a **Cathedral** on a civic block, plus a mixed ring of hospitals and taller flats around the edge.
  - **A megapark** spanning several whole blocks, Central Park style — the streets crossing it become meandering footpaths instead of pavement, and it holds one or two animated lakes, sports fields, patches of woodland, the Great Arch, and a **Fountain** and **Statue** among the greenery.
  - A light-industrial edge of factories on one flank, and woodland out beyond the last streets.
  - A waterfront promenade along the shore, and a walking street behind it.
  - Tram and bike corridors linking the centres to the neighbourhoods, and a handful of subway stops.

## Simulation & emergence (the heart of it)
- **Population** derives from housing: residents scale with storeys × footprint, so a 48-storey 3×3 tower is a thousand-plus people. Show the true total in the HUD, along with jobs and how many people are out and about right now.
- **Rendered agents** are a representative animated *sample*, each standing for however many residents that works out to. The stats always reflect everyone, whatever the sample size.
- **Crowd density is mine to choose** — **Light / Medium / Heavy / Very heavy** in the HUD. Medium is roughly one figure per 31 residents; Light is about a third of that, Heavy about double, Very heavy about triple, all capped at 16,000 figures. The streets should feel properly busy at Medium, not sparse. Changing it re-seeds the population immediately and reports the new figure count.
- **Figure size is mine to choose too** — a slider from 0.4× to 2.4×, defaulting to 1×. At 1× the little people are deliberately a bit under life-size, which reads better at normal city zoom; crank it up if I want to pick individuals out of a crowd.
- Agents follow a **daily schedule** that produces natural rhythms without me scripting anything:
  - **Night:** most people home; homes lit until ~23:00; streets genuinely empty around 3–5 am.
  - **Morning (~6–9):** commute to work and school; transit and paths get busy; sunrise.
  - **Midday:** people mostly inside; parks lightly used.
  - **Lunch (~12–1:30):** people spill out to nearby plazas, parks and the waterfront — visible crowding, and the busiest moment of the day.
  - **Evening commute (~5–7):** flow home; golden hour.
  - **Evening (~7–9):** a minority head back out to parks, promenades and sports fields — a second, smaller peak at dusk. Nearly everyone is indoors by 22:00, bar a few night owls out until ~23:30.
- **Sports venues** draw their own crowd: about half of residents have a sport habit — workers in the early evening, everyone else around midday — and each claims a slot at their nearest field or sports park, walks around it for about an hour, then heads home. Each venue has a hard visitor cap, counted at claim time so people already walking there count against it; a sports park holds far more than a plain field.
- **Mode choice** by trip distance: short trips walk, medium bike, longer trips take tram or subway. Agents route over a lattice of street intersections with cached A* — tram and bike links are derived from the infrastructure I actually placed, and subway riders vanish underground and pop out at the far station. Prioritize visual plausibility over perfect routing; fall back to a straight walk if no route exists.
- **People route the way people would.** Each lattice edge is classified by what actually runs along it — tram track, walking path, bike lane, a street through parkland, or plain pavement — and each travel mode weights those differently. On foot I should prefer a walking path, then a park street, then a bike lane, over bare pavement, and **actively avoid tram track**: the green rail bed fills nearly the whole street, so it's somewhere to cross, not somewhere to stroll. Cyclists stick to bike lanes and avoid the track too. Only tram *passengers* travel along a tram line. Laying tram track itself ignores all these preferences and just takes the shortest street route between stops.
- **A node pair can carry several parallel edges** — a street, a bike lane, and a tram line laid over the top. When labelling the segments of a chosen route, report the edge that traveller would actually have used, not simply the first one found. Getting this wrong makes tram passengers render as a long file of pedestrians trudging down the middle of the track, which is the single most immersion-breaking thing the sim can do.
- **How fast someone looks like they're moving depends on their mode, not the ground under them.** A pedestrian crossing a tram corridor or a cycleway still walks at walking pace; only a rider on a tram or subway gets transit speed.
- **Lateral position across the corridor matters too.** Pedestrians on a tram street hug the kerb well clear of the rails, cyclists ride the middle of their own lane, and tram passengers sit right on the rail line so they read as being aboard the vehicle.
- **Movement is calibrated to real time.** At 1× an agent covers a little under a metre a second — an unhurried stroll — and a tram does about 40 km/h. Faster clock speeds scale movement up sub-linearly and with a ceiling, so people hurry without teleporting; trams get a lower ceiling than pedestrians.
- Trams run as real vehicles on **twin tracks**, each direction keeping to its own rail so they pass each other rather than overlapping.
- When an agent reaches a destination building it "enters" (despawns) and reappears when its schedule sends it out again. Leisure trips linger outdoors instead, milling around the park.
- The goal of all this: I place towers, transit and parks, and the *patterns* — rush-hour flows, a lunchtime crowd at a plaza, a busy tram line, a lively waterfront at dusk, a five-a-side game in the evening, a dark office district beside still-lit flats — emerge from my layout in ways I didn't explicitly design.

## Time
- **1× means real time: one second of city per second of my life.** A full day takes 24 hours at 1×. This is the default, and it's meant to be watchable — sit and see the light move.
- Speed control is **pause / 1× / 60× / 600×**. 60× is a minute a second, 600× is ten minutes a second — a full day in about two and a half minutes. Space bar toggles pause.
- A **jump-to-hour slider** scrubs straight to any time of day without changing the speed.
- The clock reads in **12-hour am/pm** — `7:12am`, `12:00pm`, `11:30pm` — with the am/pm marker set smaller and dimmer than the digits, and the phase of day named beside it.

## Modes & controls
Two clearly toggled modes (Tab switches):
- **View mode:** can't edit; just watch.
- **Edit mode:** select, move, resize, restyle, delete; place new objects from the palette.

Camera, both modes: **left-drag orbits** (with a sensible tilt clamp), **right- or middle-drag pans**, scroll zooms, WASD/arrows move, `F` resets to frame the city. Make it feel effortless.

### Flyby
A **Flyby** button (or `V`) hands the camera over to a slow, calm, cinematic tour of the city — something you can leave running. It cycles through shot types, each lasting a quarter of a minute or so, cutting between them with a brief fade to black:

- **Street level** — an eye-line walk at about 1.6 m, moving at a stroll along a street towards something worth seeing.
- **Bird flight** — gliding at around **20 feet** up, in among the buildings, following the street corridors at maybe 12 m/s with a gentle rise and fall.
- **Aerial** — a drone hanging 60–260 m up, drifting slowly around a landmark.
- **Over the city** — a high, wide establishing shot, easing in as it turns.

Shots are aimed at what makes the city worth looking at: **fountains and statues first, then the cathedral, the arch, the spire, the megatower, the stadium, lakes, parks, promenades and sports parks**, with the tallest towers as a fallback. Keep a short memory of what has just been shown so the tour doesn't circle the same fountain twice in a minute.

Two details matter for it to feel right. **Ground and bird shots must follow the street grid** — route them through the same lattice the pedestrians use, so the camera never sails through a wall. And **smooth the camera position heavily** so it eases around the right-angle corners of the grid rather than snapping, but **snap it to the opening frame at each cut** — the fade hides the jump, and gliding in from the previous shot's position starts the new one badly framed.

`N` skips to the next shot, `Esc` or the Exit button returns to the free camera at wherever it ended up. Hide the editing panels while it runs and dim the stats, so there's nothing between me and the city.

### Riding along
In View mode, **clicking a person or a tram rides along with them**, and **dragging still looks freely around: up, down, left and right**. Scrolling moves between first person and a chase view.

**A person** starts in first person, 1.6 m off the ground — it's meant to be their viewpoint — and scrolls back over the shoulder to about 16 m.

**A tram** starts as a **chase shot behind and above the roof**: roughly 5 m back from the tail and 8 m up, tilted slightly down, so you watch the tram run the green track ahead of you. Scrolling all the way in puts you in **the driver's cab, not the middle of the carriage** — the body is 21 m long, so that's about 9 m forward of centre at 2.9 m up, flipping to the other end when the tram reverses at a terminus. Scrolling out goes to about 25 m back.

A tram is a rigid body running on rails and its position is already smoothed, so **bolt the camera to it rather than easing towards it**: exponential smoothing looks fine on a person but lets the camera lag several metres back down the carriage once the tram is at speed. People need the damping — they bob and turn sharp corners.

The figures are far too small to hit with an exact raycast, so pick whoever is *nearest the click ray* within a tolerance that widens with distance, trying trams before people. Label who I'm following and what they're up to — off to work, out and about, off to play, heading home — and whether they're walking, cycling or on transit.

When they step inside a building or drop into the subway, hold the camera and say so rather than cutting away instantly; if they stay in there more than about ten seconds, let go and say why, because staring at a wall is not a feature. Let go too if the crowd gets re-seeded underneath me. Switching to Edit mode ends the ride.

Edit interactions: left-click an object to select it (left-drag on empty ground still orbits), drag to move, `R` to rotate, `Delete` to remove, `Esc` to cancel. Hovering anything shows a tooltip with its type, size, storeys, style and capacity.

**Focus view — the HUD counts are the filter.** Every count in the top-left panel is a button. Click **63 Libraries** and every library in the city keeps its full colour while everything else washes out to a pale ghost, so I can see at a glance where they are and where the gaps are. Above the counts sits a row of category chips — **Housing, Work, Civic, Green, Transit, Landmarks** — that do the same for a whole category, and the **Residents** and **Jobs** figures highlight everywhere people live and everywhere they work. Clicking the active one again, or `Esc`, brings the city back.

Build it as a per-vertex flag baked into the merged geometry during the rebuild, with one uniform to switch the effect on — not as a per-object material, which would wreck the batching. Unfocused fragments desaturate and drop to about a quarter alpha. **Streets and tram track always stay lit** so the highlighted things still sit in a readable city, and foliage follows its owner, because a park's trees are the whole point of highlighting parks. Picking up a palette tool drops the focus — you shouldn't be building into a faded-out city.

**Transit view** (`M`, or the Transit category chip, or any transit count) shows every way people get around, over a city faded to about a tenth opacity:
- Tram lines as ribbons in their own line colours, with the trams still running, plus bike and walking paths as ribbons at slightly different heights so overlaps stay readable.
- Subway lines as coloured tubes — one colour per line, stacked slightly so parallels read — with tunnel traces on the ground, pillar-and-beacon markers at each stop, bigger white caps at interchanges, and grey markers for stops not yet on a line.
- A legend naming the four colours.

While it's on, the view is a transit editor: only transit objects can be hovered, selected or edited, non-transit palette entries dim, and choosing one of them drops back out of the view. The transit view and the focus view are mutually exclusive — entering one leaves the other. One place should own the material state for both, because toggling transparency recompiles shaders and the two settings will otherwise fight each other.

## HUD
A clean, unobtrusive overlay: the am/pm clock and time of day, total residents, jobs and people outside, a category strip, a clickable count for **every** kind of thing in the city plus tram and bike kilometres, a mode toggle, Flyby, New City, and Save / Load. There is **no Transit button** — the transit map is reached from the Transit category chip, any transit count, or `M`.

The bottom-right panel stacks two rows: **time** (pause / 1× / 60× / 600×, hour slider, reset view) above **people** (Light / Medium / Heavy / Very heavy density, and the figure-size slider with its multiplier shown). Minimal and pretty — glass panels, tabular numbers, nothing shouting.

## Save & load
- Save to a JSON file I can download: map size, seed, clock, camera, the layout it was generated with, my people size and density settings, every subway line, and every object with its stable id, position, rotation, storeys, footprint, colour, style, sport and layer. Load by picking a file back — including one saved on a different map size.
- Autosave to localStorage so a refresh doesn't lose my city.

## Non-goals (keep it a joyful sandbox)
No money/budget, no utilities (power, water, sewage), no pollution or traffic-failure sims, no disasters, no win/lose or failure states, no obstacle-course tutorial. This is a relaxing toy for prototyping ideas and enjoying the result — nothing to manage and nothing to lose.

## Definition of done
It opens (or serves) and immediately shows a living, green, car-free city beside water with people moving at a believable walking pace, and roof gardens on every block of flats. The clock runs in real time, or at 60× or 600× when I want to watch a whole day go by, and shows visibly different rhythms — morning commute, a lunchtime crowd, an evening game, offices going dark by 9pm and flats by 11, lit paths and tram headlights crossing a quiet city at midnight. I can dial the crowd from Light to Very heavy and the figures from tiny to oversized. Clicking any count in the HUD spotlights just that kind of thing across the whole city. I can toggle view/edit, move the camera around easily, place anything anywhere — including a sports park, a statue, a fountain and a cathedral — tune its height, footprint, colour and architectural style, stack flats on a mall, run a path through a forest, draw my own subway lines and flip to the metro map, start a fresh city at any size, in any of the three layouts, or from a blank map, and save/load to a file. Whatever I pick, there is always somewhere for the kids to play a tournament. And when I have finished building, I can hit Flyby and just watch the place, or click one of the little people and walk their commute with them. It looks beautiful and calm and makes me want to keep watching. You have creative latitude on execution and procedural details — use it to maximize beauty and that feeling of *"I made this, but I couldn't have designed it exactly."*
