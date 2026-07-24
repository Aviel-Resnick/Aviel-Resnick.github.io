import { PADS } from './content.js';

const WORLD_WIDTH = PADS[PADS.length - 1].x + 600;

// ---------- dom refs ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fuelLabel = document.getElementById('fuelLabel');
const fuelBarTrack = document.getElementById('fuelBarTrack');
const fuelBar = document.getElementById('fuelBar');
const fuelCounter = document.getElementById('fuelCounter');
const vspdEl = document.getElementById('vspd');
const altEl = document.getElementById('alt');
const modehint = document.getElementById('modehint');
const welcomeEl = document.getElementById('welcome');
const panelsWrap = document.getElementById('panels');
const minimap = document.getElementById('minimap');
const mmShip = document.getElementById('mmShip');
const staticView = document.getElementById('staticView');
const staticSections = document.getElementById('staticSections');
const backToFlight = document.getElementById('backToFlight');
const fuelHint = document.getElementById('fuelHint');
const mobileNote = document.getElementById('mobileNote');

const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// build panels + minimap pads + static sections from PADS
const panelEls = {};
PADS.forEach(pad => {
  const div = document.createElement('div');
  div.className = 'panel';
  div.id = 'panel-' + pad.id;
  div.innerHTML = pad.panelHTML;
  panelsWrap.appendChild(div);
  panelEls[pad.id] = div;

  const marker = document.createElement('div');
  marker.className = 'pad';
  marker.id = 'mm-' + pad.id;
  marker.style.left = (pad.x / WORLD_WIDTH * 100) + '%';
  marker.title = `Fly to ${pad.label}`;
  marker.innerHTML = `<div class="pad-tick"></div><div class="pad-label">${pad.label}</div>`;
  marker.addEventListener('click', () => flyTo(pad));
  minimap.appendChild(marker);

  staticSections.insertAdjacentHTML('beforeend', pad.staticHTML);
});

// ---------- prng ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- terrain ----------
let terrain = []; // {x,y}
const SPACING = 14;
let stars = [];
const BASELINE_FRAC = 0.72;

function buildTerrain() {
  const h = canvas.height;
  const baseline = h * BASELINE_FRAC;
  const rand = mulberry32(Date.now() & 0xffffffff);
  const waves = [
    { f: 0.00025 + rand() * 0.00035, a: 150 + rand() * 130, p: rand() * Math.PI * 2 }, // big rolling hills/valleys
    { f: 0.0012 + rand() * 0.0012, a: 65 + rand() * 70, p: rand() * Math.PI * 2 },     // medium terrain features
    { f: 0.004 + rand() * 0.003, a: 22 + rand() * 20, p: rand() * Math.PI * 2 },       // small ridges
    { f: 0.012 + rand() * 0.008, a: 8 + rand() * 8, p: rand() * Math.PI * 2 }          // fine jaggedness
  ];
  const n = Math.ceil(WORLD_WIDTH / SPACING) + 1;
  const pts = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * SPACING;
    let y = baseline;
    for (const w of waves) y += Math.sin(x * w.f + w.p) * w.a;
    // Clamp the smooth wave sum first, then jitter — jittering before the
    // clamp meant a run of points that overshot the height range all got
    // clipped to the *same* value along with their jitter, producing a long,
    // perfectly flat (and unintended) plateau wherever a tall peak or deep
    // valley saturated the range. Jittering after the clamp keeps every
    // point visibly distinct even when the underlying wave is saturated.
    y = Math.max(h * 0.2, Math.min(h * 0.95, y));
    y += (rand() - 0.5) * 18;
    pts[i] = { x, y };
  }
  // Only near the very start of the world (around HOME/spawn), keep the
  // ground from sagging too close to the bottom of the screen — the
  // controls legend sits fixed there in the bottom-left, and a low-lying
  // opening stretch could run the terrain (and HOME's label, drawn just
  // below it) right through that text. A light touch: cap how low the
  // ground can get, tapering back out to the normal range by START_PROTECT_X
  // so the rest of the terrain is unaffected.
  const START_PROTECT_X = 700;
  const startMaxY = h - h * 0.16;
  for (let i = 0; i < n; i++) {
    const x = pts[i].x;
    if (x >= START_PROTECT_X) break;
    const t = x / START_PROTECT_X; // 0 at the very start, 1 at the taper-out point
    const localMaxY = startMaxY + (h * 0.95 - startMaxY) * t;
    pts[i].y = Math.min(pts[i].y, localMaxY);
  }
  // flatten landing pads
  PADS.forEach(pad => {
    const half = pad.width / 2;
    const shoulder = 40;
    const centerIdx = Math.round(pad.x / SPACING);
    const padY = pts[Math.max(0, Math.min(pts.length - 1, centerIdx))].y;
    for (let i = 0; i < n; i++) {
      const x = i * SPACING;
      if (x >= pad.x - half - shoulder && x <= pad.x + half + shoulder) {
        if (x >= pad.x - half && x <= pad.x + half) {
          pts[i].y = padY;
        } else {
          const distIn = x < pad.x ? (pad.x - half - x) : (x - (pad.x + half));
          const t = 1 - distIn / shoulder;
          pts[i].y = pts[i].y * (1 - t) + padY * t;
        }
      }
    }
    pad.groundY = padY;
  });
  terrain = pts;
}

