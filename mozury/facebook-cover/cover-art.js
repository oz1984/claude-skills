/*
 * Mozury — Facebook cover (1640 × 924)
 * Old Damascus (right) and Amman (left) at night, one continuous scene.
 *
 * Shared by cover.html (the exporter) and preview.html (crop previews).
 * Everything is drawn as one inline SVG so the same markup can be shown
 * full-size, cropped (by changing the viewBox), or rasterised to PNG.
 */
(function () {
  'use strict';

  /* ---------- Brand system ---------- */
  var C = {
    deep: '#0A2E26',   // sky top
    green: '#0F3D33',  // sky bottom
    soft: '#1B5245',   // buildings and hills
    cream: '#F7F3E8',  // text, stone highlights, jasmine, moon
    gold: '#D9A441'    // lights, divider dot, the full stop
  };

  // Headline face: 'Kufam' or 'Cairo'. IBM Plex Sans Arabic is used for everything else.
  var HEADLINE_FONT = 'Kufam';
  var BODY_FONT = 'IBM Plex Sans Arabic';

  var FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Kufam:wght@600;700' +
    '&family=Cairo:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap';

  // The logo is looked up relative to the HTML file, nearest folder first.
  var LOGO_FILE = 'important website things/logo and pics/mozury-logo-cream-transparent.png';
  var LOGO_CANDIDATES = [LOGO_FILE, '../' + LOGO_FILE, '../../' + LOGO_FILE, 'mozury-logo-cream-transparent.png'];

  var W = 1640, H = 924;
  var GY = 700;           // shared horizon / street line for both cities
  var SEAM_X = 820;

  // Safe zones (from the brief)
  var SAFE = { top: 158, bottom: 766, side: 80, profile: { x0: 0, x1: 480, y0: 560, y1: 924 } };
  // Profile picture marker used by the previews: a circle inside the overlap zone.
  var PROFILE_CIRCLE = { cx: 240, cy: 742, r: 182 };

  var HEADLINE = 'مواقع إلكترونية وأنظمة لإدارة زبائنك';
  var SUBLINE = 'Websites, CRM & customer care. Damascus to Amman.';
  var LABEL_DAMASCUS = 'دمشق القديمة · Old Damascus';
  var LABEL_AMMAN = 'عمّان · Amman';

  // Focal points (label x positions sit directly under them)
  var AMMAN_FOCUS_X = 652;
  var DAMASCUS_FOCUS_X = 1150;
  var LABEL_Y = 744;

  /* ---------- helpers ---------- */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Smooth ridge through control points (cosine interpolation).
  function ridge(pts) {
    return function (x) {
      if (x <= pts[0][0]) return pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        if (x <= b[0]) {
          var t = (x - a[0]) / (b[0] - a[0]);
          var s = (1 - Math.cos(Math.PI * t)) / 2;
          return a[1] + (b[1] - a[1]) * s;
        }
      }
      return pts[pts.length - 1][1];
    };
  }
  function ridgePath(fn, x0, x1, bottom) {
    var d = 'M' + x0 + ' ' + bottom + ' ';
    for (var x = x0; x < x1; x += 4) d += 'L' + x + ' ' + r1(fn(x)) + ' ';
    d += 'L' + x1 + ' ' + r1(fn(x1)) + ' L' + x1 + ' ' + bottom + ' Z';
    return d;
  }

  // Dense Amman hillside: terraced rows of cream stone blocks that follow the
  // contour of the hill, with gold windows. Blocks never rise above the crest.
  function hillHouses(fn, x0, x1, bottom, o, rand) {
    var blocks = [], wins = [];
    for (var k = 0; ; k++) {
      var any = false;
      var x = x0 + rand() * o.w[0];
      while (x < x1) {
        var w = o.w[0] + rand() * (o.w[1] - o.w[0]);
        var h = o.h[0] + rand() * (o.h[1] - o.h[0]);
        var crest = Math.max(fn(x), fn(x + w), fn(x + w / 2));
        var y = crest + o.inset + k * o.row + (rand() - 0.5) * o.row * 0.5;
        if (y + h <= bottom) {
          any = true;
          if (rand() > o.skip) blocks.push({ x: x, y: y, w: w, h: h });
        }
        x += w + o.gap[0] + rand() * (o.gap[1] - o.gap[0]);
      }
      if (!any || k > 80) break;
    }
    blocks.sort(function (a, b) { return a.y - b.y; });
    var out = '';
    for (var j = 0; j < blocks.length; j++) {
      var b = blocks[j];
      out += '<rect x="' + r1(b.x) + '" y="' + r1(b.y) + '" width="' + r1(b.w) + '" height="' + r1(b.h) + '" fill="' + C.cream + '"/>';
      // shadow side gives each block volume
      out += '<rect x="' + r1(b.x + b.w * 0.7) + '" y="' + r1(b.y) + '" width="' + r1(b.w * 0.3) + '" height="' + r1(b.h) + '" fill="' + C.soft + '" opacity="0.5"/>';
      if (rand() < o.winP) {
        var nw = (b.w > o.win * 5 && rand() < 0.4) ? 2 : 1;
        for (var m = 0; m < nw; m++) {
          wins.push('<rect x="' + r1(b.x + 1.5 + m * (o.win + 2)) + '" y="' + r1(b.y + b.h * 0.35) + '" width="' + o.win + '" height="' + o.win + '"/>');
        }
      }
    }
    return { blocks: out, windows: wins.join('') };
  }

  // Pointed (lancet) arch outline. L/R = jamb x, sy = springing y, h = rise to apex.
  function pointedArch(L, R, sy, h) {
    var s = R - L, rad = (h * h + s * s / 4) / s, cx = (L + R) / 2;
    return { rad: rad, cx: cx, apexY: sy - h,
      d: 'M' + L + ' ' + sy + ' A' + r1(rad) + ' ' + r1(rad) + ' 0 0 1 ' + cx + ' ' + (sy - h) +
         ' A' + r1(rad) + ' ' + r1(rad) + ' 0 0 1 ' + R + ' ' + sy };
  }

  // Five-petal jasmine flower
  function jasmine(x, y, s, rot) {
    var p = '';
    for (var i = 0; i < 5; i++) {
      var a = (rot + i * 72) * Math.PI / 180;
      p += '<ellipse cx="' + r1(x + Math.cos(a) * s * 0.55) + '" cy="' + r1(y + Math.sin(a) * s * 0.55) + '" rx="' + r1(s * 0.5) + '" ry="' + r1(s * 0.3) +
        '" transform="rotate(' + r1(rot + i * 72) + ' ' + r1(x + Math.cos(a) * s * 0.55) + ' ' + r1(y + Math.sin(a) * s * 0.55) + ')"/>';
    }
    return '<g fill="' + C.cream + '" stroke="' + C.deep + '" stroke-width="0.5">' + p + '</g>' +
      '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(s * 0.22) + '" fill="' + C.gold + '"/>';
  }

  // Old Damascene house: stone ground floor, timber upper floor that overhangs the lane,
  // and a projecting wooden lattice bay window (mashrabiya) glowing gold.
  function damascusHouse(p, o) {
    var x = o.x, w = o.w, gTop = o.groundTop, uTop = o.upperTop, ov = o.overhang;
    var s = '';
    // ground floor (stone)
    s += '<rect x="' + x + '" y="' + gTop + '" width="' + w + '" height="' + (GY - gTop) + '" fill="' + C.soft + '"/>';
    for (var c = gTop + 14; c < GY; c += 14) {
      s += '<line x1="' + x + '" y1="' + c + '" x2="' + (x + w) + '" y2="' + c + '" stroke="' + C.cream + '" stroke-opacity="0.08" stroke-width="1"/>';
    }
    // upper floor overhanging on both sides
    s += '<rect x="' + (x - ov) + '" y="' + uTop + '" width="' + (w + 2 * ov) + '" height="' + (gTop - uTop) + '" fill="' + C.soft + '"/>';
    // lime-plastered timber reads a touch lighter than the stone below
    s += '<rect x="' + (x - ov) + '" y="' + uTop + '" width="' + (w + 2 * ov) + '" height="' + (gTop - uTop) + '" fill="' + C.cream + '" opacity="0.06"/>';
    // timber framing on the upper floor
    var fx0 = x - ov, fx1 = x + w + ov;
    s += '<g stroke="' + C.deep + '" stroke-opacity="0.45" stroke-width="1.2">';
    s += '<line x1="' + fx0 + '" y1="' + (gTop - 3) + '" x2="' + fx1 + '" y2="' + (gTop - 3) + '"/>';
    for (var vx = fx0 + 18; vx < fx1 - 6; vx += 26) {
      s += '<line x1="' + vx + '" y1="' + (uTop + 4) + '" x2="' + vx + '" y2="' + (gTop - 3) + '"/>';
    }
    s += '</g>';
    // brackets under the overhang
    s += '<path d="M' + (x - ov) + ' ' + gTop + ' L' + x + ' ' + gTop + ' L' + x + ' ' + (gTop + 16) + ' Z" fill="' + C.soft + '"/>';
    s += '<path d="M' + (x + w + ov) + ' ' + gTop + ' L' + (x + w) + ' ' + gTop + ' L' + (x + w) + ' ' + (gTop + 16) + ' Z" fill="' + C.soft + '"/>';
    for (var bx = x - ov + 5; bx < x; bx += 7) {
      s += '<rect x="' + bx + '" y="' + gTop + '" width="3" height="3" fill="' + C.cream + '" opacity="0.28"/>';
    }
    for (var bx2 = x + w + 2; bx2 < x + w + ov - 2; bx2 += 7) {
      s += '<rect x="' + bx2 + '" y="' + gTop + '" width="3" height="3" fill="' + C.cream + '" opacity="0.28"/>';
    }
    // wooden eave
    s += '<rect x="' + (fx0 - 7) + '" y="' + (uTop - 6) + '" width="' + (fx1 - fx0 + 14) + '" height="6" fill="' + C.soft + '"/>';
    s += '<line x1="' + (fx0 - 7) + '" y1="' + (uTop - 6) + '" x2="' + (fx1 + 7) + '" y2="' + (uTop - 6) + '" stroke="' + C.cream + '" stroke-opacity="0.3" stroke-width="1"/>';

    // lattice bay windows
    (o.bays || []).forEach(function (b) {
      var bw = b.w, bh = b.h, by = b.y, bxx = b.x;
      s += '<ellipse cx="' + (bxx + bw / 2) + '" cy="' + (by + bh / 2) + '" rx="' + (bw * 1.25) + '" ry="' + (bh * 1.25) + '" fill="url(#' + p + 'glow)" opacity="0.55"/>';
      // projecting frame + supports
      s += '<rect x="' + (bxx - 5) + '" y="' + (by - 6) + '" width="' + (bw + 10) + '" height="' + (bh + 12) + '" fill="' + C.soft + '"/>';
      s += '<path d="M' + (bxx - 5) + ' ' + (by + bh + 6) + ' L' + (bxx + bw + 5) + ' ' + (by + bh + 6) + ' L' + (bxx + bw / 2 + 10) + ' ' + (by + bh + 18) + ' L' + (bxx + bw / 2 - 10) + ' ' + (by + bh + 18) + ' Z" fill="' + C.soft + '"/>';
      s += '<rect x="' + (bxx - 8) + '" y="' + (by - 10) + '" width="' + (bw + 16) + '" height="4" fill="' + C.soft + '"/>';
      s += '<line x1="' + (bxx - 8) + '" y1="' + (by - 10) + '" x2="' + (bxx + bw + 8) + '" y2="' + (by - 10) + '" stroke="' + C.cream + '" stroke-opacity="0.3"/>';
      // glowing panes behind the lattice
      s += '<rect x="' + bxx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="url(#' + p + 'pane)"/>';
      s += '<rect x="' + bxx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="url(#' + p + 'lattice)"/>';
      // mullions
      var panes = Math.max(2, Math.round(bw / 22));
      for (var m = 1; m < panes; m++) {
        var mx = bxx + (bw * m) / panes;
        s += '<line x1="' + r1(mx) + '" y1="' + by + '" x2="' + r1(mx) + '" y2="' + (by + bh) + '" stroke="' + C.soft + '" stroke-width="2.5"/>';
      }
      s += '<line x1="' + bxx + '" y1="' + r1(by + bh * 0.62) + '" x2="' + (bxx + bw) + '" y2="' + r1(by + bh * 0.62) + '" stroke="' + C.soft + '" stroke-width="2"/>';
    });

    // small ground-floor windows and a door
    (o.windows || []).forEach(function (wd) {
      s += '<rect x="' + wd.x + '" y="' + wd.y + '" width="' + wd.w + '" height="' + wd.h + '" rx="1" fill="' + C.gold + '" opacity="0.85"/>';
      s += '<line x1="' + (wd.x + wd.w / 2) + '" y1="' + wd.y + '" x2="' + (wd.x + wd.w / 2) + '" y2="' + (wd.y + wd.h) + '" stroke="' + C.soft + '" stroke-width="1.5"/>';
    });
    if (o.door) {
      var dx = o.door.x, dw = o.door.w, dh = o.door.h;
      s += '<path d="M' + dx + ' ' + GY + ' L' + dx + ' ' + (GY - dh + dw / 2) + ' Q' + (dx + dw / 2) + ' ' + (GY - dh - dw * 0.15) + ' ' + (dx + dw) + ' ' + (GY - dh + dw / 2) + ' L' + (dx + dw) + ' ' + GY + ' Z" fill="' + C.deep + '"/>';
      s += '<circle cx="' + (dx + dw * 0.75) + '" cy="' + (GY - dh * 0.45) + '" r="1.3" fill="' + C.gold + '"/>';
    }
    return s;
  }

  /* ---------- the scene ---------- */
  function buildSVG(opts) {
    opts = opts || {};
    var p = (opts.idPrefix || 'mz') + '-';
    var vb = opts.viewBox || ('0 0 ' + W + ' ' + H);
    var headFont = opts.headlineFont || HEADLINE_FONT;
    var rand = rng(1984);
    var s = [];

    var sizeAttrs = opts.size === 'intrinsic' ? ' width="' + W + '" height="' + H + '"' : ' width="100%"';
    s.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="' + vb + '"' + sizeAttrs +
      ' role="img" aria-label="Mozury Facebook cover: Amman and Old Damascus at night">');

    /* defs */
    s.push('<defs>');
    if (opts.fontCSS) s.push('<style>' + opts.fontCSS + '</style>');
    s.push('<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(1 ' + GY + ')">' +
      '<stop offset="0" stop-color="' + C.deep + '"/><stop offset="1" stop-color="' + C.green + '"/></linearGradient>');
    s.push('<radialGradient id="' + p + 'glow"><stop offset="0" stop-color="' + C.gold + '" stop-opacity="0.55"/>' +
      '<stop offset="0.45" stop-color="' + C.gold + '" stop-opacity="0.18"/><stop offset="1" stop-color="' + C.gold + '" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="' + p + 'softglow"><stop offset="0" stop-color="' + C.gold + '" stop-opacity="0.22"/>' +
      '<stop offset="1" stop-color="' + C.gold + '" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="' + p + 'moonglow"><stop offset="0" stop-color="' + C.cream + '" stop-opacity="0.10"/>' +
      '<stop offset="1" stop-color="' + C.cream + '" stop-opacity="0"/></radialGradient>');
    s.push('<linearGradient id="' + p + 'pane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.gold + '" stop-opacity="0.75"/>' +
      '<stop offset="1" stop-color="' + C.gold + '"/></linearGradient>');
    s.push('<linearGradient id="' + p + 'passage" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + C.gold + '" stop-opacity="0.7"/>' +
      '<stop offset="0.55" stop-color="' + C.gold + '" stop-opacity="0.18"/><stop offset="1" stop-color="' + C.gold + '" stop-opacity="0"/></linearGradient>');
    s.push('<pattern id="' + p + 'lattice" width="6" height="6" patternUnits="userSpaceOnUse">' +
      '<path d="M0 0L6 6M6 0L0 6" stroke="' + C.soft + '" stroke-width="1.15"/></pattern>');
    s.push('<mask id="' + p + 'crescent"><rect x="1380" y="140" width="140" height="140" fill="#000"/>' +
      '<circle cx="1452" cy="212" r="27" fill="#fff"/><circle cx="1463" cy="205" r="24.5" fill="#000"/></mask>');
    s.push('</defs>');

    /* sky */
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#' + p + 'sky)"/>');

    /* stars: faint, kept clear of the text block */
    s.push('<g fill="' + C.cream + '">');
    var starCount = 0, guard = 0;
    while (starCount < 26 && guard++ < 2000) {
      var sx = 40 + rand() * (W - 80), sy = 30 + rand() * 410;
      if (sx > 300 && sx < 1340 && sy > 150 && sy < 395) continue;   // text block
      if (Math.abs(sx - 1452) < 70 && Math.abs(sy - 212) < 70) continue; // moon
      s.push('<circle cx="' + r1(sx) + '" cy="' + r1(sy) + '" r="' + r1(0.7 + rand() * 1.0) + '" opacity="' + r1(0.2 + rand() * 0.4) + '"/>');
      starCount++;
    }
    s.push('</g>');

    /* thin crescent moon */
    s.push('<circle cx="1452" cy="212" r="80" fill="url(#' + p + 'moonglow)"/>');
    s.push('<rect x="1380" y="140" width="140" height="140" fill="' + C.cream + '" mask="url(#' + p + 'crescent)"/>');

    /* far ridge: Amman's outer jabals continuing into Mount Qasioun */
    var far = ridge([[0, 548], [140, 530], [300, 552], [470, 528], [640, 556], [760, 540], [900, 520],
      [1040, 488], [1180, 470], [1320, 476], [1460, 458], [1560, 472], [1640, 466]]);
    s.push('<path d="' + ridgePath(far, 0, W, GY) + '" fill="' + C.soft + '" opacity="0.42"/>');

    // Qasioun's lights climbing the mountain
    s.push('<g fill="' + C.gold + '">');
    for (var q = 0; q < 230; q++) {
      var qx = 880 + rand() * 760;
      var top = far(qx) + 8;
      var qy = top + Math.pow(rand(), 0.55) * (596 - top);
      s.push('<circle cx="' + r1(qx) + '" cy="' + r1(qy) + '" r="' + r1(0.7 + rand() * 1.0) + '" opacity="' + r1(0.35 + rand() * 0.55) + '"/>');
    }
    s.push('</g>');
    s.push('<ellipse cx="1240" cy="600" rx="420" ry="90" fill="url(#' + p + 'softglow)" opacity="0.7"/>');

    /* AMMAN — far hill layer */
    var aFar = ridge([[0, 572], [120, 560], [260, 578], [400, 556], [560, 582], [700, 566], [810, 586]]);
    s.push('<path d="' + ridgePath(aFar, 0, 810, GY) + '" fill="' + C.soft + '" opacity="0.62"/>');
    var hFar = hillHouses(aFar, 0, 800, 660, { w: [4, 7], h: [3, 4.5], row: 5, gap: [1, 4], skip: 0.25, inset: 2, winP: 0.3, win: 1.3 }, rand);
    s.push('<g opacity="0.32">' + hFar.blocks + '</g><g fill="' + C.gold + '" opacity="0.8">' + hFar.windows + '</g>');
    s.push('<ellipse cx="380" cy="660" rx="460" ry="80" fill="url(#' + p + 'softglow)" opacity="0.6"/>');

    /* DAMASCUS — old city roofline, Umayyad dome and minaret (mid distance) */
    var mid = '';
    mid += '<path d="M840 ' + GY + ' L840 640 L900 640 L900 628 L968 628 L968 636 L1040 636 L1040 622 L1100 622 L1100 ' + GY + ' Z"/>';
    mid += '<path d="M1230 ' + GY + ' L1230 630 L1300 630 L1300 618 L1380 618 L1380 612 L1640 612 L1640 ' + GY + ' Z"/>';
    // small domes over the souq roofs
    mid += '<path d="M960 628 a18 16 0 0 1 36 0 Z"/><path d="M1318 618 a14 13 0 0 1 28 0 Z"/>';
    // Umayyad Mosque: Dome of the Eagle on its drum
    mid += '<rect x="1532" y="566" width="62" height="46"/>';
    mid += '<path d="M1528 568 Q1563 512 1598 568 Z"/>';
    mid += '<rect x="1561.5" y="520" width="3" height="10"/>';
    // Minaret of Jesus: square shaft, galleries, pencil spire
    mid += '<rect x="1470" y="500" width="26" height="112"/>';
    mid += '<rect x="1464" y="494" width="38" height="6"/>';
    mid += '<rect x="1474" y="452" width="18" height="42"/>';
    mid += '<rect x="1469" y="447" width="28" height="5"/>';
    mid += '<rect x="1477" y="426" width="12" height="21"/>';
    mid += '<path d="M1475 426 L1483 384 L1491 426 Z"/>';
    mid += '<rect x="1482.3" y="374" width="1.4" height="10"/>';
    s.push('<ellipse cx="1483" cy="470" rx="48" ry="90" fill="url(#' + p + 'softglow)"/>');
    s.push('<g fill="' + C.soft + '" opacity="0.88">' + mid + '</g>');
    // moonlit edge + lit openings on the minaret and dome
    s.push('<g stroke="' + C.cream + '" stroke-opacity="0.22" stroke-width="1"><line x1="1470.5" y1="500" x2="1470.5" y2="612"/><line x1="1474.5" y1="452" x2="1474.5" y2="494"/><line x1="1477.5" y1="426" x2="1477.5" y2="447"/></g>');
    s.push('<g fill="' + C.gold + '">' +
      '<rect x="1480" y="520" width="6" height="11" rx="3"/><rect x="1480" y="548" width="6" height="11" rx="3"/><rect x="1480" y="576" width="6" height="11" rx="3"/>' +
      '<rect x="1480.5" y="462" width="5" height="10" rx="2.5"/><rect x="1481" y="432" width="4" height="8" rx="2"/>' +
      '<rect x="1541" y="584" width="5" height="12" rx="2.5" opacity="0.9"/><rect x="1560" y="584" width="5" height="12" rx="2.5" opacity="0.9"/><rect x="1579" y="584" width="5" height="12" rx="2.5" opacity="0.9"/>' +
      '</g>');
    s.push('<g fill="' + C.gold + '" opacity="0.8">' +
      '<rect x="864" y="652" width="3" height="3"/><rect x="920" y="646" width="3" height="3"/><rect x="1060" y="640" width="3" height="3"/>' +
      '<rect x="1316" y="640" width="3" height="3"/><rect x="1400" y="630" width="3" height="3"/><rect x="1446" y="626" width="3" height="3"/><rect x="1606" y="628" width="3" height="3"/>' +
      '</g>');

    /* AMMAN — middle hill layer */
    var aMid = ridge([[0, 606], [110, 596], [230, 612], [360, 592], [470, 618], [520, 640], [560, 700]]);
    s.push('<path d="' + ridgePath(aMid, 0, 560, GY) + '" fill="' + C.soft + '" opacity="0.85"/>');
    var hMid = hillHouses(aMid, 0, 545, 690, { w: [6, 11], h: [5, 7], row: 7.5, gap: [2, 5], skip: 0.18, inset: 3, winP: 0.4, win: 1.8 }, rand);
    s.push('<g opacity="0.5">' + hMid.blocks + '</g><g fill="' + C.gold + '" opacity="0.9">' + hMid.windows + '</g>');

    /* AMMAN — Citadel hill (Jabal al-Qal'a) */
    var cit = ridge([[470, 700], [520, 640], [570, 586], [610, 566], [720, 566], [760, 590], [800, 640], [826, 700]]);
    s.push('<path d="' + ridgePath(cit, 470, 826, GY) + '" fill="' + C.soft + '"/>');
    // retaining wall courses along the plateau
    s.push('<path d="M592 576 L740 576" stroke="' + C.cream + '" stroke-opacity="0.22" stroke-width="1"/>');
    s.push('<path d="M578 586 L752 586" stroke="' + C.cream + '" stroke-opacity="0.12" stroke-width="1"/>');

    // Temple of Hercules: floodlit columns
    s.push('<ellipse cx="652" cy="560" rx="120" ry="70" fill="url(#' + p + 'glow)" opacity="0.75"/>');
    var colBase = 564, colTop = 440;
    var cols = [{ x: 600, top: colTop }, { x: 634, top: colTop }, { x: 690, top: colTop + 14 }];
    var t = '';
    // podium steps
    t += '<rect x="584" y="' + (colBase - 4) + '" width="134" height="6" fill="' + C.cream + '" opacity="0.55"/>';
    t += '<rect x="590" y="' + (colBase - 8) + '" width="122" height="4" fill="' + C.cream + '" opacity="0.4"/>';
    cols.forEach(function (c) {
      var cw = 13, ct = c.top;
      t += '<rect x="' + (c.x - 2.5) + '" y="' + (colBase - 14) + '" width="' + (cw + 5) + '" height="6" fill="' + C.cream + '"/>';  // base
      t += '<path d="M' + c.x + ' ' + (colBase - 14) + ' L' + (c.x + 0.8) + ' ' + (ct + 14) + ' L' + (c.x + cw - 0.8) + ' ' + (ct + 14) + ' L' + (c.x + cw) + ' ' + (colBase - 14) + ' Z" fill="' + C.cream + '"/>';
      t += '<rect x="' + (c.x + cw * 0.66) + '" y="' + (ct + 14) + '" width="' + r1(cw * 0.3) + '" height="' + (colBase - 14 - ct - 14) + '" fill="' + C.soft + '" opacity="0.32"/>';
      t += '<line x1="' + (c.x + 4.5) + '" y1="' + (ct + 16) + '" x2="' + (c.x + 4.5) + '" y2="' + (colBase - 16) + '" stroke="' + C.soft + '" stroke-opacity="0.28" stroke-width="0.8"/>';
      // Corinthian capital
      t += '<path d="M' + (c.x - 0.5) + ' ' + (ct + 14) + ' L' + (c.x - 4) + ' ' + (ct + 5) + ' L' + (c.x + cw + 4) + ' ' + (ct + 5) + ' L' + (c.x + cw + 0.5) + ' ' + (ct + 14) + ' Z" fill="' + C.cream + '"/>';
      t += '<rect x="' + (c.x - 5) + '" y="' + ct + '" width="' + (cw + 10) + '" height="5" fill="' + C.cream + '"/>';
      t += '<path d="M' + (c.x - 2) + ' ' + (ct + 9) + ' L' + (c.x + cw + 2) + ' ' + (ct + 9) + '" stroke="' + C.soft + '" stroke-opacity="0.35" stroke-width="0.8"/>';
    });
    // surviving architrave over the paired columns
    t += '<rect x="594" y="' + (colTop - 12) + '" width="58" height="12" fill="' + C.cream + '"/>';
    t += '<rect x="594" y="' + (colTop - 4) + '" width="58" height="2" fill="' + C.soft + '" opacity="0.3"/>';
    t += '<path d="M592 ' + (colTop - 12) + ' L654 ' + (colTop - 12) + ' L652 ' + (colTop - 15) + ' L594 ' + (colTop - 15) + ' Z" fill="' + C.cream + '" opacity="0.85"/>';
    // fallen drums on the plateau
    t += '<rect x="724" y="556" width="16" height="7" rx="2" fill="' + C.cream + '" opacity="0.55"/>';
    t += '<rect x="744" y="559" width="10" height="5" rx="1.5" fill="' + C.cream + '" opacity="0.45"/>';
    t += '<rect x="566" y="560" width="11" height="5" rx="1.5" fill="' + C.cream + '" opacity="0.45"/>';
    s.push('<g data-check="Amman columns (Temple of Hercules)" data-min-x="520">' + t + '</g>');

    // Roman Theatre at the foot of the hill: nested tiers of the cavea
    var thx = 652, thBase = 698;
    var th = '';
    th += '<ellipse cx="' + thx + '" cy="' + (thBase + 4) + '" rx="150" ry="34" fill="url(#' + p + 'glow)" opacity="0.6"/>';
    th += '<path d="M' + (thx - 124) + ' ' + thBase + ' Q' + (thx - 120) + ' 628 ' + thx + ' 622 Q' + (thx + 120) + ' 628 ' + (thx + 124) + ' ' + thBase + ' Z" fill="' + C.soft + '"/>';
    for (var row = 0; row < 9; row++) {
      var rx = 52 + row * 8.6, rtop = thBase - 10 - row * 7.6;
      th += '<path d="M' + r1(thx - rx) + ' ' + thBase + ' Q' + r1(thx - rx) + ' ' + r1(rtop) + ' ' + thx + ' ' + r1(rtop) + ' Q' + r1(thx + rx) + ' ' + r1(rtop) + ' ' + r1(thx + rx) + ' ' + thBase + '" fill="none" stroke="' + C.cream + '" stroke-opacity="' + r1(0.62 - row * 0.035) + '" stroke-width="1.6"/>';
    }
    // aisles
    th += '<g stroke="' + C.soft + '" stroke-width="2.4">';
    [-0.55, 0, 0.55].forEach(function (k) {
      th += '<line x1="' + r1(thx + k * 48) + '" y1="' + (thBase - 8) + '" x2="' + r1(thx + k * 112) + '" y2="' + (thBase - 70) + '"/>';
    });
    th += '</g>';
    // orchestra and stage line
    th += '<path d="M' + (thx - 46) + ' ' + thBase + ' Q' + thx + ' ' + (thBase - 26) + ' ' + (thx + 46) + ' ' + thBase + ' Z" fill="' + C.gold + '" opacity="0.28"/>';
    th += '<rect x="' + (thx - 138) + '" y="' + (thBase - 3) + '" width="276" height="5" fill="' + C.cream + '" opacity="0.35"/>';
    // colonnade along the front of the stage
    for (var sc = -5; sc <= 5; sc++) {
      if (sc === 0) continue;
      var scx = thx + sc * 21;
      th += '<rect x="' + r1(scx - 1.6) + '" y="' + (thBase - 21) + '" width="3.2" height="18" fill="' + C.cream + '" opacity="0.8"/>';
      th += '<rect x="' + r1(scx - 3) + '" y="' + (thBase - 23) + '" width="6" height="2.4" fill="' + C.cream + '" opacity="0.8"/>';
    }
    s.push(th);

    /* AMMAN — front hill (bottom-left; sits under the profile picture, decoration only) */
    var aNear = ridge([[0, 640], [120, 628], [260, 646], [380, 640], [470, 668], [520, 700]]);
    s.push('<path d="' + ridgePath(aNear, 0, 520, GY) + '" fill="' + C.soft + '"/>');
    var hNear = hillHouses(aNear, 0, 505, 700, { w: [9, 15], h: [7, 10], row: 10.5, gap: [2, 6], skip: 0.12, inset: 3, winP: 0.5, win: 2.4 }, rand);
    s.push('<g opacity="0.72">' + hNear.blocks + '</g><g fill="' + C.gold + '">' + hNear.windows + '</g>');

    /* DAMASCUS — houses flanking the gate */
    s.push(damascusHouse(p, {
      x: 884, w: 140, groundTop: 606, upperTop: 528, overhang: 22,
      bays: [{ x: 902, y: 546, w: 74, h: 40 }],
      windows: [{ x: 990, y: 628, w: 10, h: 14 }],
      door: { x: 896, w: 26, h: 54 }
    }));
    s.push(damascusHouse(p, {
      x: 1276, w: 128, groundTop: 598, upperTop: 510, overhang: 22,
      bays: [{ x: 1292, y: 528, w: 86, h: 44 }],
      windows: [{ x: 1288, y: 626, w: 10, h: 14 }, { x: 1382, y: 626, w: 10, h: 14 }],
      door: { x: 1326, w: 28, h: 58 }
    }));
    s.push(damascusHouse(p, {
      x: 1466, w: 140, groundTop: 640, upperTop: 592, overhang: 14,
      bays: [{ x: 1500, y: 602, w: 60, h: 28 }],
      windows: [],
      door: null
    }));

    /* DAMASCUS — ablaq archway (focal point) */
    var gx0 = 1066, gx1 = 1234, gTop = 476;
    var opening = pointedArch(1106, 1194, 598, 82);
    var ring = pointedArch(1096, 1204, 598, 92);
    var g = '';
    g += '<ellipse cx="1150" cy="640" rx="150" ry="110" fill="url(#' + p + 'glow)" opacity="0.5"/>';
    g += '<clipPath id="' + p + 'gateclip"><rect x="' + gx0 + '" y="' + gTop + '" width="' + (gx1 - gx0) + '" height="' + (GY - gTop) + '"/></clipPath>';
    g += '<g clip-path="url(#' + p + 'gateclip)">';
    g += '<rect x="' + gx0 + '" y="' + gTop + '" width="' + (gx1 - gx0) + '" height="' + (GY - gTop) + '" fill="' + C.soft + '"/>';
    var band = 0;
    for (var by = gTop; by < GY; by += 13) {
      if (band++ % 2 === 1) g += '<rect x="' + gx0 + '" y="' + by + '" width="' + (gx1 - gx0) + '" height="13" fill="' + C.cream + '" opacity="0.6"/>';
    }
    g += '</g>';
    // voussoirs: alternating cream / green stones around the arch
    g += '<path d="' + ring.d + '" fill="none" stroke="' + C.soft + '" stroke-width="20"/>';
    g += '<path d="' + ring.d + '" fill="none" stroke="' + C.cream + '" stroke-width="20" stroke-dasharray="9 9" stroke-dashoffset="4"/>';
    g += '<path d="' + pointedArch(1086, 1214, 598, 102).d + '" fill="none" stroke="' + C.cream + '" stroke-opacity="0.45" stroke-width="1.2"/>';
    // opening: a lit passage beyond
    var openD = 'M1106 ' + GY + ' L' + opening.d.slice(1) + ' L1194 ' + GY + ' Z';
    g += '<path d="' + openD + '" fill="' + C.deep + '"/>';
    g += '<path d="' + openD + '" fill="url(#' + p + 'passage)"/>';
    g += '<path d="M1128 ' + GY + ' L1128 640 Q1150 612 1172 640 L1172 ' + GY + ' Z" fill="' + C.gold + '" opacity="0.22"/>';
    // cornice
    g += '<rect x="' + (gx0 - 8) + '" y="' + (gTop - 9) + '" width="' + (gx1 - gx0 + 16) + '" height="9" fill="' + C.cream + '" opacity="0.85"/>';
    g += '<rect x="' + (gx0 - 4) + '" y="' + (gTop - 15) + '" width="' + (gx1 - gx0 + 8) + '" height="6" fill="' + C.soft + '"/>';
    for (var dx = gx0 - 2; dx < gx1; dx += 10) g += '<rect x="' + dx + '" y="' + (gTop - 2) + '" width="5" height="4" fill="' + C.soft + '"/>';
    // hanging lantern
    var lx = 1150, ly0 = opening.apexY + 2;
    g += '<circle cx="' + lx + '" cy="' + (ly0 + 46) + '" r="44" fill="url(#' + p + 'glow)"/>';
    g += '<line x1="' + lx + '" y1="' + ly0 + '" x2="' + lx + '" y2="' + (ly0 + 30) + '" stroke="' + C.cream + '" stroke-opacity="0.6" stroke-width="1"/>';
    g += '<path d="M' + (lx - 7) + ' ' + (ly0 + 36) + ' L' + lx + ' ' + (ly0 + 29) + ' L' + (lx + 7) + ' ' + (ly0 + 36) + ' Z" fill="' + C.soft + '" stroke="' + C.cream + '" stroke-opacity="0.5" stroke-width="0.8"/>';
    g += '<path d="M' + (lx - 7) + ' ' + (ly0 + 36) + ' L' + (lx + 7) + ' ' + (ly0 + 36) + ' L' + (lx + 5.5) + ' ' + (ly0 + 54) + ' L' + (lx - 5.5) + ' ' + (ly0 + 54) + ' Z" fill="' + C.gold + '"/>';
    g += '<line x1="' + lx + '" y1="' + (ly0 + 36) + '" x2="' + lx + '" y2="' + (ly0 + 54) + '" stroke="' + C.soft + '" stroke-width="1"/>';
    g += '<path d="M' + (lx - 5.5) + ' ' + (ly0 + 54) + ' L' + (lx + 5.5) + ' ' + (ly0 + 54) + ' L' + lx + ' ' + (ly0 + 61) + ' Z" fill="' + C.soft + '" stroke="' + C.cream + '" stroke-opacity="0.5" stroke-width="0.8"/>';
    s.push('<g data-check="Damascus archway">' + g + '</g>');

    // jasmine vine trailing over the arch
    var v = '';
    var vine = 'M1056 640 C1050 600 1062 560 1078 530 C1092 506 1112 492 1136 486 C1160 480 1186 486 1206 498 C1222 508 1236 520 1244 546';
    var vine2 = 'M1078 530 C1070 516 1064 500 1066 482 M1206 498 C1214 486 1226 478 1240 476 M1100 500 C1104 520 1102 538 1096 556';
    v += '<path d="' + vine + '" fill="none" stroke="' + C.deep + '" stroke-width="2.4" stroke-linecap="round"/>';
    v += '<path d="' + vine2 + '" fill="none" stroke="' + C.deep + '" stroke-width="1.6" stroke-linecap="round"/>';
    var leaves = [[1057, 612, -30], [1060, 584, 20], [1066, 560, -40], [1074, 540, 30], [1084, 520, -20], [1096, 506, 40], [1112, 494, -10], [1124, 489, 50],
      [1146, 484, -40], [1168, 484, 30], [1186, 488, -30], [1200, 494, 60], [1216, 504, -20], [1230, 516, 40], [1240, 532, -50], [1068, 500, 10], [1098, 540, 70], [1226, 480, -60]];
    leaves.forEach(function (lf, i) {
      v += '<ellipse cx="' + lf[0] + '" cy="' + lf[1] + '" rx="5.5" ry="2.6" transform="rotate(' + lf[2] + ' ' + lf[0] + ' ' + lf[1] + ')" fill="' + (i % 3 === 0 ? C.soft : C.deep) + '"/>';
    });
    var flowers = [[1062, 596, 5], [1070, 552, 4.4], [1080, 530, 5], [1092, 512, 4], [1106, 498, 5.2], [1132, 488, 4.6], [1156, 482, 5],
      [1178, 486, 4.4], [1194, 492, 5.2], [1210, 500, 4.2], [1236, 524, 5], [1243, 548, 4.4], [1066, 484, 4.2], [1240, 476, 4.6], [1098, 548, 4], [1054, 628, 4.4]];
    flowers.forEach(function (fl, i) { v += jasmine(fl[0], fl[1], fl[2], i * 23); });
    s.push(v);

    /* street / ground shared by both cities */
    s.push('<rect x="0" y="' + GY + '" width="' + W + '" height="' + (H - GY) + '" fill="' + C.deep + '"/>');
    s.push('<line x1="0" y1="' + (GY + 0.5) + '" x2="' + W + '" y2="' + (GY + 0.5) + '" stroke="' + C.cream + '" stroke-opacity="0.16" stroke-width="1"/>');
    // warm light spilling onto the street
    s.push('<ellipse cx="1150" cy="' + (GY + 6) + '" rx="120" ry="18" fill="url(#' + p + 'glow)" opacity="0.6"/>');
    s.push('<ellipse cx="652" cy="' + (GY + 6) + '" rx="130" ry="16" fill="url(#' + p + 'glow)" opacity="0.4"/>');
    // faint reflected lights below the horizon
    s.push('<g fill="' + C.gold + '" opacity="0.18">');
    for (var rl = 0; rl < 40; rl++) {
      var rlx = 40 + rand() * (W - 80);
      s.push('<rect x="' + r1(rlx) + '" y="' + r1(GY + 14 + rand() * 30) + '" width="' + r1(2 + rand() * 8) + '" height="1"/>');
    }
    s.push('</g>');

    /* centre seam: the post divider, rotated vertical */
    s.push('<line x1="' + SEAM_X + '" y1="430" x2="' + SEAM_X + '" y2="760" stroke="' + C.cream + '" stroke-opacity="0.3" stroke-width="1.5"/>');
    s.push('<circle cx="' + SEAM_X + '" cy="595" r="5" fill="' + C.gold + '"/>');

    /* labels */
    s.push('<g font-family="\'' + BODY_FONT + '\', sans-serif" font-size="22" font-weight="500" fill="' + C.cream + '" fill-opacity="0.8" text-anchor="middle">');
    s.push('<text data-check="Amman label" data-min-x="520" x="' + AMMAN_FOCUS_X + '" y="' + LABEL_Y + '" direction="ltr">' + esc(LABEL_AMMAN) + '</text>');
    s.push('<text data-check="Old Damascus label" x="' + DAMASCUS_FOCUS_X + '" y="' + LABEL_Y + '" direction="ltr">' + esc(LABEL_DAMASCUS) + '</text>');
    s.push('</g>');

    /* logo */
    var logoBox = { x: 730, y: 176, w: 180, h: 56 };
    if (opts.logo) {
      s.push('<image data-check="Logo" href="' + esc(opts.logo) + '" xlink:href="' + esc(opts.logo) + '" x="' + logoBox.x + '" y="' + logoBox.y + '" width="' + logoBox.w + '" height="' + logoBox.h + '" preserveAspectRatio="xMidYMid meet"/>');
    } else {
      // Fallback wordmark, used only when the logo PNG can't be found.
      s.push('<text data-check="Logo" x="820" y="220" text-anchor="middle" font-family="\'' + BODY_FONT + '\', sans-serif" font-size="40" font-weight="600" fill="' + C.cream + '" letter-spacing="0.5">Mozury<tspan fill="' + C.gold + '">.</tspan></text>');
    }

    /* headline + subline */
    s.push('<text data-check="Arabic headline" x="820" y="318" text-anchor="middle" direction="rtl" font-family="\'' + headFont + '\', sans-serif" font-size="' + (headFont === 'Cairo' ? 64 : 60) + '" font-weight="700" fill="' + C.cream + '">' +
      esc(HEADLINE) + '<tspan fill="' + C.gold + '">.</tspan></text>');
    s.push('<text data-check="English line" x="820" y="370" text-anchor="middle" direction="ltr" font-family="\'' + BODY_FONT + '\', sans-serif" font-size="26" font-weight="400" fill="' + C.cream + '" fill-opacity="0.88" letter-spacing="0.2">' +
      esc(SUBLINE) + '</text>');

    /* preview-only overlays */
    if (opts.overlay) s.push(opts.overlay);

    s.push('</svg>');
    return s.join('');
  }

  /* ---------- logo resolution ---------- */
  var state = { logoSrc: null, logoDataURL: null, fontCSS: null };

  function tryImage(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = encodeURI(src);
    });
  }
  function imageToDataURL(im) {
    try {
      var c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      return c.toDataURL('image/png'); // throws if tainted (e.g. opened from file://)
    } catch (e) { return null; }
  }
  function findLogo() {
    var i = 0;
    function next() {
      if (i >= LOGO_CANDIDATES.length) return Promise.resolve(null);
      var src = LOGO_CANDIDATES[i++];
      return tryImage(src).then(function (im) {
        if (!im) return next();
        state.logoSrc = encodeURI(src);
        state.logoDataURL = imageToDataURL(im);
        return state.logoSrc;
      });
    }
    return next();
  }
  function setLogoFromFile(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { state.logoDataURL = fr.result; state.logoSrc = fr.result; res(fr.result); };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  /* ---------- PNG export ---------- */
  function b64(buf) {
    var bytes = new Uint8Array(buf), bin = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  function embeddedFontCSS() {
    if (state.fontCSS) return Promise.resolve(state.fontCSS);
    return fetch(FONT_CSS_URL).then(function (r) { return r.text(); }).then(function (css) {
      var re = /(?:\/\*\s*([\w-]+)\s*\*\/\s*)?(@font-face\s*\{[^}]*\})/g, m, blocks = [];
      while ((m = re.exec(css))) {
        if (!m[1] || ['arabic', 'latin', 'latin-ext'].indexOf(m[1]) !== -1) blocks.push(m[2]);
      }
      return Promise.all(blocks.map(function (block) {
        var um = block.match(/url\(([^)]+)\)/);
        if (!um) return block;
        var url = um[1].replace(/["']/g, '');
        return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var type = /\.woff2/.test(url) ? 'font/woff2' : /\.woff/.test(url) ? 'font/woff' : 'font/ttf';
          return block.replace(um[0], 'url(data:' + type + ';base64,' + b64(buf) + ')');
        });
      }));
    }).then(function (list) { state.fontCSS = list.join('\n'); return state.fontCSS; });
  }

  function renderPNG(opts) {
    opts = opts || {};
    return embeddedFontCSS().then(function (css) {
      var svg = buildSVG({ idPrefix: 'exp', size: 'intrinsic', logo: state.logoDataURL, fontCSS: css, headlineFont: opts.headlineFont });
      var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      return new Promise(function (res, rej) {
        var im = new Image();
        im.onload = function () {
          // short pause so embedded fonts are applied before rasterising
          setTimeout(function () {
            var c = document.createElement('canvas');
            c.width = W; c.height = H;
            var ctx = c.getContext('2d');
            ctx.drawImage(im, 0, 0, W, H);
            c.toBlob(function (blob) { blob ? res(blob) : rej(new Error('PNG encode failed')); }, 'image/png');
          }, 300);
        };
        im.onerror = function () { rej(new Error('SVG failed to load for rasterising')); };
        im.src = url;
      });
    });
  }
  function downloadPNG(opts) {
    return renderPNG(opts).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mozury-facebook-cover-1640x924.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  }

  window.MozuryCover = {
    W: W, H: H, SAFE: SAFE, PROFILE_CIRCLE: PROFILE_CIRCLE, COLORS: C,
    HEADLINE_FONT: HEADLINE_FONT, LOGO_FILE: LOGO_FILE,
    buildSVG: buildSVG, findLogo: findLogo, setLogoFromFile: setLogoFromFile,
    renderPNG: renderPNG, downloadPNG: downloadPNG, state: state
  };
})();
