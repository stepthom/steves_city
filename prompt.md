# Steve's City — build prompt

**Premise.** Build me *Steve's City*, a fun, beautiful, browser-based sandbox for designing and watching near-future, car-free cities. I place tall dense buildings, transit, and green space, then sit back and watch citizens live. It should feel alive, calm, and fresh. North star: *"I made this place, but I could not have designed it exactly."* Optimize for that feeling of emergence — I arrange the pieces; the life that results should surprise me.

## Tech & delivery
- A single self-contained `index.html` (inline CSS + JS). No build step, no bundler, no framework.
- 3D, using **Three.js loaded from a CDN via an importmap**. Low-poly but believable ("stylized-real"): clean massing, soft shadows, harmonious materials — not photoreal, but not blocky-ugly either.
- Must run by just opening the file or serving the folder: `python -m http.server 8626 -d .`
- Target a smooth ~60fps on a laptop with a city of a few thousand objects and up to ~32,000 animated people.
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
- **Work:** Office (4–200 storeys), Factory (very wide and deep, 1–8 storeys, up to 12×12), **Vertical Farm** (6–60 storeys, 2×2 to 5×5).
- **Commercial:** **Shopping** (a high-street block, 2–14 storeys, 2×2 to 5×5), Shopping Mall (wide, low, 2–8 storeys, 3–11 cells).
- **Civic:** Hospital (4–60 storeys), School (4–16, default 6×5×9), both up to **10×10 cells** and spanning streets like a superblock — a big hospital or a school campus is bigger than a city block. Library (4–14), **City Hall** (4–16 storeys, 4×4 to 8×8, spanning streets).
- **Sports:** Sports Field, **Sports Park**, **Swimming Pool**, **Sports Megatower** (5–40 storeys, 5×5 to 10×10, spanning), Stadium (big — 5×5 up to 11×11 cells).
- **Green & leisure:** Park, Forest, Lake, **Playground**, Plaza, Waterfront Promenade — all resizable.
- **Transit:** tram stop, subway stop, bike path, walking path. Bike and walking routes are painted cell by cell along streets; tram and subway are drawn as lines between stops (see below). A bike cell flagged as an arterial draws a whole transit corridor instead.
- **Landmarks:** an Eiffel-like **Spire** (40–190 storeys), a **Megatower** (60–300), a Gateway-Arch-like **Arch** (15–90), a **Statue**, a **Fountain**, and a **Cathedral**.

### The Sports Park
A whole municipal sports complex on one plot, 4×4 up to 10×10 cells, spanning streets like a stadium does. It holds an **athletics track** with a grass infield, an **outdoor swimming pool** with lane markings and poolside benches, **two hard courts**, a small **clubhouse** with a lit frontage, and a **jogging path** running the full perimeter. It counts as a sports venue for residents, with a bigger visitor cap than a plain field.

### The Swimming Pool
A standalone lido, 2×2 to 6×6 cells: a tiled deck, a coped basin of real water with lane ropes and starting blocks along the shallow end, a changing block, a row of loungers, and trees at the edges. At the deep end, a **springboard** on a stand, and on anything 3×3 or larger a **high dive** — a five-metre tower with a ladder, railings and a plank out over the water. It counts as a sports venue like a field does. Fenced.

**The boards belong to the pool, not to the lido.** The sports park has a pool too, and it wants the same boards. Put them in a function both builders call rather than inline in one of them — inline, the park's pool silently has none, and nobody notices until somebody goes looking. The boards go at the end the lane ropes point at, so pass the swimming direction in rather than working it out from the water's proportions, which don't always agree.

**Pools and fountains must not use the sea shader.** At that size it reads as a dark grey puddle. Give them their own bright chlorinated blue with a slow ripple crossing the surface, dimming at night with everything else.

**The coping round a pool is a kerb of four rails, not a slab across the plot.** A solid box the size of the pool swallows the water plane inside it and what you see is the grey top of that box — the water is still there, still blue, and completely invisible. The same trap catches a fountain basin whose water disc sits exactly on the rim's top face. When something ought to be visible and isn't, check what is drawn *over* it before touching its colour.

### The Playground
2×2 to 4×4 cells of soft ground inside a grass border, with **swings** hanging from an A-frame, a **slide** with a ladder up to a little tower and a ramp down, a **seesaw** on a pivot, and a **climbing frame**. Pick the paint colours per playground from a small bright palette so they don't all look identical, and add benches for whoever brought the children and a tree or two for shade.

### The Sports Megatower
Sport stacked into a tower: **very wide, very deep, and with storeys tall enough to hold a court and the ball above it**. That last part is what makes it read as something other than an office block — the floor-to-floor is about two and a half times a normal storey, so sixteen storeys here stand as tall as forty in a tower block, and the deep horizontal banding is what sells that from across the city. 5×5 to 10×10 cells, spanning streets.

A broad plinth of entrances and changing rooms, then storey after storey of glazed hall with a structural rib under each one, four solid corner cores running the full height, and **open-air courts on the roof** behind a high fence with floodlight masts at the corners. Its symbol, worn on all four walls, is a **runner**.

It is a workplace *and* a sports venue: people commute to work in it, and other people travel to it for a game the same way they would to a pitch. A game inside fills several halls at once — around fourteen players per pair of storeys, and a crowd of up to sixty. Its lights stay on late, like a hospital's.

**Rare venues need to be reachable, or they are decorative.** People pick somewhere to play from a shortlist of the nearest few venues, and a city with two megatowers among four hundred kickabout pitches will never have one in anybody's nearest four — so nobody ever goes and the building stands empty for ever. The shortlist has to carry **the nearest of every kind of venue** as well as the nearest few overall. The walking-distance check is what stops anyone trekking across the city for it.

### The Vertical Farm
Narrow and tall, growing the city's food. Every floor is a **tray of crops behind glass** — a glazed band with the planting visible inside it and a slim floor slab between — with the service core running up one narrow side. On top, a row of **pitched glasshouses**, water tanks and a lift overrun.

The signature is at night: the grow lights are **magenta**, so a farm is the one building in the city glowing pink while everything else glows warm yellow. Like a hospital, it never goes fully dark.

One per 45,000 residents or so in a grown city, sited out towards the industrial flank as well as in among the offices; in a planned city they go by the works and in the business districts, **never on neighbourhood ground**, which is for living on.