function heightAt(x) {
  x = Math.max(0, Math.min(WORLD_WIDTH, x));
  const idx = x / SPACING;
  const i0 = Math.floor(idx);
  const i1 = Math.min(terrain.length - 1, i0 + 1);
  const t = idx - i0;
  const y0 = terrain[i0] ? terrain[i0].y : canvas.height * BASELINE_FRAC;
  const y1 = terrain[i1] ? terrain[i1].y : y0;
  return y0 + (y1 - y0) * t;
}

function buildStars() {
  const rand = mulberry32(1337);
  stars = [];
  const count = Math.floor(WORLD_WIDTH / 14);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * WORLD_WIDTH,
      y: rand() * canvas.height * 0.62,
      r: rand() < 0.85 ? 1 : 1.8,
      phase: rand() * Math.PI * 2
    });
  }
}

// ---------- ship ----------
const MAX_FUEL = 100;
const SPAWN_X = PADS[0].x; // spawn directly above HOME
const ship = { x: SPAWN_X, y: 0, vx: 0, vy: 0, angle: 0, fuel: MAX_FUEL, landed: false, thrusting: false };
function resetShip() {
  ship.x = SPAWN_X;
  // Altitude above HOME's actual ground, not a fixed fraction of the screen —
  // terrain height under the pad varies with the random seed, so a fixed
  // screen-relative spawn could land barely any distance above ground on some
  // seeds, cutting the opening descent almost to nothing.
  ship.y = Math.max(40, PADS[0].groundY - 260);
  ship.vx = 0; ship.vy = 0; ship.angle = 0; ship.fuel = MAX_FUEL; ship.landed = false;
}

const GRAVITY = 230;
const THRUST = 430;
const ROTATE_SPEED = 3.0;
const FUEL_BURN = 7; // in limited mode, a full tank lasts ~14s of continuous thrust
const SHIP_R = 13;
const CRASH_VY = 260;

let shake = 0;

// ---------- landing legs ----------
// 0 = fully retracted (flush against the hull), 1 = fully extended for touchdown.
let legExtension = 0;
const LEG_EXTEND_START = 150; // altitude (px) at which legs start unfolding
const LEG_EXTEND_DONE = 55;   // altitude (px) at which legs are fully extended
const LEG_ANIM_SPEED = 3.0;   // max change in extension per second, so it animates rather than snapping

function updateLegAnimation(dt) {
  const altitude = heightAt(ship.x) - ship.y;
  const raw = (LEG_EXTEND_START - altitude) / (LEG_EXTEND_START - LEG_EXTEND_DONE);
  const target = Math.max(0, Math.min(1, raw));
  const maxStep = LEG_ANIM_SPEED * dt;
  if (legExtension < target) legExtension = Math.min(target, legExtension + maxStep);
  else if (legExtension > target) legExtension = Math.max(target, legExtension - maxStep);
}

// ---------- fuel mode ----------
let fuelMode = 'unlimited'; // 'unlimited' | 'limited'
let fuelUsed = 0; // cumulative counter shown in unlimited mode

function toggleFuelMode() {
  fuelMode = fuelMode === 'unlimited' ? 'limited' : 'unlimited';
  if (fuelMode === 'limited') ship.fuel = MAX_FUEL; // fresh tank when the challenge starts
}

function restart() {
  autopilot = null;
  resetShip();
  fuelUsed = 0;
}

