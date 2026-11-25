(() => {
  'use strict';

  const view = document.getElementById('view'),
    glow = document.getElementById('glow');
  const vx = view.getContext('2d'),
    gx = glow.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAMP = ' .:-=+*#%@';
  let W, H, dpr, cw, chh, fs, ratio, cols, rows, ofx, ofy, u, ox, oy, chars, colors;
  let stars = [],
    motes = [];
  let startTime = performance.now() - (reduced ? 40000 : 0);

  const MESSAGES = [
    'Hey you. This bouquet is for you.',
    "Hard days don't last forever, even when they feel endless.",
    'You are stronger than this moment.',
    'Take a slow breath, like petals opening.',
    "You don't have to fix everything today.",
    'Better days are blooming. Be gentle with yourself.',
    'You are loved. You are not alone.',
  ];
  const msgEl = document.getElementById('msg');
  let msgToken = 0,
    msgStarted = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runMessages(token) {
    for (let i = 0; token === msgToken; i = (i + 1) % MESSAGES.length) {
      const text = MESSAGES[i];
      msgEl.textContent = '';
      msgEl.classList.add('on');
      for (let c = 1; c <= text.length; c++) {
        if (token !== msgToken) return;
        msgEl.textContent = text.slice(0, c);
        await wait(reduced ? 10 : 55);
      }
      await wait(3800);
      msgEl.classList.remove('on');
      await wait(1400);
    }
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);
  const hash = (a, b) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const hueMix = (a, b, t) => a + (((b - a + 540) % 360) - 180) * t;
  const cache = new Map();
  function hsl(h, s, l) {
    h = ((Math.round(h) % 360) + 360) % 360;
    s = Math.round(clamp(s, 0, 100));
    l = Math.round(clamp(l, 5, 92) / 3) * 3;
    const k = (h * 101 + s) * 101 + l;
    let c = cache.get(k);
    if (!c) cache.set(k, (c = `hsl(${h},${s}%,${l}%)`));
    return c;
  }
  function put(x, y, ch, col) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const i = y * cols + x;
    chars[i] = ch;
    colors[i] = col;
  }
  const rampChar = (br) => RAMP[clamp(Math.floor(br * RAMP.length), 1, RAMP.length - 1)];

  const FL = [
    {
      x: -0.02,
      y: -0.2,
      R: 0.36,
      rot: 0.25,
      tilt: 0.86,
      h: 352,
      s: 88,
      L: 0,
      ht: 75,
      t0: 6.5,
      bend: 0.03,
    },
    {
      x: -0.4,
      y: 0.1,
      R: 0.31,
      rot: -0.5,
      tilt: 0.8,
      h: 312,
      s: 75,
      L: 2,
      ht: 60,
      t0: 8.5,
      bend: -0.06,
    },
    {
      x: 0.22,
      y: 0.1,
      R: 0.34,
      rot: 0.6,
      tilt: 0.82,
      h: 15,
      s: 30,
      L: 14,
      ht: 75,
      t0: 10.5,
      bend: 0.06,
    },
    {
      x: -0.42,
      y: -0.33,
      R: 0.27,
      rot: -0.9,
      tilt: 0.8,
      h: 50,
      s: 90,
      L: 2,
      ht: 70,
      t0: 7.5,
      bend: -0.08,
    },
    {
      x: 0.42,
      y: -0.4,
      R: 0.25,
      rot: 0.9,
      tilt: 0.78,
      h: 40,
      s: 85,
      L: -2,
      ht: 80,
      t0: 9.5,
      bend: 0.08,
    },
    {
      x: 0.02,
      y: -0.58,
      R: 0.22,
      rot: 0,
      tilt: 0.75,
      h: 25,
      s: 35,
      L: 12,
      ht: 80,
      t0: 12,
      bend: 0.0,
    },
    {
      x: 0.48,
      y: 0.02,
      R: 0.22,
      rot: 1.2,
      tilt: 0.75,
      h: 335,
      s: 70,
      L: 0,
      ht: 60,
      t0: 11.5,
      bend: 0.08,
    },
    {
      x: -0.58,
      y: -0.04,
      R: 0.2,
      rot: -1.1,
      tilt: 0.75,
      h: 280,
      s: 55,
      L: -2,
      ht: 70,
      t0: 13,
      bend: -0.08,
    },
    {
      x: -0.2,
      y: -0.56,
      R: 0.2,
      rot: -0.4,
      tilt: 0.75,
      h: 325,
      s: 70,
      L: 4,
      ht: 75,
      t0: 14,
      bend: -0.03,
    },
  ];
  FL.forEach((f, i) => {
    f.i = i;
    f.ph = i * 1.7 + 0.5;
  });
  const ORDER = [7, 8, 5, 4, 3, 6, 2, 1, 0];

  const LEAVES = [
    { i: 1, s: 0.12, a: -2.7, L: 0.5 },
    { i: 2, s: 0.12, a: -0.45, L: 0.5 },
    { i: 5, s: 0.2, a: -2.2, L: 0.42 },
    { i: 3, s: 0.2, a: -0.9, L: 0.42 },
    { i: 0, s: 0.3, a: -2.0, L: 0.38 },
    { i: 4, s: 0.3, a: -1.1, L: 0.36 },
    { i: 7, s: 0.1, a: -3.0, L: 0.4 },
    { i: 6, s: 0.1, a: -0.15, L: 0.4 },
    { i: 1, s: 0.45, a: -2.4, L: 0.3 },
    { i: 2, s: 0.5, a: -0.7, L: 0.3 },
  ];
  LEAVES.forEach((l, k) => (l.ph = k * 2.3));

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    for (const c of [view, glow]) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    cw = Math.max(3.8, Math.min(W / 110, H / 122));
    fs = cw / 0.6;
    chh = fs * 1.05;
    ratio = chh / cw;
    cols = Math.floor(W / cw);
    rows = Math.floor(H / chh);
    ofx = (W - cols * cw) / 2;
    ofy = (H - rows * chh) / 2;
    u = Math.min((cols * 0.94) / 1.5, (rows * 0.94 * ratio) / 1.8);
    ox = cols / 2 - 0.1 * u;
    oy = rows / 2 - (0.1 * u) / ratio;
    chars = new Array(cols * rows).fill(null);
    colors = new Array(cols * rows);
    stars = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random(),
      p: Math.random() * 6,
      r: 0.5 + Math.random(),
    }));
    motes = Array.from({ length: Math.round(Math.min(90, W / 12)) }, () => ({
      x: 0.5 + (Math.random() - 0.5) * 1.0,
      y: Math.random(),
      v: 0.01 + Math.random() * 0.03,
      p: Math.random() * 6,
      h: [330, 50, 290, 20, 140][Math.floor(Math.random() * 5)],
      c: '.·*+°'[Math.floor(Math.random() * 5)],
    }));
  }
  addEventListener('resize', resize);
  view.addEventListener('pointerdown', () => {
    startTime = performance.now();
    msgToken++;
    msgStarted = false;
    msgEl.classList.remove('on');
    msgEl.textContent = '';
  });

  const sway = reduced ? 0.25 : 1;
  function stemPt(f, s, t) {
    const bx = 0.03 + (f.i - 4) * 0.006,
      by = 1.02,
      tx = f.x,
      ty = f.y + 0.04;
    const cx = bx + (tx - bx) * 0.1 + f.bend,
      cy = by + (ty - by) * 0.55,
      q = 1 - s;
    const sw =
      (Math.sin(t * 0.55 + f.ph) * 0.022 + Math.sin(t * 1.1 + f.ph * 2) * 0.006) * s * s * sway;
    return {
      x: q * q * bx + 2 * q * s * cx + s * s * tx + sw,
      y: q * q * by + 2 * q * s * cy + s * s * ty,
      sw,
    };
  }
  const toCell = (p) => ({ cx: ox + p.x * u, cy: oy + (p.y * u) / ratio });

  function drawStem(f, g, t) {
    const n = 130,
      lim = Math.floor(n * g);
    let prev = toCell(stemPt(f, 0, t));
    for (let k = 1; k <= lim; k++) {
      const s = k / n,
        p = toCell(stemPt(f, s, t));
      const dx = p.cx - prev.cx,
        dy = (p.cy - prev.cy) * ratio;
      const ch = Math.abs(dx) < 0.35 * Math.abs(dy) ? '|' : dx * dy > 0 ? '\\' : '/';
      const l = 24 + 18 * (1 - s) + 6 * hash(k, f.i);
      put(p.cx, p.cy, ch, hsl(105 + 10 * s, 50, l));
      put(p.cx + 1, p.cy, ch, hsl(100, 50, l - 8));
      prev = p;
    }
  }

  function drawLeaf(lf, g, t) {
    const f = FL[lf.i],
      gl = ease(clamp((g - lf.s) * 2.4));
    if (gl <= 0) return;
    const bp = stemPt(f, lf.s, t),
      a = lf.a + Math.sin(t * 0.8 + lf.ph) * 0.05 * sway;
    const dx = Math.cos(a),
      dy = Math.sin(a),
      nx = -dy,
      ny = dx,
      L = lf.L;
    const steps = Math.ceil(L * u * 1.7 * gl);
    for (let k = 0; k <= steps; k++) {
      const w = k / (L * u * 1.7),
        ww = w;
      if (ww > gl) break;
      const curve = L * 0.22 * ww * ww,
        droop = L * 0.3 * ww * ww;
      const cx = bp.x + dx * L * ww + nx * curve,
        cy = bp.y + dy * L * ww + ny * curve + droop;
      const hw =
        L * 0.12 * Math.sin(Math.PI * Math.pow(Math.min(ww, 1), 0.7)) * Math.min(1, gl * 1.3);
      const m = Math.max(1, Math.ceil(hw * u * 1.1));
      for (let q = -m; q <= m; q++) {
        const e = q / m,
          px = cx + nx * hw * e * 0.9,
          py = cy + ny * hw * e * 0.9;
        const br = 0.45 + 0.4 * (1 - Math.abs(e)) + 0.1 * Math.sin(ww * 9 + lf.ph);
        const ch = Math.abs(e) < 0.15 ? '!' : rampChar(br);
        put(
          ox + px * u,
          oy + (py * u) / ratio,
          ch,
          hsl(98 + 22 * Math.abs(e) + 8 * ww, 55, 20 + 30 * br),
        );
      }
    }
  }

  function drawFlower(f, t, tip) {
    const b = f.b,
      R = f.R * u * (0.22 + 0.78 * b) * f.bs;
    if (R < 1.2) return;
    const px = tip.cx,
      py = tip.cy,
      rot = f.rot + tip.sw * 1.5;
    const cr = Math.cos(rot),
      sr = Math.sin(rot);
    const wf = 0.3 + 0.7 * b,
      ext = Math.ceil(R) + 2,
      ey = Math.ceil(ext / ratio) + 1;
    const gm = clamp(1 - b / 0.35);
    const breathe = Math.sin(t * 1.3 + f.ph);

    const ax = [[], []];
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 3; j++)
        ax[k][j] =
          k * 1.0472 + j * 2.0944 + Math.sin(t * 1.1 + j * 2.1 + k * 1.3 + f.ph) * 0.06 * b * sway;

    for (let rr = Math.floor(py - ey); rr <= py + ey; rr++) {
      for (let cc = Math.floor(px - ext); cc <= px + ext; cc++) {
        const dx = cc - px,
          dy = (rr - py) * ratio;
        const ux = dx * cr + dy * sr,
          uy = (-dx * sr + dy * cr) / f.tilt;
        const r = Math.hypot(ux, uy);
        if (r > R * 1.02) continue;
        const th = Math.atan2(uy, ux);
        let hit = r < R * 0.09 ? { k: 1, j: 0, uu: 0.05, tt: 0.5 } : null;
        for (let k = 0; k < 2; k++) {
          const Lk = R * (k ? 0.84 : 1),
            wm = Lk * (k ? 0.3 : 0.21) * wf * 2.16;
          for (let j = 0; j < 3; j++) {
            let d = th - ax[k][j];
            d = Math.atan2(Math.sin(d), Math.cos(d));
            const ad = Math.abs(d),
              uu = r / Lk;
            if (ad > 1.5 || uu >= 1) continue;
            const perp = r * Math.sin(ad);
            const w =
              wm *
              Math.pow(uu, 0.45) *
              Math.pow(1 - uu, 0.7) *
              (1 + 0.08 * Math.sin(uu * 13 + j * 2 + k + t * 0.7 * sway));
            if (perp < w) {
              hit = { k, j, uu, tt: perp / w };
              break;
            }
          }
        }
        if (!hit) continue;
        const { k, j, uu, tt } = hit;
        let br = 0.42 + 0.5 * (1 - tt * tt);
        br *= (0.78 + 0.22 * Math.sin(j * 2.1 + k * 1.2 + 1)) * (k ? 1 : 0.82);
        if (tt < 0.1) br *= 0.8;
        if (tt > 0.9) br += 0.2;
        br = clamp(br, 0.2, 1);
        if (b > 0.5 && uu > 0.18 && uu < 0.7 && tt < 0.8 && hash(cc, rr) > 0.93) {
          put(cc, rr, '%', hsl(f.h - 12, 70, 16 + 8 * br));
          continue;
        }
        const mixT = clamp(uu * 2.2 - 0.2);
        let hue = hueMix(f.ht, f.h, mixT * mixT * (3 - 2 * mixT));
        let sat = f.s * (uu < 0.25 ? 0.8 : 1);
        let lum = 14 + 56 * br + f.L * (0.5 + br) + 4 * breathe;
        hue = hueMix(hue, 105, gm);
        sat = sat + (50 - sat) * gm;
        lum = lum * (1 - 0.3 * gm);
        put(cc, rr, rampChar(br), hsl(hue, sat, lum));
      }
    }

    if (b > 0.3) {
      const len = R * 0.55 * clamp((b - 0.3) / 0.5);
      for (let s = 0; s < 6; s++) {
        const a = s * 1.047 + 0.3 + Math.sin(t + s + f.ph) * 0.08 * sway,
          steps = Math.ceil(len);
        for (let q = 1; q <= steps; q++) {
          const rl = q * (len / steps),
            lx = Math.cos(a) * rl,
            vy = Math.sin(a) * rl * f.tilt * 0.85;
          const x = px + lx * cr - vy * sr,
            y = py + (lx * sr + vy * cr) / ratio;
          put(
            x,
            y,
            q === steps ? '@' : '.',
            q === steps ? hsl(22, 90, 36 + 4 * breathe) : hsl(60, 45, 60),
          );
        }
      }
    }
    put(px, py, '*', hsl(70, 60, 55));
  }

  function drawBackdrop(t, dt) {
    vx.fillStyle = '#fff';
    for (const s of stars) {
      vx.globalAlpha = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.8 + s.p));
      vx.fillRect(s.x * W, s.y * H, s.r, s.r);
    }
    vx.globalAlpha = 1;
  }
  function drawMotes(t, dt) {
    vx.font = `${fs * 1.2}px "Courier New", monospace`;
    for (const m of motes) {
      m.y -= m.v * dt * sway;
      if (m.y < -0.05) {
        m.y = 1.05;
        m.x = 0.5 + (Math.random() - 0.5);
      }
      const x = (m.x + Math.sin(t * 0.5 + m.p) * 0.02) * W,
        y = m.y * H;
      vx.globalAlpha =
        (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.4 + m.p))) * clamp(Math.min(m.y, 1 - m.y) * 6);
      vx.fillStyle = hsl(m.h, 70, 70);
      vx.fillText(m.c, x, y);
    }
    vx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - startTime) / 1000;
    chars.fill(null);
    if (t > 15 && !msgStarted) {
      msgStarted = true;
      runMessages(msgToken);
    }

    const g = FL.map((f) => ease(clamp((t - (0.3 + f.i * 0.4)) / 6)));
    FL.forEach((f) => drawStem(f, g[f.i], t));
    LEAVES.forEach((l) => drawLeaf(l, g[l.i], t));
    for (const i of ORDER) {
      const f = FL[i];
      f.bs = ease(clamp((g[i] - 0.8) / 0.2));
      f.b = ease(clamp((t - f.t0) / 8));
      const p = stemPt(f, g[i], t),
        c = toCell(p);
      c.sw = p.sw;
      drawFlower(f, t, c);
    }

    vx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vx.clearRect(0, 0, W, H);
    drawBackdrop(t, dt);
    vx.font = `${fs}px "Courier New", monospace`;
    vx.textAlign = 'center';
    vx.textBaseline = 'middle';
    let cur = null;
    for (let r = 0, i = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++, i++) {
        const ch = chars[i];
        if (!ch) continue;
        if (colors[i] !== cur) vx.fillStyle = cur = colors[i];
        vx.fillText(ch, ofx + (c + 0.5) * cw, ofy + (r + 0.5) * chh);
      }
    }
    drawMotes(t, dt);

    gx.setTransform(1, 0, 0, 1, 0, 0);
    gx.clearRect(0, 0, glow.width, glow.height);
    gx.drawImage(view, 0, 0);
    glow.style.opacity = (0.42 + 0.14 * Math.sin(t * 1.1)).toFixed(3);
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})();