### The City Hall
The one building in the city that is trying to impress, and there is **exactly one**. A stylobate and a broad flight of steps, a **colonnade of six columns under a stepped pediment**, a main block with two lower wings, and a **drum carrying a dome and a lantern** over the middle — with a clock on the front of the drum, flagpoles either side of the steps and trees round the forecourt. Storeys are about twice normal height, so seven of them stand around 55 m with the dome above that.

Lay it out in coordinates along the entrance axis rather than in world space, so the portico can be turned to face any street. In a planned city it **faces the central park**, where everybody can see it; in a grown one it takes a civic block near the middle.

### Floodlights
City pitches spend much of the day in the shadow of the blocks around them, so **every sports venue gets proper floodlight masts** — four at the corners, six on the bigger ones, around 16 m at a sports field, 19 m at a sports park, 12 m at a pool, each carrying a bank of lamps on a crossarm.

**The lamps come on when a game is being played there, whatever the time of day.** A match at two in the afternoon turns them on. Drive them from the game, never from the clock. Along with the lamps, lay a warm wash of light over the playing surface so the pitch itself brightens rather than just the masts glowing — lean on it harder as the surroundings darken, so a pitch shaded by a tower at midday still reads as lit without being blown out.

Instance the heads and the wash and switch them through the instance colour, so any venue in the city can light up on its own without disturbing the others. Leave a couple of ordinary street lamps at each venue too, so somewhere with no game on isn't pitch black at night.

### Fences
**Swimming pools, tennis courts and basketball courts are fenced** — posts, a top rail and a mid rail, tall around the courts and low around the pool. Soccer pitches and athletics tracks are not, and a court inside a stadium bowl isn't either, since the bowl already encloses it. Keep the fence cheap enough that every court in the city can have one.

## The transit skeleton
Every layout gets the same network, built by the same code. Whether you can get from a given doorstep to the rest of the city should not depend on which street pattern the city happened to be generated with.

**The standard it is built to: every building is within two blocks — about 108 m — of a tram stop, a subway stop or a bike path.** In a finished city that comes out at 98–100% for every layout at every size. Assert on *that*, not on how many lines were laid: a line that failed to place because a superblock was in the way still counts as a line.

### Arterials
**One to four corridors each way**, scaled to size — a town gets one of each, a metropolis four — spread evenly across the footprint and spanning its whole length.

An arterial is **all three modes on one street**: dual tram track down the centre channel, a protected bike lane each side of it, and a lamp-lit paved promenade on the kerbs. That combination is the point; three parallel routes on three different streets is not the same thing.

Two things make this harder than it looks:

- **Two transit objects cannot share a cell.** Lay a bike path and then a promenade on the same street and the second simply fails to place — you get a bike lane you have been calling a corridor. It has to be *one* object per cell that knows it is an arterial and draws the whole nine metres itself.
- **The track along it must be drawn narrow.** The ordinary tram bed is 8.2 m of a 9 m street; draw that over an arterial and it swallows the bike lanes and the promenade whole. Pull the rails in and let the corridor lay its own bed.

Long trips **prefer** arterials — they are the one route type better than a plain street for every mode at once. Decide that where the tram edges are added, not from what covers the ground: a modern city has no tram *objects*, since track is implied by the line, so counting nets on the cells would never find a tram anywhere. In a finished metropolis about three quarters of cross-city trips run down an arterial for part of the way, carrying roughly a quarter of all distance travelled.

**Lay the arterials before the superblocks.** Transit is the skeleton, so the stadiums, malls and cathedrals route around the corridors rather than the other way about. Only the arterials go this early — the full bike lattice would take a third of the street lines in the city and leave nowhere for a superblock at all.

### The lattice, the perimeter and the underground
- **Bike lattice:** every third street line, both ways. That is 162 m between lines, so the furthest any doorstep can be from one is 81 m, inside the standard, at two thirds the objects a spacing of two would cost. It is far and away the most numerous thing in the city — three quarters of all objects in a metropolis — but a cell is one slab, and laying twenty thousand of them takes about 20 ms.
- **A perimeter route** right round the outside of the built-up area — but **not along the water**, where the promenade already runs and a cycle lane would only get between people and the view. So it is a U, not a loop.
- **Subway:** stops on the hubs worth an interchange — business centres, the great park, the waterfront, and in a planned city every business district and every third neighbourhood — plus a spread across the footprint so the outer districts reach the middle without three changes. One to three routes, chained automatically.

  **A station must look next door before giving up.** By the time the underground goes in, the bike lattice holds every third street line, so a station aimed at an exact intersection lands on a cycle path more often than not. Without a retry, a whole town can end up with no underground at all.

### Save what marks an arterial
Both the corridor cells and the tram lines running down them carry a flag, and **both have to be written to the save file**. Leave either out and a reloaded city comes back with its corridors as ordinary bike lanes and its trunk routing gone — invisible until somebody wonders why a saved city feels slower to get around than it did.

### Park footpaths run straight
Where a street line is surrounded only by greenery — between two pitches, or crossing a park — it becomes a **3 m stone footpath instead of a road**. It runs dead straight, and it joins up at crossings.

Resist making it wander. A per-cell sideways nudge does not read as a meander: the cells are nine metres long, so offsetting each one by a fraction of a radian of sine puts successive segments at unrelated positions and the path comes out as a row of steps. At `sin(g × 1.7)` the average sideways step between neighbouring segments is 1.05 m on a 3.1 m path — the two barely overlap. A curve needs a period of many cells, not one.

### Woodland must be even, not first-come-first-served
Drawing trees is the most expensive thing in the scene, so there has to be a ceiling on how many exist. **Spend that ceiling per square metre of wood, not in the order the woods were built.** Take them first-come-first-served and the forests laid down early come out dense while everything past the ceiling comes out bare — which is precisely what a patchy city looks like, and it is the ceiling doing it, not the forest code. A sprawling planned city wants a quarter of a million trees; only a fraction of that can be drawn.

Three things make it work together:

- **Two kinds of tree.** A specimen on a street or in a park gets the detailed mesh. A tree in a wood is only ever seen en masse, so it gets one lump of canopy on an open three-sided trunk — 26 triangles against 80, no end caps needed since the ground hides one and the canopy the other. That saving is what pays for there being enough of them: **more than twice as many trees drawn for the same cost**.
- **Work out the density before building anything.** Total the woodland area first, divide the budget by it, and give every wood the same trees per square metre.
- **Widen the canopies as the woods thin.** Cover is what the eye reads as forest, not stems. Scale crowns by the square root of how far density fell short, and half as many trees half again as wide still reads as a closed wood — canopy cover stays well over 100% of the ground even in a metropolis.

**Scale glades to the wood they are in.** A fixed 7–18 m clearing radius is most of a small forest and all of a tiny one: a 2×2-cell wood is 18 m across, so a single clearing could erase it, and a 5×5 one lost half its trees to two of them. Take the radius as a fraction of the wood's short side, and don't put glades in a wood too small to have one.

Measure this as **trees per cell**, not trees per wood, so sizes compare. Every wood in the city should land within a whisker of the same figure.

### A cathedral gets lancets, not a grid
Gothic glazing is **tall, skinny and pointed, and there is not much of it** — a handful of great lights up a wall, not a punched grid. On a default nave face that is **twelve windows, not a hundred and fifty**: a 7.5 m bay on a 14 m row leaves four to a face and three tiers up the elevation, the aisle windows and the clerestory, each light about 1.7 m wide and 8 m tall — near five to one.

The narrowness alone doesn't do it. Anything on the ordinary 3.6 m storey grid reads as stacked office glazing however thin the openings are; it is the **tall row pitch** that makes it a cathedral wall.

For the point, close the head with a **two-centred arch**: above a springing line at about 62% of the window's height, take the half-width as `sqrt(4 - 3k²) - 1` for k running 0 to 1. That leaves the jamb vertically and meets its opposite number at a sharp apex, which a circular arc does not — an arc arrives at the top tangent to the horizontal and reads as Romanesque.

Express this as a centre-and-half-width test rather than a pair of edge tests, with the springing line sitting at the head for every other style so they collapse back to plain rectangles unchanged.

### Big halls are glazed in bays, not windows
The facade shader punches a grid of individual windows sized for a flat: a 3 m bay on a 3.6 m storey. **A sports megatower, a city hall and a vertical farm must not wear that grid** — at their scale it makes them read as enormous apartment blocks. Give each of them its own slot in the shader with a much coarser grid: roughly a 12 m bay on a 9.4 m storey for the sports hall, a 9 m bay on a 7.6 m storey for the city hall, and a continuous 13 m glazed ribbon per deck for the farm. On comparable facades that takes a building from four hundred windows down to twenty to sixty panels.

Two things to get right:

- **The row pitch has to be the building's own storey height**, not the standard 3.6 m. Leave it fixed and a 9.4 m sports hall wears two and a half rows of flat windows per storey, which is exactly the look being avoided.
- **A bay must be narrower than the building's narrowest facade.** Set the farm's bay wider than its own wall and the whole face falls inside one cell of the grid, so whether that face is glazed at all comes down to where the seed happens to put the phase — some farms glazed, some blank, at random.

Where a building models its own glazing as geometry, only the glazed parts carry the window seed. Plinths, service cores and solid stone get none.

### Schools are campuses
A generated school is **six to ten storeys and thirty to fifty-six cells**, not a hut on the corner — three times the footprint of an ordinary block building, and it spans streets. Two things have to follow, or asking for bigger schools quietly gets you *fewer, smaller* schools instead:

- **Block placement must let a spanning type straddle.** The routine that drops a building inside a block refuses anything wider than a block, so every campus size above five cells silently fails and only the smallest ones ever land. A type that spans streets should be allowed to sit across the block edge into what is next door.
- **Job density has to be recalibrated when the typical size changes.** Capacity is per storey per cell, so a figure tuned for a 4×3×5 school gives a 7×6×10 campus six thousand staff. Leave it and schools alone become **two thirds of the city's jobs** and the whole jobs-per-resident balance goes with them. Aim at a few hundred people per school and check the split by type afterwards, not just the total.

### Every city has certain things, whatever its size
Block recipes only ever *might* place something, so a village can come out with **no school at all**. After the blocks are filled, check and place one if there isn't. The same reasoning applies to anything the city ought to have exactly one of.

### Cathedrals, and plenty of them
**One great church per 50,000 residents, never fewer than three**, each standing over its own quarter rather than all of them crowded downtown. In a grown city they take civic and neighbourhood blocks; in a planned one they go in **the open ground between districts**, which by that point is the only land left with room for a nave. A metropolis ends up with around thirty-five.

Scale them off the same population figure in every layout. A count derived from the size preset instead drifts badly between layouts — one town ending up with ten and another with two.

### The city hall is massive
The biggest civic building in the city: **8×8 cells and fifteen storeys**, about 164 m to the top of the lantern. Try it at full size first and step the size down only if there is genuinely nowhere to put it, so a cramped map gets a smaller one rather than none at all. Every city has exactly one.

### The badge hangs on wall that is actually exposed
Every building wears its symbol on all four walls. The wall it hangs on is the **shaft above the podium**, not the whole facade: the podium is wider than the shaft, so any part of the badge dipping below the podium's top is inside it, and the badge comes out clipped. On a low block the podium is most of the building and the shaft above it is too short to hold a badge at all — a two-storey shop is nothing but podium. In that case hang the badge **on the podium instead**, at the podium's own width.

Size the badge to whichever band it ends up on and keep it inside that band, rather than sizing it to the building and hoping. Get this wrong and it is the small buildings that suffer, which is most of them: every shop in the city, and any hospital under seven storeys.

### Never let two surfaces share a plane
Two faces on the same plane, facing the same way, overlapping in area, will flicker against each other as depth precision picks between them — and it flickers with the camera held perfectly still, which is what makes it look like a fault in the building rather than in the rendering. It is easy to do by accident whenever a part is sized from the same dimension as the part behind it: corner cores flush with the glazing they stand in, a lift overrun flush with the roof band it sits on, a transept exactly as wide as the aisles beside it.

Push one of the two clear of the other by a few centimetres, and prefer the direction that is also architecturally right — a corner pier should stand proud of the glass, a transept should project past the aisles.

**Check this by measuring, not by looking.** Pull the axis-aligned triangles out of the built geometry, group them by plane and facing, and report any two that overlap in area. One caveat: an axis-aligned quad splits into two triangles whose bounding boxes are *each* the whole quad, so comparing triangle bounds makes every quad in the city appear to fight itself — fold the pairs back into quads first.