// ---------- input ----------
const keys = { left: false, right: false, up: false };
let mode = 'interactive'; // 'interactive' | 'auto' | 'static'

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  const isFlightKey = e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'
    || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'
    || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W';
  if (isFlightKey && autopilot) cancelAutopilot(); // taking the stick cancels autofly
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'Enter' && !e.repeat) {
    if (mode === 'interactive') enterAuto();
    else if (mode === 'auto') enterInteractive();
    else if (mode === 'static') enterInteractive();
  }
  if (e.key === 'Escape' && !e.repeat) {
    if (mode !== 'static') enterStatic();
    else enterInteractive();
  }
  if (e.code === 'KeyF' && e.shiftKey && !e.repeat) {
    toggleFuelMode();
  }
  if (e.code === 'KeyR' && e.shiftKey && !e.repeat) {
    restart();
  }
}, { passive: false });

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
});

backToFlight.addEventListener('click', enterInteractive);

function hideWelcome() { welcomeEl.classList.add('hidden'); }
window.addEventListener('keydown', hideWelcome, { once: true });
window.addEventListener('click', hideWelcome, { once: true });

// ---------- auto-tour state ----------
// 'flying' reuses the exact same physics-driven autopilot as click-to-fly;
// 'dwell' is the hover-in-place pause at each pad between legs.
let autoState = { index: 0, phase: 'flying', timer: 0, flight: null };
const DWELL_TIME = 3.8;

function enterAuto() {
  if (isTouchDevice) return; // stay in simple view on touch devices
  mode = 'auto';
  autopilot = null;
  modehint.textContent = '[ENTER] MANUAL FLIGHT   [ESC] SIMPLE VIEW';
  autoState = { index: 0, phase: 'flying', timer: 0, flight: null };
  staticView.classList.remove('visible');
}
function enterInteractive() {
  if (isTouchDevice) return; // flight mode needs a keyboard; stay in simple view
  mode = 'interactive';
  autopilot = null;
  modehint.textContent = '[ENTER] AUTO-TOUR   [ESC] SIMPLE VIEW';
  staticView.classList.remove('visible');
}
function enterStatic() {
  mode = 'static';
  autopilot = null;
  modehint.textContent = '';
  staticView.classList.add('visible');
}

// ---------- click-to-fly autopilot ----------
let autopilot = null; // { pad, phase, originX, originY, ceilingY } or null

// The highest terrain point (smallest y) sampled between fromX and toX, so the
// autopilot knows how high it must cruise to clear every hill/valley in between —
// otherwise a lower departure or arrival pad can leave a ridge sticking up
// through a naive straight-line glide path.
function terrainCeilingBetween(fromX, toX, margin) {
  const lo = Math.max(0, Math.min(fromX, toX));
  const hi = Math.min(WORLD_WIDTH, Math.max(fromX, toX));
  const step = SPACING * 3;
  let highestPeakY = Infinity;
  for (let x = lo; x <= hi; x += step) highestPeakY = Math.min(highestPeakY, heightAt(x));
  highestPeakY = Math.min(highestPeakY, heightAt(hi));
  return Math.max(canvas.height * 0.1, highestPeakY - margin);
}

// Builds a fresh flight-state for autopilotStep(): shared by click-to-fly and
// the auto-tour, so both fly the same real climb/cruise/descend physics.
function makeFlightState(fromX, fromY, pad) {
  return {
    pad,
    phase: 'climb',
    originX: fromX,
    originY: fromY,
    // extra margin vs. a strict-vertical climb: the ascent drifts toward the
    // pad as it gains altitude instead of climbing dead straight up first,
    // so it needs more headroom to clear a peak it passes early.
    ceilingY: terrainCeilingBetween(fromX, pad.x, 120)
  };
}

function hasArrivedAtPad(state) {
  return ship.landed && Math.abs(ship.x - state.pad.x) < state.pad.width / 2;
}

function flyTo(pad) {
  enterInteractive();
  if (mode !== 'interactive') return; // no-op on touch devices
  if (fuelMode === 'limited') ship.fuel = MAX_FUEL; // a nav click should never strand the user mid-flight
  autopilot = makeFlightState(ship.x, ship.y, pad);
  modehint.textContent = `AUTOPILOT → ${pad.label}   [←/→/↑] TAKE CONTROL`;
}

