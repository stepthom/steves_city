/* Steve's City — journey planner test suite.
 *
 *   npm install          # once, pulls playwright + three
 *   npx playwright install chromium
 *   npm test             # fast: routing + quote invariants (~30s)
 *   npm run test:timing  # also runs end-to-end watched-journey timing (~2-3 min)
 *
 * Tests drive the REAL routing code in ../index.html through the window.__city
 * debug hook. See setup.cjs for how the page is booted offline.
 */
const { boot } = require('./setup.cjs');

/* ---- tiny test harness --------------------------------------------------- */
let passed = 0, failed = 0;
const fails = [];
function check(name, cond, detail){
  if(cond){ passed++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { failed++; fails.push(name); console.log('  \x1b[31m✗ ' + name + '\x1b[0m' + (detail ? '  → ' + detail : '')); }
}
const approx = (a, b, tol) => Math.abs(a - b) <= tol;

(async () => {
  const { page, close, errors } = await boot({ loadCity: true });
  try {
    /* =====================================================================
       1. Boot cleanly, saved test city loaded
       ===================================================================== */
    console.log('\nBoot & load saved test city');
    const bootInfo = await page.evaluate(() => {
      const c = window.__city;
      return { objs: c.state.objects.length, lines: c.state.lines.length,
               tramPaths: (c.G.tramPaths||[]).length, metroPaths: (c.G.metroPaths||[]).length };
    });
    check('page boots without console/page errors', errors.length === 0, errors.slice(0,3).join(' | '));
    check('saved city has objects and transit lines', bootInfo.objs > 0 && bootInfo.lines > 0, JSON.stringify(bootInfo));

    /* =====================================================================
       2. Planner invariants across many pairs on a generated city
       ===================================================================== */
    console.log('\nPlanner invariants (generated city, 250 random pairs)');
    const inv = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      c.generateCity(20260817);                       // deterministic
      const routable = S.objects.filter(o => o._node !== undefined && o._node >= 0 &&
        ['building','green','landmark'].includes(c.TYPES[o.type].kind));
      let seed = 7; const rnd = () => { seed = (seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
      const pick = () => routable[Math.floor(rnd()*routable.length)];
      const bugs = {};
      const bump = (k) => bugs[k] = (bugs[k]||0)+1;
      let routes = 0;
      for(let t=0; t<600; t++){
        const A = pick(), B = pick(); if(!A||!B||A===B) continue;
        c.trip.a = A; c.trip.b = B;
        let R; try { R = c.tripPlan(); } catch(e){ bump('THROW'); continue; }
        if(!R) continue;
        for(const mk of ['walk','bike','tram','subway']){
          const r = R[mk]; if(!r) continue; routes++;
          if((r.pk||[]).length !== r.pts.length-1) bump('pk_length');
          if(!approxJS(r.onFoot+r.riding+r.waiting, r.total, 1)) bump('total_vs_components');
          const ss = (r.steps||[]).reduce((s,x)=>s+(x.secs||0),0);
          if(!approxJS(ss, r.total, 1.5)) bump('steps_sum_vs_total');
          for(const key of ['total','onFoot','riding','waiting','dist'])
            if(!isFinite(r[key]) || r[key] < -0.001) bump('bad_'+key);
          for(const p of r.pts) if(!isFinite(p[0])||!isFinite(p[1])){ bump('nan_point'); break; }
          for(const rd of (r.rides||[])) if(!rd.board||!rd.off||!(rd.to>rd.from)) bump('bad_ride');
          if((mk==='tram'||mk==='subway') && !(r.rides&&r.rides.length && r.boards>0)) bump('rail_without_ride');
        }
      }
      function approxJS(a,b,tol){ return Math.abs(a-b)<=tol; }
      return { routable: routable.length, routes, bugs };
    });
    check('pairs planned & routes produced', inv.routes > 200, JSON.stringify({routable:inv.routable, routes:inv.routes}));
    check('pk arrays length == pts-1',            !inv.bugs.pk_length,          'x'+(inv.bugs.pk_length||0));
    check('total == onFoot+riding+waiting',       !inv.bugs.total_vs_components,'x'+(inv.bugs.total_vs_components||0));
    check('sum(step secs) == total (Bug 1)',      !inv.bugs.steps_sum_vs_total, 'x'+(inv.bugs.steps_sum_vs_total||0));
    check('no NaN/negative fields or points',     !inv.bugs.nan_point && !Object.keys(inv.bugs).some(k=>k.startsWith('bad_')), JSON.stringify(inv.bugs));
    check('every ride record valid (board/off/order)', !inv.bugs.bad_ride, 'x'+(inv.bugs.bad_ride||0));
    check('rail routes always contain a real ride',    !inv.bugs.rail_without_ride, 'x'+(inv.bugs.rail_without_ride||0));
    check('planner never throws',                 !inv.bugs.THROW, 'x'+(inv.bugs.THROW||0));

    /* =====================================================================
       3. Bug 2 regression — tram ride follows the track, not the crow-line
       ===================================================================== */
    console.log('\nBug 2 — tram ride distance = track length (saved city, office → apartment)');
    const b2 = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      c.applyCity(JSON.parse(JSON.stringify(window.__savedCity)));  // reload saved city
      const office = S.objects.find(o=>o.type==='office'), apt = S.objects.find(o=>o.type==='apartments');
      c.trip.a = office; c.trip.b = apt;
      const r = c.tripPlan().tram; if(!r) return {noTram:true};
      const rd = r.rides[0];
      const straight = Math.hypot(rd.board._cx-rd.off._cx, rd.board._cz-rd.off._cz);
      const line = S.lines.find(L=>c.modeOf(L)==='tram'&&L.stops.includes(rd.board.uid)&&L.stops.includes(rd.off.uid));
      const path = (c.G.tramPaths||[]).find(p=>p.li===S.lines.indexOf(line));
      const at = uid => path.pts.findIndex(w=>w.uid===uid);
      const lo = Math.min(at(rd.board.uid),at(rd.off.uid)), hi = Math.max(at(rd.board.uid),at(rd.off.uid));
      let track=0; for(let i=lo+1;i<=hi;i++) track+=Math.hypot(path.pts[i].x-path.pts[i-1].x,path.pts[i].z-path.pts[i-1].z);
      let drawn=0; for(let i=1;i<r.pts.length;i++) drawn+=Math.hypot(r.pts[i][0]-r.pts[i-1][0],r.pts[i][1]-r.pts[i-1][1]);
      return { straight, track, routeDist: r.dist, drawn, riding: r.riding, trackSecs: track/11.5+9+2 };
    });
    if(b2.noTram) check('tram route exists between office and apartment', false, 'no tram route');
    else {
      check('track is longer than the straight stop gap (bent)', b2.track > b2.straight + 1,
            `track ${Math.round(b2.track)} vs straight ${Math.round(b2.straight)}`);
      check('ride time quoted from track length', approx(b2.riding, b2.trackSecs, 1.5),
            `riding ${Math.round(b2.riding)} vs track ${Math.round(b2.trackSecs)}`);
      check('reported route distance ≈ polyline drawn on map (±60m)', approx(b2.routeDist, b2.drawn, 60),
            `reported ${Math.round(b2.routeDist)} vs drawn ${Math.round(b2.drawn)}`);
    }

    /* =====================================================================
       4. Bug 1 regression — first-boarding wait is the boarded line's wait
       ===================================================================== */
    console.log('\nBug 1 — rail total agrees with its own step list (saved city)');
    const b1 = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      const office = S.objects.find(o=>o.type==='office'), apt = S.objects.find(o=>o.type==='apartments');
      c.trip.a = office; c.trip.b = apt;
      const out = {};
      for(const mk of ['tram','subway']){
        const r = c.tripPlan()[mk]; if(!r){ out[mk]=null; continue; }
        const waitSteps = (r.steps||[]).filter(s=>s.k==='wait').reduce((s,x)=>s+x.secs,0);
        const allSteps  = (r.steps||[]).reduce((s,x)=>s+(x.secs||0),0);
        out[mk] = { waiting: r.waiting, waitSteps, total: r.total, allSteps };
      }
      return out;
    });
    for(const mk of ['tram','subway']){
      const r = b1[mk];
      if(!r){ check(mk+': route exists', false); continue; }
      check(mk+': waiting == sum of wait steps', approx(r.waiting, r.waitSteps, 0.6), `${Math.round(r.waiting)} vs ${Math.round(r.waitSteps)}`);
      check(mk+': total == sum of all steps',    approx(r.total, r.allSteps, 1), `${Math.round(r.total)} vs ${Math.round(r.allSteps)}`);
    }

    /* =====================================================================
       5. "No route" is an honest answer
       ===================================================================== */
    console.log('\nNo-route correctness');
    const nr = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      c.applyCity(JSON.parse(JSON.stringify(window.__savedCity)));
      const office = S.objects.find(o=>o.type==='office'), apt = S.objects.find(o=>o.type==='apartments');
      const savedLines = S.lines.slice(), savedObjs = S.objects.slice();
      // no transit lines at all
      S.lines = []; c.buildGraph();
      c.trip.a=office; c.trip.b=apt; const noLines = c.tripPlan();
      // restore lines, remove bike paths
      S.lines = savedLines; S.objects = savedObjs.filter(o=>o.type!=='bike'); c.buildGraph();
      const noBike = c.tripPlan();
      S.objects = savedObjs; c.buildGraph();
      return {
        noLines: { walk: !!noLines.walk, tram: noLines.tram, subway: noLines.subway, why: noLines.why },
        noBike:  { walk: !!noBike.walk, bike: noBike.bike, whyBikeNull: noBike.bike===null },
      };
    });
    check('no lines → walk still routes',        nr.noLines.walk);
    check('no lines → tram returns none',        nr.noLines.tram === null && nr.noLines.why.tram === 'none');
    check('no lines → subway returns none',      nr.noLines.subway === null && nr.noLines.why.subway === 'none');
    check('no bike paths → bike returns null',   nr.noBike.whyBikeNull);
    check('no bike paths → walk still routes',   nr.noBike.walk);

    /* =====================================================================
       6. Zero-length walk (a stop right outside the door)
       ===================================================================== */
    console.log('\nZero-length walk is a valid walk, not "no path"');
    const zw = await page.evaluate(() => {
      const c = window.__city;
      const w = c.walkPath(100, 100);              // same node both ends
      return w && w.dist === 0 && w.secs === 0 && Array.isArray(w.pts) && w.pts.length === 1;
    });
    check('walkPath(n, n) returns a zero-length path (not null)', zw);

    /* =====================================================================
       7. Route continuity — no absurd gaps on walk/bike segments
       ===================================================================== */
    console.log('\nRoute continuity (walk/bike segments have no large gaps)');
    const cont = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      c.generateCity(424242);
      const routable = S.objects.filter(o => o._node!==undefined && o._node>=0 &&
        ['building','green','landmark'].includes(c.TYPES[o.type].kind));
      let seed=3; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
      let worstWalk=0;
      for(let t=0;t<150;t++){
        const A=routable[Math.floor(rnd()*routable.length)], B=routable[Math.floor(rnd()*routable.length)];
        if(!A||!B||A===B) continue;
        c.trip.a=A; c.trip.b=B; const R=c.tripPlan(); if(!R) continue;
        for(const mk of ['walk','bike']){
          const r=R[mk]; if(!r) continue;
          for(let i=1;i<r.pts.length;i++){
            const k=(r.pk||[])[i-1];
            if(k==='tram'||k==='trunk'||k==='subway') continue;   // straight track/tunnel exempt
            const g=Math.hypot(r.pts[i][0]-r.pts[i-1][0], r.pts[i][1]-r.pts[i-1][1]);
            if(g>worstWalk) worstWalk=g;
          }
        }
      }
      return { worstWalk };
    });
    // lattice pitch is ~54 m; a legit walk segment is one lattice edge plus door approach
    check('largest walk/bike segment gap is sane (< 120 m)', cont.worstWalk < 120, 'worst ' + Math.round(cont.worstWalk) + ' m');

    /* =====================================================================
       8. Subway/tram system types — random / full grid / ring-radial
       ===================================================================== */
    console.log('\nTransit system types (random / grid / ring-radial)');
    const sysGen = await page.evaluate(() => {
      const c = window.__city, S = c.state;
      const modeCount = m => S.lines.filter(L => c.modeOf(L) === m).length;
      const gen = (sub, tram, size) => {
        c.generateCity(31337, size === undefined ? 2 : size, 'standard', 'verydense', sub, tram);
        return { sub: S.subwaySys, tram: S.tramSys, subLines: modeCount('subway'),
                 tramLines: modeCount('tram'), cov: c.netCoverage().frac };
      };
      const out = { combos: {}, scale: {}, routes: {}, saveLoad: null };
      // every combination generates, keeps its choice, and covers the city
      for(const sub of ['random','grid','ring']) for(const tram of ['random','grid','ring'])
        out.combos[sub + '/' + tram] = gen(sub, tram);
      // grid gets finer as the footprint grows
      out.scale.gridVillage = gen('grid','grid',0).subLines;
      out.scale.gridMetro   = gen('grid','grid',3).subLines;
      // journeys route on both new networks without breaking invariants
      for(const sys of ['grid','ring']){
        gen(sys, sys);
        const routable = S.objects.filter(o => o._node!==undefined && o._node>=0 &&
          ['building','green','landmark'].includes(c.TYPES[o.type].kind));
        let seed=5; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
        let planned=0, railRoutes=0, issues=0;
        for(let t=0;t<80;t++){
          const A=routable[Math.floor(rnd()*routable.length)], B=routable[Math.floor(rnd()*routable.length)];
          if(!A||!B||A===B) continue;
          c.trip.a=A; c.trip.b=B; let R; try{R=c.tripPlan();}catch(e){issues++;continue;}
          if(!R) continue; planned++;
          if(R.subway||R.tram) railRoutes++;
          for(const mk of ['walk','bike','tram','subway']){ const r=R[mk]; if(!r) continue;
            if((r.pk||[]).length!==r.pts.length-1) issues++;
            const ss=(r.steps||[]).reduce((s,x)=>s+(x.secs||0),0);
            if(Math.abs(ss-r.total)>1.5) issues++;
            for(const p of r.pts) if(!isFinite(p[0])||!isFinite(p[1])){issues++;break;}
          }
        }
        out.routes[sys] = { planned, railRoutes, issues };
      }
      // the choice survives a save/load round-trip
      gen('ring','grid');
      const saved = c.serialise();
      c.generateCity(1, 1, 'random', 'sparse', 'random', 'random');
      c.applyCity(saved);
      out.saveLoad = { savedSub: saved.subSys, savedTram: saved.tramSys,
                       loadedSub: S.subwaySys, loadedTram: S.tramSys };
      return out;
    });
    // every combo builds, honors the choice, and meets the ≥90% access standard
    let combosOk = true, combosBad = '';
    for(const [k, r] of Object.entries(sysGen.combos)){
      const [wantSub, wantTram] = k.split('/');
      const ok = r.sub === wantSub && r.tram === wantTram &&
                 r.subLines > 0 && r.tramLines > 0 && r.cov >= 0.90;
      if(!ok){ combosOk = false; combosBad += ` ${k}:${JSON.stringify(r)}`; }
    }
    check('all 9 subway×tram combinations build, keep their choice, cover ≥90%', combosOk, combosBad.trim());
    check('grid gets finer with map size (metro > village)', sysGen.scale.gridMetro > sysGen.scale.gridVillage,
          `village ${sysGen.scale.gridVillage} vs metro ${sysGen.scale.gridMetro} subway lines`);
    for(const sys of ['grid','ring']){
      const r = sysGen.routes[sys];
      check(sys + ': journeys route with no invariant issues', r.issues === 0 && r.planned > 40,
            `planned ${r.planned}, rail ${r.railRoutes}, issues ${r.issues}`);
    }
    check('system choice survives save/load', sysGen.saveLoad.loadedSub === 'ring' && sysGen.saveLoad.loadedTram === 'grid',
          JSON.stringify(sysGen.saveLoad));
    // reload the saved journey scenario for any later tests
    await page.evaluate(() => window.__city.applyCity(JSON.parse(JSON.stringify(window.__savedCity))));

    /* =====================================================================
       9. (optional) End-to-end watched-journey timing
       ===================================================================== */
    if(process.env.RUN_TIMING){
      console.log('\nEnd-to-end timing at 60× (watch matches the quote)');
      async function runJourney(mode, speed, capMs){
        await page.evaluate(({mode,speed}) => {
          const c = window.__city, S = c.state;
          c.applyCity(JSON.parse(JSON.stringify(window.__savedCity)));
          c.trip.done = false; c.trip.on = true; S.speed = speed;
          const office = S.objects.find(o=>o.type==='office'), apt = S.objects.find(o=>o.type==='apartments');
          c.trip.a = office; c.trip.b = apt; c.trip.routes = c.tripPlan(); c.trip.pick = mode;
          window.__eta = c.trip.routes[mode] ? c.trip.routes[mode].total : null;
          c.tripTakeIt();
        }, {mode, speed});
        const t0 = Date.now();
        while(Date.now()-t0 < capMs){
          await new Promise(r=>setTimeout(r,300));
          const st = await page.evaluate(()=>({done:window.__city.trip.done, took:window.__city.trip.took,
            eta:window.__eta, step:window.__city.trip.step, nsteps:(window.__city.trip.steps||[]).length}));
          if(st.done) return st;
        }
        return { TIMEOUT:true };
      }
      const tol = { walk:12, bike:12, tram:22, subway:25 };
      for(const mode of ['walk','bike','tram','subway']){
        const r = await runJourney(mode, 60, 90000);
        if(r.TIMEOUT){ check(mode+': journey completes at 60×', false, 'timed out'); continue; }
        const err = Math.round((r.took-r.eta)/r.eta*100);
        check(mode+': all steps reached in order', r.step >= r.nsteps-1, `step ${r.step}/${r.nsteps}`);
        check(mode+`: actual within ±${tol[mode]}% of quote`, Math.abs(err) <= tol[mode], `quoted ${Math.round(r.eta)}s, took ${Math.round(r.took)}s (${err>0?'+':''}${err}%)`);
      }
    } else {
      console.log('\n(timing tests skipped — run `npm run test:timing` to include them)');
    }

  } finally {
    await close();
  }

  console.log('\n' + '─'.repeat(48));
  console.log(`  ${passed} passed, ${failed} failed`);
  if(failed){ console.log('  FAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('  All journey-planner tests passed.');
})();
