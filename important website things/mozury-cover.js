/* Mozury — Facebook cover (1640×924): Umayyad Square at night.
 * Shared by mozury-facebook-cover.html and mozury-facebook-cover-preview.html.
 * The scene is an inline SVG; the text and logo are drawn onto the canvas with
 * the page's web fonts so the exported PNG matches the page exactly. */
(function (global) {
  'use strict';

  var W = 1640, H = 924;
  var C = {
    deep: '#0A2E26',   // sky top, ground
    green: '#0F3D33',  // sky bottom, water, road
    soft: '#1B5245',   // monument, hills, roundabout
    cream: '#F7F3E8',  // text, edge highlights, water, moon
    gold: '#D9A441'    // light trails, city lights, the full stop
  };
  var LOGO_SRC = 'logo and pics/mozury-logo-cream-transparent.png';
  var LOGO_CACHE_KEY = 'mozury-cover-logo';

  // Safe zones (see brief): central band, side margin, profile-picture overlap.
  var SAFE = { top: 158, bottom: 766, side: 80, textRight: W - 96, textMinLeft: 880 };
  var PROFILE = { x: 0, y: 560, w: 480, h: 364, cx: 240, cy: 742, r: 182 };

  // Roundabout centre; the monument stands on it.
  var RB = { cx: 760, cy: 660 };
  var FLAT = 0.28; // ellipse ry / rx — a slightly elevated night view

  function n(v) { return Math.round(v * 10) / 10; }
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function g(x, m, s) { var d = (x - m) / s; return Math.exp(-d * d); }

  // Mount Qasioun: a long ridge, highest left of centre, falling away to the right
  // so the text block sits in clear sky.
  function farRidge(x) {
    return 474 - 78 * g(x, 330, 310) - 34 * g(x, 820, 230) - 14 * g(x, 1160, 180)
      + (x > 720 ? 0.1 * (x - 720) : 0)
      + 3 * Math.sin(x / 37) + 1.6 * Math.sin(x / 11);
  }
  function nearRidge(x) {
    return 540 - 28 * g(x, 190, 250) - 14 * g(x, 1000, 320)
      + (x > 760 ? 0.04 * (x - 760) : 0)
      + 2.2 * Math.sin(x / 23) + 1.2 * Math.sin(x / 7);
  }
  var GROUND_Y = 602;

  function ridgePath(fn, bottom) {
    var d = 'M0 ' + bottom + ' L0 ' + n(fn(0));
    for (var x = 8; x <= W; x += 8) d += ' L' + x + ' ' + n(fn(x));
    return d + ' L' + W + ' ' + bottom + ' Z';
  }

  function ell(rx, deg) {
    var t = deg * Math.PI / 180;
    return [RB.cx + rx * Math.cos(t), RB.cy + rx * FLAT * Math.sin(t)];
  }
  // Unit tangent for travel in decreasing angle (anticlockwise on screen:
  // left → front → right → back, i.e. right-hand traffic seen from the south).
  function tan(rx, deg) {
    var t = deg * Math.PI / 180, vx = rx * Math.sin(t), vy = -rx * FLAT * Math.cos(t);
    var l = Math.hypot(vx, vy);
    return [vx / l, vy / l];
  }

  // 5 light trails: varying radius, weight and brightness. Three arrive from the
  // west as fading tails, two leave east across the frame.
  var TRAILS = [
    { rx: 170, w: 1.4, o: 0.85, a0: 200, a1: -122 },
    { rx: 184, w: 3.4, o: 1.0, a0: 128, a1: 58, tail: [-20, 642], exit: [1680, 706] },
    { rx: 198, w: 1.0, o: 0.65, a0: 214, a1: -22 },
    { rx: 214, w: 2.3, o: 0.9, a0: 112, a1: -42, tail: [-20, 680] },
    { rx: 236, w: 1.7, o: 0.8, a0: 140, a1: 80, tail: [-20, 614], exit: [1680, 812] }
  ];

  function trailPath(t) {
    var p0 = ell(t.rx, t.a0), p1 = ell(t.rx, t.a1), d = '';
    if (t.tail) {
      var ti = tan(t.rx, t.a0), k = 0.3 * (p0[0] - t.tail[0]);
      d += 'M' + t.tail[0] + ' ' + t.tail[1] +
        ' C' + n(t.tail[0] + k) + ' ' + t.tail[1] + ' ' +
        n(p0[0] - ti[0] * k) + ' ' + n(p0[1] - ti[1] * k) + ' ' +
        n(p0[0]) + ' ' + n(p0[1]);
    } else {
      d += 'M' + n(p0[0]) + ' ' + n(p0[1]);
    }
    var span = t.a0 - t.a1;
    d += ' A' + t.rx + ' ' + n(t.rx * FLAT) + ' 0 ' + (span > 180 ? 1 : 0) + ' 0 ' +
      n(p1[0]) + ' ' + n(p1[1]);
    if (t.exit) {
      var to = tan(t.rx, t.a1), k2 = 0.32 * (t.exit[0] - p1[0]);
      d += ' C' + n(p1[0] + to[0] * k2) + ' ' + n(p1[1] + to[1] * k2) + ' ' +
        n(t.exit[0] - k2) + ' ' + t.exit[1] + ' ' + t.exit[0] + ' ' + t.exit[1];
    }
    return d;
  }

  function cityLights(r) {
    var out = '';
    function dot(x, y, rad, op) {
      out += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(rad) +
        '" fill="' + C.gold + '" fill-opacity="' + (Math.round(op * 100) / 100) + '"/>';
    }
    // Far slope: sparse near the ridge line, denser toward the foot.
    for (var i = 0; i < 360; i++) {
      var x = r() * W, top = farRidge(x) + 8, y = top + (GROUND_Y - top) * Math.pow(r(), 0.5);
      dot(x, y, 0.5 + r() * 0.9, 0.25 + r() * 0.5);
    }
    return out;
  }
  function nearLights(r) {
    var out = '';
    function dot(x, y, rad, op) {
      out += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(rad) +
        '" fill="' + C.gold + '" fill-opacity="' + (Math.round(op * 100) / 100) + '"/>';
    }
    for (var i = 0; i < 520; i++) {
      var x = r() * W, top = nearRidge(x) + 5, y = top + (GROUND_Y - top) * Math.pow(r(), 0.42);
      dot(x, y, 0.55 + r() * 1.05, 0.35 + r() * 0.6);
    }
    // The city's edge at the foot of the mountain: a dense, bright seam.
    for (var j = 0; j < 260; j++) {
      var x2 = r() * W;
      dot(x2, GROUND_Y - 16 + r() * 15, 0.6 + r() * 1.0, 0.5 + r() * 0.5);
    }
    return out;
  }

  function stars(r) {
    var out = '', placed = 0, guard = 0;
    while (placed < 26 && guard++ < 500) {
      var x = 40 + r() * (W - 80), y = 30 + r() * 400;
      if (y > farRidge(x) - 30) continue;
      if (x > 900 && y > 150 && y < 520) continue;           // keep the text sky clean
      if (Math.abs(x - RB.cx) < 60 && y > 170) continue;        // and the blade
      if (Math.hypot(x - 430, y - 236) < 70) continue;        // and the moon
      out += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(0.6 + r() * 0.8) +
        '" fill="' + C.cream + '" fill-opacity="' + (Math.round((0.22 + r() * 0.4) * 100) / 100) + '"/>';
      placed++;
    }
    return out;
  }

  // Fountain jets: soft cream arcs leaping toward the monument; a few catch gold.
  function jets(front) {
    var out = '', count = 18;
    for (var i = 0; i < count; i++) {
      var deg = i * 360 / count + 7, t = deg * Math.PI / 180;
      if ((Math.sin(t) > 0) !== front) continue;
      var sx = RB.cx + 116 * Math.cos(t), sy = RB.cy + 116 * FLAT * Math.sin(t);
      var ex = RB.cx + 58 * Math.cos(t), ey = RB.cy + 58 * FLAT * Math.sin(t) - 4;
      var mx = (sx + ex) / 2, my = Math.min(sy, ey) - 34;
      var goldJet = i % 4 === 1;
      out += '<path d="M' + n(sx) + ' ' + n(sy) + ' Q' + n(mx) + ' ' + n(my) + ' ' + n(ex) + ' ' + n(ey) +
        '" fill="none" stroke="' + (goldJet ? C.gold : C.cream) + '" stroke-width="' + (goldJet ? 1.4 : 1.2) +
        '" stroke-opacity="' + (goldJet ? 0.8 : 0.5) + '" stroke-linecap="round"/>';
      out += '<circle cx="' + n(ex) + '" cy="' + n(ey + 2) + '" r="1.1" fill="' + C.cream + '" fill-opacity="0.5"/>';
    }
    return out;
  }

  // The Damascene Sword, drawn around its base point (0,0) on the island.
  // Lit from the right (cream edge), shadowed on the left (deep edge).
  var TIP = 192; // absolute y of the blade's point (brief: below 180)
  function monument() {
    var B = RB.cy + 4, top = TIP - B, s = '';
    function lit(d, w, o) { return '<path d="' + d + '" fill="none" stroke="' + C.cream + '" stroke-width="' + (w || 1.5) + '" stroke-opacity="' + (o || 0.9) + '" stroke-linecap="round"/>'; }
    function dark(d) { return '<path d="' + d + '" fill="none" stroke="' + C.deep + '" stroke-width="1.2" stroke-opacity="0.55"/>'; }
    function fill(d) { return '<path d="' + d + '" fill="' + C.soft + '"/>'; }
    s += '<g transform="translate(' + RB.cx + ' ' + B + ')">';
    // Plinth: two low steps
    s += fill('M-62 0 V-26 H62 V0 Z') + fill('M-47 -26 V-46 H47 V-26 Z');
    s += lit('M-62 -25.5 H62 M-47 -45.5 H47', 1, 0.35) + lit('M61.5 -25 V0 M46.5 -45 V-26', 1.4, 0.85);
    // Pedestal, tapering, carrying an eight-pointed Damascene star in gold
    s += fill('M-36 -46 L-27 -118 H27 L36 -46 Z');
    s += '<path d="M0 -46 V-118 H27 L36 -46 Z" fill="' + C.cream + '" fill-opacity="0.08"/>';
    s += lit('M27 -118 L36 -46', 1.6) + dark('M-36 -46 L-27 -118');
    s += '<path d="M-14 -56 L-11 -108 M14 -56 L11 -108" stroke="' + C.cream + '" stroke-opacity="0.16"/>';
    s += '<g transform="translate(0 -82)" fill="' + C.gold + '">' +
      '<rect x="-8" y="-8" width="16" height="16"/><rect x="-8" y="-8" width="16" height="16" transform="rotate(45)"/>' +
      '<circle r="3.6" fill="' + C.soft + '"/></g>';
    s += fill('M-31 -118 V-127 H31 V-118 Z') + lit('M-31 -126.5 H31 V-118', 1.3, 0.8);
    // Pommel and grip
    s += '<ellipse cx="0" cy="-139" rx="12" ry="10" fill="' + C.soft + '"/>';
    s += fill('M-8 -149 V-188 H8 V-149 Z');
    s += '<path d="M-8 -158 H8 M-8 -168 H8 M-8 -178 H8" stroke="' + C.deep + '" stroke-opacity="0.55"/>';
    s += lit('M7.5 -150 V-187', 1.3, 0.8);
    // Crossguard: gently swept quillons
    s += fill('M-72 -207 Q-36 -188 0 -189 Q36 -188 72 -207 Q75 -209 73.5 -204 Q40 -199 0 -201 Q-40 -199 -73.5 -204 Q-75 -209 -72 -207 Z');
    s += fill('M-12 -186 V-208 H12 V-186 Z') + '<path d="M0 -189 Q36 -188 72 -207 Q40 -199 0 -201 Z" fill="' + C.cream + '" fill-opacity="0.1"/>';
    s += lit('M0 -189 Q36 -188 72 -207', 1.4, 0.85) + lit('M11.5 -187 V-207', 1.3, 0.8) + dark('M0 -189 Q-36 -188 -72 -207');
    // Blade: long and tapering to the point
    var shoulder = top + 72;
    s += fill('M-20 -206 L-15 ' + shoulder + ' Q-11 ' + (top + 26) + ' 0 ' + top + ' Q11 ' + (top + 26) + ' 15 ' + shoulder + ' L20 -206 Z');
    s += '<path d="M0 ' + (top + 8) + ' Q10 ' + (top + 28) + ' 14 ' + shoulder + ' L19 -206 H0 Z" fill="' + C.cream + '" fill-opacity="0.13"/>';
    s += '<path d="M0 ' + (top + 44) + ' V-214" stroke="' + C.deep + '" stroke-width="1.6" stroke-opacity="0.45"/>';
    s += lit('M0 ' + top + ' Q11 ' + (top + 26) + ' 15 ' + shoulder + ' L20 -206', 1.7, 0.95);
    s += dark('M-20 -206 L-15 ' + shoulder + ' Q-11 ' + (top + 26) + ' 0 ' + top);
    return s + '</g>';
  }

  function svg() {
    var r = rng(1945);
    var trails = TRAILS.map(trailPath);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>' +
      '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + C.deep + '"/><stop offset="0.62" stop-color="' + C.green + '"/></linearGradient>' +
      '<linearGradient id="ground" x1="0" y1="' + GROUND_Y + '" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="' + C.green + '"/><stop offset="0.35" stop-color="' + C.deep + '"/></linearGradient>' +
      '<linearGradient id="seam" x1="0" y1="540" x2="0" y2="640" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="' + C.gold + '" stop-opacity="0"/><stop offset="0.6" stop-color="' + C.gold + '" stop-opacity="0.13"/>' +
      '<stop offset="1" stop-color="' + C.gold + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="trail" x1="0" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="' + C.gold + '" stop-opacity="0"/><stop offset="0.5" stop-color="' + C.gold + '" stop-opacity="0.4"/>' +
      '<stop offset="0.86" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.gold + '"/></linearGradient>' +
      '<radialGradient id="moonGlow"><stop offset="0" stop-color="' + C.cream + '" stop-opacity="0.12"/>' +
      '<stop offset="1" stop-color="' + C.cream + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="baseGlow"><stop offset="0" stop-color="' + C.gold + '" stop-opacity="0.22"/>' +
      '<stop offset="1" stop-color="' + C.gold + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<mask id="crescent"><rect width="' + W + '" height="' + H + '" fill="#000"/>' +
      '<circle cx="430" cy="236" r="24" fill="#fff"/><circle cx="440" cy="229" r="22" fill="#000"/></mask>' +
      '</defs>';

    // Sky, moon, stars
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#sky)"/>';
    s += '<circle cx="430" cy="236" r="90" fill="url(#moonGlow)"/>';
    s += '<rect width="' + W + '" height="' + H + '" fill="' + C.cream + '" mask="url(#crescent)"/>';
    s += stars(r);

    // Mount Qasioun with its lights, then the city seam at its foot
    s += '<path d="' + ridgePath(farRidge, GROUND_Y + 10) + '" fill="' + C.soft + '" fill-opacity="0.3"/>';
    s += cityLights(r);
    s += '<path d="' + ridgePath(nearRidge, GROUND_Y + 10) + '" fill="' + C.soft + '" fill-opacity="0.42"/>';
    s += nearLights(r);
    s += '<rect x="0" y="540" width="' + W + '" height="100" fill="url(#seam)"/>';

    // Ground and the roundabout's road ring
    s += '<rect x="0" y="' + GROUND_Y + '" width="' + W + '" height="' + (H - GROUND_Y) + '" fill="url(#ground)"/>';
    s += '<ellipse cx="' + RB.cx + '" cy="' + RB.cy + '" rx="262" ry="' + n(262 * FLAT) + '" fill="' + C.green + '"/>';
    s += '<ellipse cx="' + RB.cx + '" cy="' + (RB.cy - 30) + '" rx="230" ry="130" fill="url(#baseGlow)"/>';

    // Long-exposure light trails: a soft glow pass, then the crisp strokes
    s += '<g fill="none" stroke="url(#trail)" stroke-linecap="round" filter="url(#blur)">';
    TRAILS.forEach(function (t, i) {
      s += '<path d="' + trails[i] + '" stroke-width="' + n(t.w * 3.2) + '" stroke-opacity="' + n(t.o * 0.35 * 100) / 100 + '"/>';
    });
    s += '</g><g fill="none" stroke="url(#trail)" stroke-linecap="round">';
    TRAILS.forEach(function (t, i) {
      s += '<path d="' + trails[i] + '" stroke-width="' + t.w + '" stroke-opacity="' + t.o + '"/>';
    });
    s += '</g>';

    // Roundabout island and fountain basin
    s += '<ellipse cx="' + RB.cx + '" cy="' + RB.cy + '" rx="152" ry="' + n(152 * FLAT) + '" fill="' + C.soft + '"/>';
    s += '<path d="M' + (RB.cx - 152) + ' ' + RB.cy + ' A152 ' + n(152 * FLAT) + ' 0 0 0 ' + (RB.cx + 152) + ' ' + RB.cy +
      '" fill="none" stroke="' + C.cream + '" stroke-opacity="0.4" stroke-width="1.2"/>';
    s += '<ellipse cx="' + RB.cx + '" cy="' + RB.cy + '" rx="132" ry="' + n(132 * FLAT) + '" fill="' + C.green + '"/>';
    s += '<ellipse cx="' + RB.cx + '" cy="' + (RB.cy + 1) + '" rx="120" ry="' + n(120 * FLAT) + '" fill="none" stroke="' + C.cream + '" stroke-opacity="0.18"/>';
    s += '<ellipse cx="' + RB.cx + '" cy="' + (RB.cy + 2) + '" rx="90" ry="' + n(90 * FLAT) + '" fill="none" stroke="' + C.cream + '" stroke-opacity="0.12"/>';
    // Gold light caught on the water
    s += '<g stroke="' + C.gold + '" stroke-linecap="round" fill="none">' +
      '<path d="M' + (RB.cx - 26) + ' ' + (RB.cy + 14) + ' H' + (RB.cx + 34) + '" stroke-opacity="0.55" stroke-width="1.4"/>' +
      '<path d="M' + (RB.cx - 60) + ' ' + (RB.cy + 21) + ' H' + (RB.cx - 22) + ' M' + (RB.cx + 14) + ' ' + (RB.cy + 22) + ' H' + (RB.cx + 66) + '" stroke-opacity="0.35" stroke-width="1.1"/>' +
      '<path d="M' + (RB.cx - 10) + ' ' + (RB.cy + 28) + ' H' + (RB.cx + 24) + '" stroke-opacity="0.25" stroke-width="1"/></g>';

    s += jets(false);
    s += monument();
    s += jets(true);
    s += '</svg>';
    return s;
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function cachedLogo() {
    try { return localStorage.getItem(LOGO_CACHE_KEY); } catch (e) { return null; }
  }
  function cacheLogo(dataUrl) {
    try { localStorage.setItem(LOGO_CACHE_KEY, dataUrl); } catch (e) { /* storage unavailable */ }
  }

  // Prefer a logo the user picked earlier (a data URL never taints the canvas),
  // then the file next to this page.
  function loadLogo() {
    var cached = cachedLogo();
    return (cached ? loadImage(cached) : Promise.resolve(null)).then(function (img) {
      return img || loadImage(LOGO_SRC);
    });
  }

  function fontsReady() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 60px "Kufam"', 'مواقع إلكترونية.'),
      document.fonts.load('500 30px "IBM Plex Sans Arabic"', 'Websites ساحة'),
      document.fonts.load('400 22px "IBM Plex Sans Arabic"', 'موقعك جاهز'),
      document.fonts.load('600 36px "IBM Plex Sans Arabic"', 'Mozury')
    ]).then(function () { return document.fonts.ready; });
  }

  // Shrink a font until the line fits between the right margin and minLeft.
  function fit(ctx, text, weight, size, family, maxW) {
    ctx.font = weight + ' ' + size + 'px ' + family;
    while (ctx.measureText(text).width > maxW && size > 12) {
      size -= 1;
      ctx.font = weight + ' ' + size + 'px ' + family;
    }
    return size;
  }

  function drawText(ctx, logo) {
    var right = SAFE.textRight, maxW = right - SAFE.textMinLeft;
    var KUFAM = '"Kufam", "Cairo", "IBM Plex Sans Arabic", sans-serif';
    var PLEX = '"IBM Plex Sans Arabic", sans-serif';
    ctx.textBaseline = 'alphabetic';

    // Logo (cream, small) — or the wordmark if the file is missing
    var logoTop = 186, logoH = 40;
    if (logo) {
      var lw = logoH * (logo.naturalWidth / logo.naturalHeight);
      ctx.drawImage(logo, right - lw, logoTop, lw, logoH);
    } else {
      ctx.direction = 'ltr';
      ctx.textAlign = 'right';
      ctx.font = '600 36px ' + PLEX;
      var dotW = ctx.measureText('.').width;
      ctx.fillStyle = C.gold;
      ctx.fillText('.', right, logoTop + 32);
      ctx.fillStyle = C.cream;
      ctx.fillText('Mozury', right - dotW, logoTop + 32);
    }

    // Arabic headline, two lines, final full stop in gold
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    var l1 = 'مواقع إلكترونية وأنظمة', l2 = 'لإدارة زبائنك';
    var size = Math.min(fit(ctx, l1, 700, 62, KUFAM, maxW), fit(ctx, l2 + '.', 700, 62, KUFAM, maxW));
    ctx.font = '700 ' + size + 'px ' + KUFAM;
    ctx.fillStyle = C.cream;
    ctx.fillText(l1, right, 312);
    ctx.fillText(l2, right, 312 + size * 1.32);
    var w2 = ctx.measureText(l2).width;
    ctx.fillStyle = C.gold;
    ctx.fillText('.', right - w2, 312 + size * 1.32);

    // English line
    var y = 312 + size * 1.32 + 56;
    ctx.direction = 'ltr';
    var en = 'Websites, CRM & customer care.';
    ctx.font = '500 ' + fit(ctx, en, 500, 30, PLEX, maxW) + 'px ' + PLEX;
    ctx.fillStyle = C.cream;
    ctx.fillText(en, right, y);

    // Offer line
    ctx.direction = 'rtl';
    var offer = 'موقعك جاهز خلال 3 أيام · ادفع الباقي إذا عجبك';
    ctx.font = '400 ' + fit(ctx, offer, 400, 22, PLEX, maxW) + 'px ' + PLEX;
    ctx.globalAlpha = 0.75;
    ctx.fillText(offer, right, y + 46);
    ctx.globalAlpha = 1;

    // Place label under the roundabout
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = '500 19px ' + PLEX;
    ctx.globalAlpha = 0.8;
    ctx.fillText('ساحة الأمويين · Umayyad Square', RB.cx, 758);
    ctx.globalAlpha = 1;
  }

  // Draw the full 1640×924 cover onto a canvas. Resolves with the canvas.
  function render(canvas, logo) {
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg());
    return Promise.all([loadImage(url), fontsReady()]).then(function (res) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(res[0], 0, 0, W, H);
      drawText(ctx, logo);
      return canvas;
    });
  }

  // Save the canvas as PNG. A logo loaded from a local file (file://) taints the
  // canvas, so on SecurityError we ask for the logo file once and retry.
  function download(canvas, onNeedLogo) {
    try {
      canvas.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'mozury-facebook-cover-1640x924.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }, 'image/png');
    } catch (e) {
      if (e && e.name === 'SecurityError' && onNeedLogo) onNeedLogo();
      else throw e;
    }
  }

  // Read a picked logo file into a data URL, remember it, and return the image.
  function useLogoFile(file) {
    return new Promise(function (resolve) {
      var fr = new FileReader();
      fr.onload = function () { cacheLogo(fr.result); loadImage(fr.result).then(resolve); };
      fr.onerror = function () { resolve(null); };
      fr.readAsDataURL(file);
    });
  }

  global.MozuryCover = {
    W: W, H: H, SAFE: SAFE, PROFILE: PROFILE, COLORS: C, LOGO_SRC: LOGO_SRC,
    svg: svg, render: render, loadLogo: loadLogo, download: download, useLogoFile: useLogoFile
  };
})(window);