function cancelAutopilot() {
  autopilot = null;
  modehint.textContent = '[ENTER] AUTO-TOUR   [ESC] SIMPLE VIEW';
}

// ---------- active panel tracking ----------
let activePadId = null;
function updateActivePanel(shipX) {
  let found = null;
  for (const pad of PADS) {
    if (Math.abs(shipX - pad.x) < (pad.width / 2 + 190)) { found = pad.id; break; }
  }
  if (found !== activePadId) {
    if (activePadId) panelEls[activePadId].classList.remove('visible');
    if (found) panelEls[found].classList.add('visible');
    activePadId = found;
  }
  PADS.forEach(pad => {
    const mm = document.getElementById('mm-' + pad.id);
    if (mm) mm.classList.toggle('active', pad.id === found);
  });
}

// ---------- physics update ----------
function updateInteractive(dt) {
  if (autopilot) {
    autopilotStep(autopilot, dt);
  } else {
    if (!ship.landed) {
      if (keys.left) ship.angle -= ROTATE_SPEED * dt;
      if (keys.right) ship.angle += ROTATE_SPEED * dt;
    } else {
      // Settle upright on touchdown instead of freezing at whatever angle it
      // landed with — animated, via the shortest rotation direction.
      let settleDa = -ship.angle;
      settleDa = Math.atan2(Math.sin(settleDa), Math.cos(settleDa));
      const maxStep = ROTATE_SPEED * dt;
      ship.angle += Math.max(-maxStep, Math.min(maxStep, settleDa));
    }

    ship.thrusting = keys.up && (fuelMode === 'unlimited' || ship.fuel > 0);
    if (ship.thrusting) {
      ship.vx += Math.sin(ship.angle) * THRUST * dt;
      ship.vy += -Math.cos(ship.angle) * THRUST * dt;
      const burn = FUEL_BURN * dt;
      fuelUsed += burn;
      if (fuelMode === 'limited') ship.fuel = Math.max(0, ship.fuel - burn);
    }
  }
  applyPhysics(dt);

  if (autopilot) {
    const outOfFuel = fuelMode === 'limited' && ship.fuel <= 0;
    if (hasArrivedAtPad(autopilot) || outOfFuel) cancelAutopilot();
  }

  updateActivePanel(ship.x);
}

// Gravity, position integration, world bounds, and ground collision — shared
// by manual flight, click-to-fly autopilot, and the auto-tour, so all three
// land on (and animate legs for) the terrain the same way.
function applyPhysics(dt) {
  ship.vy += GRAVITY * dt;

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Pac-Man-style wraparound instead of a hard wall at either edge.
  if (ship.x < 0) ship.x += WORLD_WIDTH;
  else if (ship.x > WORLD_WIDTH) ship.x -= WORLD_WIDTH;
  if (ship.y < 20) { ship.y = 20; ship.vy = Math.max(0, ship.vy); }

  const groundY = heightAt(ship.x);
  if (ship.y + SHIP_R > groundY) {
    ship.y = groundY - SHIP_R;
    if (ship.vy > CRASH_VY) { shake = 0.25; }
    ship.vy = 0;
    ship.landed = true;
    ship.vx *= Math.pow(0.001, dt);
  } else {
    ship.landed = false;
  }
}