### Storey height is per type
Most buildings use one floor-to-floor height, but a few are deliberately generous — a sports hall needs the room for a court and the ball above it, a civic hall wants the ceiling. Give the type a storey-height multiplier and route **everything** that asks how tall a building is through one helper: the geometry, the camera's framing distance, the inspector's metre readout and the placement ghost. Multiply by the base storey height anywhere else and a megatower will preview at half its real height and the camera will fly straight through it.

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
- **Cathedral** — 3–6 by 4–10 cells, 8–28 storeys, spanning streets. A full gothic massing: nave with side aisles and lead-roofed lean-tos, a transept crossing, a polygonal apse with its own conical roof, flying buttresses stepping down both flanks, twin west towers with spirelets, a rose window over the west door, and a crossing spire topped with a cross. At the default size it stands about 98 m to the cross. Its windows glow on the residential evening curve, so it lights up beautifully at dusk. They are lancets — see below.

### Tram and subway lines
Two steps, in this order. **First place stops** from the palette like any other object — they auto-orient to the street they land on, and `R` turns them if I want them facing another way. **Then connect them** with the **Draw Tram Line** or **Draw Subway Line** tool: click one stop, then the next, and so on. Stops light up with a highlight column as the cursor comes near, the rubber band snaps to whichever one it would connect, and a click links it. Clicking anywhere that isn't near a stop does nothing but remind me to place one. `Enter` finishes the line.

A panel lists the lines for whichever tool I'm holding, with colour, stop count, and buttons to extend, recolour or delete, plus **Auto-connect** to chain up any stops I've left dangling. Picking up either tool drops me into the transit view and puts the view back when I'm done.

Lines are also objects I can click. With no tool in hand, clicking a tram track — or a subway tube in transit view — selects that line: it lights up white, and a panel shows its stop count, length in kilometres, colour swatches, **Extend** and **Delete**. `Delete` removes it too. Clicking a drag still orbits, so only a click without movement selects.

**Tram track is derived, not painted.** Between consecutive stops the line finds the shortest route through the street grid, and twin tracks are laid along every cell of it. The grass bed takes 8.2 m of a 9 m street, so **nothing else may stand in the corridor**: clear street trees, lamp posts, and the trees that towers and parks scatter onto the pavement out of any cell carrying track. Do this once at the end of the rebuild rather than trying to guard every place that plants something — nothing else knows where the line ended up running, and a tram driving through a tree ruins the illusion instantly. Roof gardens are exempt, obviously. Track begins and ends at a stop — never a metre beyond the last one. It's **green track**: rails set into a grass bed with tufts growing between and beside them, not a grey ballast strip. Trams run the length of their own line and **pause a few seconds at every stop** — long enough for waiting passengers to get on — and longer at each terminus before reversing. They carry **headlamps at both ends** and cast a soft beam on the track ahead of whichever end is leading — see **Night**. The track disappears when the line or its stops do. Subway lines are tunnels, drawn straight between stops.

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
**Apartments, schools and hospitals always get a usable roof garden**, not just a green-painted slab — a little park up there. And **people actually go up and sit on them** — see below. A lawn, a loop of decking just inside the edge, raised planting beds with a tree in each corner, benches facing out, a timber pergola once the roof is big enough, and a low parapet with a rail on top so it reads as somewhere people could actually stand. Everything sits in a ring near the edge, leaving the middle clear for whatever crown the architectural style puts there. Keep it cheap in geometry — a solid parapet band rather than a fence full of posts — because a hundred and fifty of these get built at once. Other low modern and glass blocks still get a plain green roof.

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
- **New City** opens a dialog: map size, city size, **layout**, **density**, or a **blank map** (terrain and water only, dropped straight into Edit mode).
- City sizes are **Village (~18k), Town (~150k), City (~500k), Metropolis (~2 million)** residents — each step is a bit over three times the last. Bigger cities occupy more blocks *and* build taller: a village is mostly 6–18 storey blocks, a town runs to 16–60, a city leans on 32–72, and a metropolis is 40% blocks of 56–72 storeys. Footprints run from about 8 × 7 blocks up to 48 × 33, so a metropolis only reaches full size on the Huge map; on smaller maps it trims to fit and lands proportionally lower.
- Whatever numbers the New City dialog quotes should be **what actually gets built** — calibrate the per-block figure against real generated cities rather than guessing, and re-check it whenever the density mix changes. A dialog that promises 200k and delivers 600k is worse than no estimate at all.

### Density
How hard the city is built, chosen when starting a new one: **Sparse, Medium, Dense, Very dense**. It moves three things together:

- **Height.** Generated buildings scale from about a third of their full storeys at Sparse to full height at Very dense, clamped to each type's legal range. A city's flats average around 9 storeys sparse and 30 dense.
- **How much of each block gets built.** Sparser blocks drop later entries in their recipe in favour of a park or a plaza, so a sparse city has five times the greenery. The first entry always stands — a block is never simply empty.
- **How far the city spreads.** The footprint grows to compensate, so **the population stays where the city size says it should be**: a sparse City is still half a million people, just over three times the ground with low buildings. Tune the spread factor against real generated cities — it is not derivable, and over-shooting it makes sparse cities *bigger* in population than dense ones, which is the wrong way round.

Very dense is the default and is what an untuned generator produces naturally. Warn me in the dialog when a combination gets big enough to be slow to edit — a sparse metropolis is thirteen thousand objects and takes a couple of seconds to rebuild.

### Layout
Three ways to plan the city, chosen when starting a new one:

- **Random** — no planning at all. Every block outside the great park takes whatever zoning it happens to land on, so offices, flats and factories end up shoulder to shoulder. Chaotic on purpose.
- **Standard** — the default described below: business centres by the water, neighbourhoods around them, a blended ring in between.
- **Planned** — the city as a set of repeating parts on a grid rather than something grown. Described in full below.
- **Organized** — proper zoning. Offices are grouped into districts placed at the **inland edge of the footprint, well back from the water**, so the shore stays residential. The office district holds tall towers, some shops, some plazas and parks, **and nothing to live in** — not even flats on a mall roof. Light industry sits out beyond it on open ground. Everything else is residential: apartments, parks, schools, libraries, shops and sports fields.

  Critically, the two are held apart by a **green belt** rather than meeting at a line: a band of woodland, parkland, plazas and playing fields wrapping the office district, with nothing to live in and nothing to work in. Scale the belt to the footprint — a fixed width would swallow half of a small city — so it runs from about a block and a half in a town up to three blocks in a metropolis, and **scale the number of districts to the footprint too**, since each one carries its own belt: a town wants a single large district, not three that between them eat the whole map. The result should be stark next to Standard: an office's nearest block of flats goes from around 30 m away to 90–200 m, with a median separation of 150–300 m, and a metropolis grows from nine patches of woodland to well over a hundred. Organized should cost some population — the belt is real land — but only about 10% in a city, not half of it.