// Flies the ship toward `state.pad` using the same thrust/rotation physics as
// manual control (a PD controller on top of it), instead of teleporting.
// Three phases, each terrain-aware via state.ceilingY (see
// terrainCeilingBetween): climb straight up to a height that clears every
// hill along the route, cruise over at that height, then descend onto the
// pad only once directly above it — so a pad that sits lower than its
// surroundings (or lower than the departure pad) never gets a glide path
// that clips the ridge in between. Takes the flight state as a parameter so
// click-to-fly (`autopilot`) and the auto-tour (`autoState.flight`) can each
// drive their own independent flight through the same logic.
function autopilotStep(state, dt) {
  const { pad, ceilingY, originX } = state;
  const dx = pad.x - ship.x;
  const distAbs = Math.abs(dx);

  if (state.phase === 'climb' && ship.y <= ceilingY + 15) {
    state.phase = 'cruise';
  }
  if (state.phase === 'cruise' && distAbs < pad.width / 2) {
    state.phase = 'descend'; // only commit to touchdown once directly over the flat zone,
    // not still on the sloped shoulder — landing there could pin the ship short of the pad
  }
  if (state.phase === 'descend' && distAbs > pad.width / 2 + 20) {
    state.phase = 'cruise'; // drifted off the flat zone; re-climb before trying again
  }

  let ax, targetY;

  if (state.phase === 'cruise') {
    // Bang-bang burn instead of a velocity-capped coast: thrust hard toward the
    // pad until the remaining distance matches the stopping distance at the
    // current speed, then flip and thrust hard the other way to kill that speed —
    // the classic accelerate/flip/brake "suicide burn" profile. A velocity-target
    // PD settles to ~0 horizontal accel once at cruise speed, which is both a
    // boring straight coast and why the ship looked like it was pointing
    // straight up (canceling gravity only) for the whole transit.
    const HORIZ_ACCEL = 320;
    const BRAKE_MARGIN = 40;
    // The physics stopping distance v²/(2a) assumes thrust reverses instantly.
    // It doesn't: the ship needs ~0.5-1s to physically rotate 180°, and thrust
    // tapers toward zero mid-turn (see `alignment` below), so it barely
    // decelerates while flipping and coasts straight through the ideal brake
    // point. Add the distance covered at the current speed over that flip
    // time so the burn starts early enough to actually stop at the pad.
    const FLIP_LEAD = 0.55;
    const stopDist = (ship.vx * ship.vx) / (2 * HORIZ_ACCEL) + Math.abs(ship.vx) * FLIP_LEAD + BRAKE_MARGIN;
    if (distAbs > stopDist) {
      ax = Math.sign(dx) * HORIZ_ACCEL; // burn prograde
    } else {
      ax = -Math.sign(ship.vx || dx) * HORIZ_ACCEL; // flip and burn retrograde
    }
    targetY = Math.min(ship.y, ceilingY); // never sink below the cleared height while transiting
  } else if (state.phase === 'climb') {
    // Sweep the horizontal target from the launch point toward the pad as
    // altitude is gained, instead of holding dead-vertical until reaching
    // cruise height — a diagonal "up and over" launch rather than a rigid
    // vertical-then-90°-turn corner. Ties horizontal drift to how much of the
    // climb is actually done, not to time/distance, so it's still cautious
    // early (mostly vertical) and only leans hard once genuinely climbing.
    const totalGap = Math.max(1, state.originY - ceilingY);
    const climbed = Math.max(0, state.originY - ship.y);
    const climbProgress = Math.min(1, climbed / totalGap);
    const targetX = originX + (pad.x - originX) * climbProgress;
    targetY = Math.min(ship.y, ceilingY);
    const desiredVx = Math.max(-150, Math.min(150, (targetX - ship.x) * 0.8));
    ax = (desiredVx - ship.vx) * 2.6;
  } else {
    // descend: short-range final approach, a capped velocity PD is smooth and sufficient
    // Aim *past* the surface (not just above it) — targeting exactly the
    // touchdown point is a stable hover equilibrium the PD settles into
    // forever, a hair short of ever tripping the ground-collision check.
    targetY = pad.groundY + 20;
    const desiredVx = Math.max(-150, Math.min(150, (pad.x - ship.x) * 0.8));
    ax = (desiredVx - ship.vx) * 2.6;
  }

  // Only the final stretch just above the pad gets the gentle, soft-landing
  // speed cap — descend can still start well above the ground (whenever
  // horizontally over the flat zone), and previously crawled down the whole
  // gap at landing speed even from height. Blend from the normal fast cap
  // down to the gentle one only within SOFT_LANDING_ZONE of the actual
  // surface, so it's still swift up high and only eases up right at the end.
  const SOFT_LANDING_ZONE = 140;
  let vyGain = 1.0, maxApproachVy = 200;
  if (state.phase === 'descend') {
    if (state.gentle) {
      // A distinctly slower, actively-braked sink rate for the one-time
      // opening descent onto HOME — not just the final approach, the whole way.
      vyGain = 0.5;
      maxApproachVy = 35;
    } else {
      const altAboveGround = heightAt(ship.x) - ship.y;
      const softness = Math.max(0, Math.min(1, altAboveGround / SOFT_LANDING_ZONE)); // 0 at surface, 1 above the zone
      vyGain = 0.6 + (1.0 - 0.6) * softness;
      maxApproachVy = 45 + (200 - 45) * softness;
    }
  }
  const desiredVy = Math.max(-maxApproachVy, Math.min(maxApproachVy, (targetY - ship.y) * vyGain));
  const ay = (desiredVy - ship.vy) * 2.6;

  const neededX = ax;
  // The thruster only ever opposes gravity (slows a fall / holds altitude /
  // climbs) — it should never fire to accelerate a descent beyond what
  // gravity alone already provides. Early in a fall, before gravity has
  // caught the ship up to its target sink rate, `ay` can come out positive
  // (asking to fall *faster*); clamping keeps that as a free-fall coast
  // instead of nosing the ship downward to "help" gravity.
  const neededY = Math.min(0, ay - GRAVITY);
  const desiredAngle = Math.atan2(neededX, -neededY);
  const desiredMag = Math.min(1, Math.hypot(neededX, neededY) / THRUST);

  let da = desiredAngle - ship.angle;
  da = Math.atan2(Math.sin(da), Math.cos(da)); // shortest angular distance
  const maxStep = ROTATE_SPEED * dt;
  ship.angle += Math.max(-maxStep, Math.min(maxStep, da));

  // Taper thrust by how well-aimed the ship currently is, rather than an all-or-
  // nothing cutoff — a hard gate meant a big required turn (e.g. right after
  // climb hands off to cruise) produced a few no-thrust frames, and gravity
  // alone was enough to drop the ship back into the terrain before it finished
  // turning. Partial thrust during the turn keeps it climbing/holding instead.
  const alignment = Math.max(0, Math.cos(da));
  ship.thrusting = alignment > 0.05 && desiredMag > 0.05 && (fuelMode === 'unlimited' || ship.fuel > 0);
  if (ship.thrusting) {
    const mag = desiredMag * alignment * THRUST;
    ship.vx += Math.sin(ship.angle) * mag * dt;
    ship.vy += -Math.cos(ship.angle) * mag * dt;
    const burn = FUEL_BURN * dt;
    fuelUsed += burn;
    if (fuelMode === 'limited') ship.fuel = Math.max(0, ship.fuel - burn);
  }
}

function updateAuto(dt) {
  const pad = PADS[autoState.index];

  if (autoState.phase === 'flying') {
    // Same physics-driven autopilot as click-to-fly, just auto-launched at
    // each stop instead of by a click.
    if (!autoState.flight) autoState.flight = makeFlightState(ship.x, ship.y, pad);
    autopilotStep(autoState.flight, dt);
    applyPhysics(dt);
    if (hasArrivedAtPad(autoState.flight)) {
      autoState.flight = null;
      autoState.phase = 'dwell';
      autoState.timer = 0;
    }
  } else {
    // Rest landed on the pad (legs down, settled upright) while the panel is
    // shown, same as a normal manual landing, then take off for the next stop.
    autoState.timer += dt;
    let settleDa = -ship.angle;
    settleDa = Math.atan2(Math.sin(settleDa), Math.cos(settleDa));
    const maxStep = ROTATE_SPEED * dt;
    ship.angle += Math.max(-maxStep, Math.min(maxStep, settleDa));
    ship.thrusting = false;
    applyPhysics(dt);
    if (autoState.timer >= DWELL_TIME) {
      autoState.index = (autoState.index + 1) % PADS.length;
      autoState.phase = 'flying';
      autoState.timer = 0;
    }
  }
  updateActivePanel(ship.x);
}