### The Planned layout
Not zoned regions but **repeating parts laid on a grid**, each one self-contained and separated from its neighbours by a block of open ground. A district cell is 6 × 6 blocks with a seventh block of separation, and everything is arranged around one huge central park in the middle of the city.

**The planned city sits on the water like every other layout.** Position the grid against the shoreline rather than in the middle of the terrain: find, for the columns the grid occupies, the last block row that is still solid land, and set the grid's seaward edge there. Centre it on the map instead and a band of empty countryside sits between the last street and the sea, which is the giveaway that nobody thought about where the city actually is. Run a **waterfront promenade** along the join. Done right the nearest buildings come within 60–130 m of the water.

**Homes ring the central park; the office towers go out to the rim** where they don't overshadow it, with the hospitals, malls and the shopping quarter in between. **Claim the housing cells first**, then the offices from the far edge inwards, then everything else in the band between — each use taking only cells that are still free. Assign in any other order and on a map too small for the city the other uses take every cell before the homes get one, leaving a city with nowhere to live.

**A shopping quarter** — one per 120,000 residents, minimum one. A dense knot of shops, three to a block through the middle of the cell, **ringed entirely by green**: woodland, parkland and plazas on every edge block, and **no sports anywhere in it**. A fountain at the centre, often a statue beside it, and most of the shops sharing a style and colour so it reads as one place. About twenty shops within 160 m — far denser than the single shopping block a neighbourhood gets.

**A residential neighbourhood** houses about **10,000 people** and has everything they need without leaving it: **3 schools, 1 library, 1 shopping block**, plenty of parkland, and its own **tournament ground — twelve pitches packed shoulder to shoulder** in one corner. **Every school has a playground, two parks and a soccer pitch on its doorstep**, in the blocks immediately beside it. The whole plan is written once in local coordinates with its apartments along one edge, then **turned so that edge always faces the central park**.

**Each neighbourhood has its own character.** One is a handful of tall towers with green space between them, the next is packed with low blocks, a third mixes the two — and **within a neighbourhood most of the buildings share a style and a colour**, with maybe one in seven breaking the pattern. That is what stops a planned city reading as one texture stamped across the map. Once a neighbourhood is housed, its remaining plots turn green rather than taking more flats, which is what gives the tower neighbourhoods their openness.

**A business district** fills alternate blocks with office towers, the rest going to parks, plazas and shops. Alternating like this matters: a solid field of offices is both too many towers and too dense to read.

**Not everyone works.** Children, students, parents at home and the retired are a large share of any city, so aim at roughly **one job for every two residents**, not one each. Build the homes, schools, shops, hospitals and malls first, count the jobs they already provide, and size the office towers to whatever is left over — that is the only way to land near the target, and it takes a town from forty-odd office towers down to under ten.

**A factory district**, sited **outside the grid entirely** — a full district beyond the inland edge, well away from both the housing and the water — with a dozen large works laid out in rows and woodland around them. Put it inside the grid and the nearest homes are one street away.

**The central park** is the city's one great feature: **one continuous forest** most of a kilometre across, not a patchwork. That distinction is the whole thing — lay it out as a grid of very large spanning woods that swallow the streets underneath them, and **make each piece exactly as wide as the grid step** so neighbouring woods meet edge to edge. Leave a one-cell seam between them and a footpath appears around every single patch, which is what makes it look like allotments instead of a wood. Anything under about ten cells across fails to cover a street line at all, so never fill gaps with small pieces — better to leave a glade.

About one tile in ten is a **clearing** instead of trees: a fountain, a statue, a playground or a pitch, with a bit of lawn. Those, plus the seams the big pieces couldn't reach, are the few paths through the wood — roughly a third of the streets inside the park survive, which is about right.

The park also holds **one big lake, around 10 × 6 cells**, and the **Great Arch at about 80 storeys** so it is visible from anywhere in the city. Place the lake and the arch *first*: once the woods are in there is nowhere left to put them. The arch is not a street-spanning type, so it can be at most a block wide — ask for six cells and it will silently never appear.

Ring the whole park with a **walking path on the street immediately around it and a cycle path one block further out**.

Forests generally should be **densely** planted, and the city-wide tree limit has to be high enough not to quietly drop most of them.

**One major hospital and one regional shopping mall per 100,000 residents**, each on its own cell with green space around it. **One sports megatower per 250,000** in the business districts, **one vertical farm per 120,000** by the works and among the offices, **a cathedral per 50,000** in the gaps between districts, and **the city hall** on the edge of the central park.

All of those are spanning types wanting several clear blocks, so they must take their ground **before the office towers fill the business districts**. Place them afterwards and there is never a gap big enough left, and none of them ever appear. Doing it in this order also means their jobs are counted when the offices are sized, so the towers shrink to match.

**The ground between districts is woodland**, not bare grass — fill the separating blocks with trees once the transit is down, so the routes still find their cells.

**Transit runs in the gaps, never through a neighbourhood.** A tram follows every separating strip that doesn't cross the park, so nowhere is more than one gap from a stop — about three stops per neighbourhood — with bike routes on the strips between them. Subway stations serve every business district and every third neighbourhood. **Both trams and bikes route around the central park** rather than across it.

Sizing follows from the parts: a Town of ~150,000 comes out as **15 neighbourhoods, 4 business districts, a factory district, a shopping quarter, 2 hospitals, 2 malls** and the central park, over about 2.3 × 1.9 km. Planned cities are much bigger on the ground than grown ones — a planned City needs the Huge map. Where the map can't hold everything, **scale the three uses down together**, and **clamp the central park** so it can't swallow a small grid entirely; get either wrong and a city ends up with nowhere to live.