// ---------- render ----------
function render() {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8 * shake * 4, (Math.random() - 0.5) * 8 * shake * 4);
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const camX = Math.max(0, Math.min(WORLD_WIDTH - w, ship.x - w / 2));

  // stars
  ctx.fillStyle = 'rgba(244,244,244,0.7)';
  const t = performance.now() / 600;
  for (const s of stars) {
    const sx = s.x - camX * 0.5;
    if (sx < -5 || sx > w + 5) continue;
    const flick = 0.5 + 0.5 * Math.sin(t + s.phase);
    ctx.globalAlpha = 0.3 + 0.5 * flick;
    ctx.fillRect(sx, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // terrain
  ctx.strokeStyle = '#f4f4f4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < terrain.length; i++) {
    const p = terrain[i];
    const sx = p.x - camX;
    if (sx < -20 || sx > w + 20) { if (started && sx > w + 20) break; continue; }
    if (!started) { ctx.moveTo(sx, p.y); started = true; }
    else ctx.lineTo(sx, p.y);
  }
  ctx.stroke();

  // pad markers
  PADS.forEach(pad => {
    const sx = pad.x - camX;
    if (sx < -100 || sx > w + 100) return;
    const half = pad.width / 2;
    ctx.save();
    ctx.strokeStyle = '#f4f4f4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - half, pad.groundY - 16); ctx.lineTo(sx - half, pad.groundY);
    ctx.moveTo(sx + half, pad.groundY - 16); ctx.lineTo(sx + half, pad.groundY);
    ctx.stroke();
    ctx.font = 'bold 14px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(pad.label, sx, pad.groundY + 30);
    ctx.restore();
  });

  // ship
  const sx = ship.x - camX, sy = ship.y;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ship.angle);
  ctx.strokeStyle = '#f4f4f4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-10, 10);
  ctx.lineTo(-5, 7);
  ctx.lineTo(5, 7);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.stroke();
  if (legExtension > 0.02) {
    // Legs fold up flush against the hull at extension 0 and splay outward
    // with a foot pad at extension 1, animated by updateLegAnimation().
    // Capped so the foot never renders past the ground line when landed:
    // the hull rests at SHIP_R above ground, and the hip mount is 8px below
    // ship-center, leaving (SHIP_R - 8) of local clearance for a full-length leg.
    const hipX0 = 9, hipY = 8;
    const legLen = (SHIP_R - hipY) * legExtension;
    const spread = 1.5 + 3.5 * legExtension;
    const footHalf = 2.5 * legExtension;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const hipX = side * hipX0;
      const footX = hipX + side * spread, footY = hipY + legLen;
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(footX, footY);
      ctx.moveTo(footX - footHalf, footY);
      ctx.lineTo(footX + footHalf, footY);
    }
    ctx.stroke();
  }
  if (ship.thrusting) {
    const flick = 8 + Math.random() * 8;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(0, 8 + flick);
    ctx.lineTo(4, 8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
  if (shake > 0) shake = Math.max(0, shake - 0.016);
}

function updateHUD() {
  if (fuelMode === 'limited') {
    fuelLabel.textContent = 'FUEL';
    fuelBarTrack.style.display = '';
    fuelCounter.style.display = 'none';
    fuelBar.style.width = (ship.fuel / MAX_FUEL * 100) + '%';
    const empty = ship.fuel <= 0;
    fuelHint.textContent = empty ? 'OUT OF FUEL — [SHIFT+R] RESTART' : '[SHIFT+F] unlimited fuel';
    fuelHint.classList.toggle('urgent', empty);
  } else {
    fuelLabel.textContent = 'FUEL USED';
    fuelBarTrack.style.display = 'none';
    fuelCounter.style.display = '';
    fuelCounter.textContent = Math.round(fuelUsed);
    fuelHint.textContent = '[SHIFT+F] limited fuel mode';
    fuelHint.classList.remove('urgent');
  }
  vspdEl.textContent = Math.abs(ship.vy).toFixed(0);
  altEl.textContent = Math.max(0, Math.round(heightAt(ship.x) - ship.y));
  const frac = ship.x / WORLD_WIDTH;
  mmShip.style.left = (frac * 100) + '%';
}

// ---------- loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (mode === 'interactive') updateInteractive(dt);
  else if (mode === 'auto') updateAuto(dt);
  // static: no physics update

  if (mode !== 'static') {
    updateLegAnimation(dt);
    render();
    updateHUD();
  }
  requestAnimationFrame(loop);
}

// ---------- resize ----------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildTerrain();
  buildStars();
}
window.addEventListener('resize', resize);

// ---------- init ----------
resize();
resetShip();

if (isTouchDevice) {
  mode = 'static';
  modehint.textContent = '';
  staticView.classList.add('visible');
  mobileNote.classList.add('visible');
  backToFlight.textContent = 'Interactive mode needs a keyboard — best on desktop';
  backToFlight.classList.add('disabled');
} else {
  // Open on a slow, automatic descent onto HOME (spawn sits directly above
  // it) instead of a static instructions modal — taking the controls at any
  // point cancels it immediately via the same autopilot-cancel-on-input
  // path used everywhere else.
  flyTo(PADS[0]);
  if (autopilot) { autopilot.phase = 'descend'; autopilot.gentle = true; }
}

requestAnimationFrame(loop);