Watch the geometry budget: a planned city has ten times the pitches of a grown one. A five-by-two kickabout court is not a running track and does not need four floodlight masts — size those down, or the tournament grounds alone will double the city's vertex count.

### Sports complexes
Standard and Organized cities both get **tournament-grade sports complexes: one for every 250,000 residents, and always at least one**, even in a village. A complex is a reserved patch of ground — up to four blocks by three — tiled with a **two-by-two grid of full-size Sports Parks**, each with its own track, pool, courts and floodlights, plus pitches and a gathering plaza squeezed into the gaps. Somewhere you could run a weekend kids' tournament across several fields at once.

Reserve the ground during zoning, before anything else is placed, so the rest of the city builds around it. Claim the biggest sites first and only fall back to smaller ones if the town has no room, size the parks so they tile the site exactly two across and two deep, keep complexes in different quarters of the city rather than letting them merge into one, and site them towards a flank and well back from the shore — sports parks span streets, so they need space the waterfront doesn't have. Random cities get none; the whole point of Random is that nobody planned anything.

- A generated city has real structure:
  - A footprint hugging the wavy coastline, with open country beyond it on all other sides.
  - **Neighbourhoods** — apartments, schools, libraries, shops, local parks and plazas. No office towers.
  - **One to three business centres** near the water: office towers and plazas, with the Megatower and Spire among them, the **City Hall** on a civic block, plus a mixed ring of hospitals and taller flats around the edge.
  - **Cathedrals across the quarters**, one per 50,000 residents and at least three.
  - **One sports megatower**, and another for a city and again for a metropolis; **vertical farms** scaling with the population.
  - **A megapark** spanning several whole blocks, Central Park style — the streets crossing it become meandering footpaths instead of pavement, and it holds one or two animated lakes, sports fields, patches of woodland, the Great Arch, and a **Fountain** and **Statue** among the greenery.
  - A light-industrial edge of factories on one flank, and woodland out beyond the last streets.
  - A waterfront promenade along the shore, and a walking street behind it.
  - Tram and bike corridors linking the centres to the neighbourhoods, and a handful of subway stops.

## Simulation & emergence (the heart of it)
- **Population** derives from housing: residents scale with storeys × footprint, so a 48-storey 3×3 tower is a thousand-plus people. Show the true total in the HUD, along with jobs and how many people are out and about right now.
- **Rendered agents** are a representative animated *sample*, each standing for however many residents that works out to. The stats always reflect everyone, whatever the sample size.
- **Crowd density is mine to choose** — **Light / Medium / Heavy / Very heavy** in the HUD. Medium is roughly one figure per 16 residents; Light is about a third of that, Heavy about double, Very heavy about triple. The streets should feel properly busy at Medium, not sparse. Changing it re-seeds the population immediately and reports the new figure count.
- **Give each density setting its own share of the figure ceiling** — a quarter, a half, three quarters, all of it — rather than one shared cap. With a single cap, any city past a few hundred thousand people pins the top three settings to the same number and the control silently stops doing anything. With per-setting shares the four are always visibly different, while small cities stay properly proportional to their population. The ceiling itself is what performance allows: 32,000 figures costs about three quarters of a 60fps frame in agent updates alone, so that is the honest limit, and Very heavy is the setting that spends it.
- **Figure size is mine to choose too** — a slider from 0.4× to 2.4×, defaulting to 1×. At 1× the little people are deliberately a bit under life-size, which reads better at normal city zoom; crank it up if I want to pick individuals out of a crowd.
- Agents follow a **daily schedule** that produces natural rhythms without me scripting anything:
  - **Night:** most people home; homes lit until ~23:00; streets genuinely empty around 3–5 am.
  - **Morning (~6–9):** commute to work and school; transit and paths get busy; sunrise.
  - **Midday:** people mostly inside; parks lightly used.
  - **Lunch (~12–1:30):** people spill out to nearby plazas, parks and the waterfront — visible crowding, and the busiest moment of the day.
  - **Evening commute (~5–7):** flow home; golden hour.
  - **Evening (~7–9):** a minority head back out to parks, promenades and sports fields — a second, smaller peak at dusk. Nearly everyone is indoors by 22:00, bar a few night owls out until ~23:30.
### On the roof
Residents don't just disappear into their buildings. **Some of them go up and hang out on the roof garden** — most often in the evening, a few with a morning coffee — and stand about up there for anything from half an hour to a couple of hours before going back inside.

They only ever go up from home, only if their block actually has a roof deck, and they come straight down if the day pulls them away to work or anywhere else. Record the deck height on the building when you build the garden (including any lift from sitting on a mall roof) and give agents their own height rather than pinning everyone to the ground, so a figure on a fiftieth-floor terrace is drawn a hundred and eighty metres up. Keep them inside the parapet and out of the middle, where the lift housing and the style's crown are. They count as being out and about.

**You can click one and ride along from up there**, looking out over the city from a fiftieth-floor terrace. For that to work the click test has to aim at where the figure actually is — pin it to ground level and everyone on a roof becomes unclickable, and clicks meant for them land on whoever happens to be walking past below. Open the shot at their real height too, or the camera starts on the pavement and climbs. The caption should say they're up on the roof.

### Games
Sports venues don't just accumulate visitors — they **host games**. A game runs for **twenty minutes to an hour**, has room for a fixed number of players and a crowd to watch them, and everyone leaves together when it finishes. About half of residents have a sport habit and get one window a day to look for a game, weighted to the morning and the evening.

**How many venues have a game on at once** follows the clock and the population: almost nothing between midnight and six, busy from seven to half nine, quieter through the middle of the day, busiest from half five to half eight, winding down by ten. More people per venue means more of them in use at any one time. Cap the total so games never commit more than about a third of the visible crowd.

**Squad sizes by sport:**

| Venue | On the pitch | Watching |
|---|---|---|
| Soccer | 10 small pitch, 15 big | 10–20 |
| Tennis | 4 per court | 10 |
| Basketball | 10 | up to 30 |
| Athletics | 30 | 10 |
| Swimming pool | 10 in the water | up to 40 |
| Sports park | 30 | 25 |

**Players work the playing surface and the crowd rings the edge of the plot** — players roam at a jog with barely a pause, watchers stand around the outer edge for many seconds at a time. That contrast is most of what makes it read as a game rather than a crowd. Let a venue declare where its playing surface actually is rather than assuming it's the middle of the plot: a pool's water sits off to one side of its deck, and swimmers belong in the water.

**Cyclists don't play.** They would ride the bike onto the pitch. Decide who is sporty *after* deciding who cycles — get that order wrong and the exclusion silently does nothing, because the flag you're testing doesn't exist yet.

The subtle part: **a game's clock starts when the first player arrives, not when it is scheduled**, and it keeps running while people are still turning up, to a hard limit of a few times its nominal length. Start the clock on the whistle instead and at fast clock speeds — where walking across town takes many simulated hours — every game is over before the second player has crossed the street, and the pitches stay permanently empty. Give a scheduled game a few hours to attract anybody at all before abandoning it and freeing the venue.

**Recruit locally, and pace it.** Two rules keep the number a venue reports close to the number of figures standing on it:

- Only join a game you can reach promptly — about 500 m at real time, **shrinking as the clock speeds up**, because at 600× a radius that is a five-minute stroll becomes an epic trek in simulated time. Tested at 600×, a 180 m radius produced sixteen games in play with people on the pitches; 310 m and 520 m produced *none at all* — everybody signed up and nobody ever arrived.
- Only so many people at a time may be walking to any one venue, scaled to its size. Otherwise a venue fills its whole roster in one instant from every direction and reads "30 attending" while the pitch stands empty for the entire game.

Hovering a venue with a game on says **how many are actually there**, and how many are still on their way — not the roster. If those two numbers can differ, show both; a count that describes people who are three streets away is the thing that made this feel broken in the first place.
- **Some people cycle, and you can see the bikes.** About a quarter of residents are cyclists, drawn from their own instanced mesh — a rider pitched forward over a frame, wheels and handlebars — with the bike baked dark so it stays a bike whatever colour its owner is wearing. A cyclist **rides door to door on every trip**, whatever the distance; they don't park up and get on a tram. Everyone else walks the short trips and takes transit for the long ones. Give walkers and cyclists fixed slots in their respective meshes so instance colours can be set once rather than every frame, and re-write those matrices whenever the crowd is re-seeded — otherwise a paused game keeps drawing the previous occupants of each slot.
- **Nobody moves at exactly the same speed.** Roll pace twice and average, so most people are near the middle and a few are notably brisk or dawdling: walkers land between about 0.5 and 1.0 m/s, cyclists between 2.3 and 3.1 — roughly three and a half times a walker. Pace belongs to the person, not to the kind of path they're on.
- **Mode choice** by trip distance for everyone who isn't a cyclist: short trips walk, longer trips take tram or subway. Agents route over a lattice of street intersections with cached A* — tram and bike links are derived from the infrastructure I actually placed, and subway riders vanish underground and pop out at the far station. Prioritize visual plausibility over perfect routing; fall back to a straight walk if no route exists.
- **People actually catch the tram.** A router that says "ride from here to there" is not enough — a line of pedestrians gliding along the rails at tram speed looks absurd. Cut a transit trip into legs: **walk to a stop, stand on the platform until a tram of the right line pulls in going the right way, board it, ride inside, and step off at the far stop**, then walk the rest. Passengers are visible while they wait — clusters of people at a stop is one of the nicer things to watch — and hidden while aboard, since they are inside a solid vehicle. Slice the walking legs out of the original route rather than re-planning them, so any subway portion of the journey survives.

  Trams need to report which stop they are currently dwelling at, and passengers need to check the direction before boarding, or half of them will ride away from where they are going. Give each tram a seat limit so a full one leaves people for the next. If nothing comes after a few minutes, or the line is redrawn out from under a passenger, they give up and walk the rest from wherever they are — never leave someone stranded on a platform.

  **Run trams at the same time compression as everyone else.** Holding them to a lower ceiling looks calmer in isolation, but once people depend on them the service falls behind the passengers and the platforms never clear. At real time expect a median platform wait of about 20 seconds; put enough vehicles on each line that a long route runs a proper service rather than one tram shuttling back and forth.
- **People route the way people would.** Each lattice edge is classified by what actually runs along it — tram track, walking path, bike lane, a street through parkland, or plain pavement — and each travel mode weights those differently. On foot I should prefer a walking path, then a park street, then a bike lane, over bare pavement, and **actively avoid tram track**: the green rail bed fills nearly the whole street, so it's somewhere to cross, not somewhere to stroll. Cyclists stick to bike lanes and avoid the track too. Only tram *passengers* travel along a tram line. Laying tram track itself ignores all these preferences and just takes the shortest street route between stops.
- **A node pair can carry several parallel edges** — a street, a bike lane, and a tram line laid over the top. When labelling the segments of a chosen route, report the edge that traveller would actually have used, not simply the first one found. Getting this wrong makes tram passengers render as a long file of pedestrians trudging down the middle of the track, which is the single most immersion-breaking thing the sim can do.
- **How fast someone looks like they're moving depends on their mode, not the ground under them.** A pedestrian crossing a tram corridor or a cycleway still walks at walking pace; only a rider on a tram or subway gets transit speed.
- **Lateral position across the corridor matters too.** Pedestrians on a tram street hug the kerb well clear of the rails, cyclists ride the middle of their own lane, and tram passengers sit right on the rail line so they read as being aboard the vehicle.
- **Movement is calibrated to real time.** At 1× a walker covers a little under a metre a second — an unhurried stroll — a cyclist about 2.7 m/s, and a tram about 40 km/h. Faster clock speeds scale movement up by the square root of the multiplier, so people hurry without teleporting: roughly 0.7, 5.7 and 18 m/s at 1×, 60× and 600×, which is a visibly different pace at each setting.
- Any ceiling on that scaling **must sit above the fastest speed setting**, or the top two look identical — a cap of 8 makes 60× and 600× the same walking pace, because both √60 and √600 clamp to it. Whenever the speed options change, re-check the ceiling. Trams follow the same curve, so at high speeds they cross several waypoints per frame: check **every** waypoint crossed, not just the first, or they sail straight past their stops and leave passengers stranded on the platform.
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

**Orbit around what I've selected, not the middle of the city.** Clicking a building makes it the pivot: the camera glides so it sits at the centre of the screen, and every drag after that turns about it. Aim the pivot a little way up a tall tower — a third of its height, capped — so orbiting a skyscraper doesn't sweep the ground at its feet, and drop back to ground level when I deselect. **View mode can hold a selection too**: clicking something there picks it out with the same outline and the same pivot, but the panel is read-only — it names the thing and tells me how to let go, with nothing to edit. Clicking open ground releases it. The selection survives switching between View and Edit.

In View mode a click has to choose between a person, a tram and a building. Try vehicles and people first, but **only look for individual people when the camera is close enough to see them** — from across the city a click meant for a tower will otherwise grab some passer-by standing in front of it.

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

### Undo
**`Ctrl+Z` and an Undo button**, with `Ctrl+Shift+Z` / `Ctrl+Y` to redo. It covers every change to the city: placing, moving, rotating, resizing, restyling, deleting, drawing and deleting transit lines, auto-connecting stops, clearing the city — and **starting a whole new city or loading a file**, which is the case where losing work actually hurts.

The city already knows how to describe and restore itself for save/load, so build undo on that rather than inventing a per-action inverse: take a snapshot before each change and restore it wholesale. Snapshots cost well under a millisecond even on a big city, so taking one per action is free.

Three things this gets wrong if you're not careful. **Group bursts** — dragging a storeys slider fires dozens of events and must be one undo step, not forty; key each snapshot by what's being changed and skip repeats within about a second. **Don't rebuild twice** — restoring a city already triggers a rebuild, and a second one doubles the cost of every undo. **Don't move the camera** — the snapshot contains the viewpoint, but undo should restore the city and leave me looking exactly where I was. Keep fewer snapshots the bigger the city gets, so history doesn't quietly eat hundreds of megabytes.

**Focus view — the HUD counts are the filter.** Every count in the top-left panel is a button. Click **63 Libraries** and every library in the city keeps its full colour while everything else washes out to a pale ghost, so I can see at a glance where they are and where the gaps are. Above the counts sits a row of category chips — **Housing, Work, Civic, Green, Transit, Landmarks** — that do the same for a whole category, and the **Residents** and **Jobs** figures highlight everywhere people live and everywhere they work. Clicking the active one again, or `Esc`, brings the city back.

Build it as a per-vertex flag baked into the merged geometry during the rebuild, with one uniform to switch the effect on — not as a per-object material, which would wreck the batching. Unfocused fragments desaturate hard and drop to around a tenth alpha; focused ones get a slight lift so they read as brighter, not merely less faded. **Streets and tram track always stay lit** so the highlighted things still sit in a readable city, and foliage follows its owner, because a park's trees are the whole point of highlighting parks. Picking up a palette tool drops the focus — you shouldn't be building into a faded-out city.

**Fading the rest is not enough on its own.** In a dense city a few dozen highlighted shops are still lost among the towers. Give every focused object **a column of light rising past its roof with a marker floating above it, drawn through everything else** — depth testing off, so you can pick them out from any angle even when the object itself is hidden behind a block. Slow-pulse the whole set so the eye catches them. Thin the columns down as the number of matches goes up, so highlighting six landmarks gives six fat beacons and highlighting five hundred flats gives a legible forest rather than a wall.

**Transit view** (`M`, or the Transit category chip, or any transit count) shows every way people get around, over a city faded to about a tenth opacity:
- Tram lines as ribbons in their own line colours, with the trams still running, plus bike and walking paths as ribbons at slightly different heights so overlaps stay readable.
- Subway lines as coloured tubes — one colour per line, stacked slightly so parallels read — with tunnel traces on the ground, pillar-and-beacon markers at each stop, bigger white caps at interchanges, and grey markers for stops not yet on a line.
- A legend naming the four colours.

While it's on, the view is a transit editor: only transit objects can be hovered, selected or edited, non-transit palette entries dim, and choosing one of them drops back out of the view. The transit view and the focus view are mutually exclusive — entering one leaves the other. One place should own the material state for both, because toggling transparency recompiles shaders and the two settings will otherwise fight each other.

## HUD
A clean, unobtrusive overlay: the am/pm clock and time of day, total residents, jobs and people outside, a category strip, a clickable count for **every** kind of thing in the city plus tram and bike kilometres, a mode toggle, Undo, Flyby, New City, and Save / Load. There is **no Transit button** — the transit map is reached from the Transit category chip, any transit count, or `M`.

The bottom-right panel stacks two rows: **time** (pause / 1× / 60× / 600×, hour slider, reset view) above **people** (Light / Medium / Heavy / Very heavy density, and the figure-size slider with its multiplier shown). Minimal and pretty — glass panels, tabular numbers, nothing shouting.

## Save & load
- Save to a JSON file I can download: map size, seed, clock, camera, the layout and density it was generated with, my people size and crowd settings, every subway line, and every object with its stable id, position, rotation, storeys, footprint, colour, style, sport and layer. Load by picking a file back — including one saved on a different map size.
- Autosave to localStorage so a refresh doesn't lose my city.

## Non-goals (keep it a joyful sandbox)
No money/budget, no utilities (power, water, sewage), no pollution or traffic-failure sims, no disasters, no win/lose or failure states, no obstacle-course tutorial. This is a relaxing toy for prototyping ideas and enjoying the result — nothing to manage and nothing to lose.

## Definition of done
It opens (or serves) and immediately shows a living, green, car-free city beside water with people moving at a believable walking pace, and roof gardens on every block of flats. The clock runs in real time, or at 60× or 600× when I want to watch a whole day go by, and shows visibly different rhythms — morning commute, a lunchtime crowd, an evening game, offices going dark by 9pm and flats by 11, lit paths and tram headlights crossing a quiet city at midnight. I can dial the crowd from Light to Very heavy and the figures from tiny to oversized. Clicking any count in the HUD spotlights just that kind of thing across the whole city. I can toggle view/edit, move the camera around easily, place anything anywhere — including a sports park, a statue, a fountain and a cathedral — tune its height, footprint, colour and architectural style, stack flats on a mall, run a path through a forest, draw my own subway lines and flip to the metro map, start a fresh city at any size, in any of the three layouts, or from a blank map, and save/load to a file. Whatever I pick, there is always somewhere for the kids to play a tournament. And when I have finished building, I can hit Flyby and just watch the place, or click one of the little people and walk their commute with them. It looks beautiful and calm and makes me want to keep watching. You have creative latitude on execution and procedural details — use it to maximize beauty and that feeling of *"I made this, but I couldn't have designed it exactly."*
