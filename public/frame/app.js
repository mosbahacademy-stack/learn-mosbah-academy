/* قالب الصور — جبهة المستقبل، المكتب البلدي لمتليلي الشعانبة، القائمة رقم 3 */
(() => {
  'use strict';

  const TEXT_PARTY = 'جبهة المستقبل';
  const TEXT_OFFICE = 'المكتب البلدي لمتليلي الشعانبة';
  const TEXT_LIST_LABEL = 'القائمة رقم';
  const TEXT_LIST_NUM = '3';
  const DEFAULT_HASHTAG = '#جبهة_المستقبل #متليلي_الشعانبة #القائمة_3';
  const FONT = "'Camel', Cairo, Tahoma, Arial, sans-serif";
  const GREEN = [10, 122, 59];
  const MAX_SIDE = 2160;
  const LOGO_KEY = 'frame-logo-v1';
  const LOGO_FILES = ['logo.png', 'logo.jpg', 'logo.webp', 'logo.svg'];

  const $ = id => document.getElementById(id);
  const preview = $('preview');
  const status = $('status');
  const opts = { autoFix: $('autoFix'), gradH: $('gradH'), gradA: $('gradA'), hashtag: $('hashtag') };
  opts.hashtag.value = DEFAULT_HASHTAG;

  let logoImg = null;
  let sources = [];   // loaded source images (HTMLImageElement/ImageBitmap)
  let results = [];   // { canvas, name }

  const setStatus = t => { status.textContent = t || ''; };

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  async function fileToImage(file) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fallback */ }
    }
    const url = URL.createObjectURL(file);
    try { return await loadImage(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }

  // ---------- Logo ----------
  async function initLogo() {
    try {
      const saved = localStorage.getItem(LOGO_KEY);
      if (saved) { logoImg = await loadImage(saved); return; }
    } catch (_) { /* storage unavailable */ }
    for (const f of LOGO_FILES) {
      try { logoImg = await loadImage(f + '?v=1'); return; } catch (_) { /* try next */ }
    }
    setStatus('لم يتم العثور على شعار الحزب — اضغط "تغيير شعار الحزب" لاختياره مرة واحدة.');
  }

  async function setLogoFromFile(file) {
    const img = await fileToImage(file);
    const scale = Math.min(1, 600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/png');
    try { localStorage.setItem(LOGO_KEY, url); } catch (_) { /* keep in memory only */ }
    logoImg = await loadImage(url);
    setStatus('تم حفظ الشعار ✓');
    renderAll();
  }

  // ---------- Auto color & light correction ----------
  function autoCorrect(ctx, w, h) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const n = w * h;
    const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
    const step = n > 2e6 ? 4 : 1; // sample for speed
    let count = 0;
    for (let i = 0; i < d.length; i += 4 * step) {
      hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; count++;
    }
    const pct = (hh, p) => {
      const target = count * p; let acc = 0;
      for (let v = 0; v < 256; v++) { acc += hh[v]; if (acc >= target) return v; }
      return 255;
    };

    // 1) Per-channel levels stretch (fixes white balance + contrast), limited to stay natural
    const luts = [0, 1, 2].map(c => {
      let lo = pct(hist[c], 0.005), hi = pct(hist[c], 0.995);
      if (hi - lo < 60) { const mid = (hi + lo) / 2; lo = Math.max(0, mid - 30); hi = Math.min(255, mid + 30); }
      lo = Math.min(lo, 60); hi = Math.max(hi, 190);
      const lut = new Float32Array(256);
      for (let v = 0; v < 256; v++) lut[v] = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
      return lut;
    });

    // 2) Exposure: gamma so mean luminance moves toward ~0.48
    let sum = 0, m = 0;
    for (let i = 0; i < d.length; i += 16 * step) {
      sum += 0.2126 * luts[0][d[i]] + 0.7152 * luts[1][d[i + 1]] + 0.0722 * luts[2][d[i + 2]]; m++;
    }
    const mean = Math.min(0.95, Math.max(0.05, sum / m));
    let gamma = Math.log(0.48) / Math.log(mean);
    gamma = Math.min(1.35, Math.max(0.65, gamma));
    gamma = 1 + (gamma - 1) * 0.75; // soften

    const final = luts.map(l => {
      const out = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) out[v] = Math.round(255 * Math.pow(l[v], gamma));
      return out;
    });

    // 3) Apply LUT + gentle saturation boost
    const sat = 1.12;
    for (let i = 0; i < d.length; i += 4) {
      let r = final[0][d[i]], g = final[1][d[i + 1]], b = final[2][d[i + 2]];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = y + (r - y) * sat; d[i + 1] = y + (g - y) * sat; d[i + 2] = y + (b - y) * sat;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // ---------- Template ----------
  function fitFont(ctx, text, weight, size, maxW) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const w = ctx.measureText(text).width;
    if (w > maxW) { size = Math.floor(size * maxW / w); ctx.font = `${weight} ${size}px ${FONT}`; }
    return size;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTemplate(ctx, W, H) {
    const s = Math.min(W, H) / 1080;
    const gH = H * (+opts.gradH.value / 100);
    const a = +opts.gradA.value / 100;
    const [R, G, B] = GREEN;

    // Subtle eased gradient: dense only at the very bottom, fading quickly upward
    const grad = ctx.createLinearGradient(0, H, 0, H - gH);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      grad.addColorStop(t, `rgba(${R},${G},${B},${(a * Math.pow(1 - t, 2.2)).toFixed(3)})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - gH, W, gH);

    // Soft dark base for text legibility (very light)
    const shade = ctx.createLinearGradient(0, H, 0, H - gH * 0.6);
    shade.addColorStop(0, 'rgba(0,0,0,0.22)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, H - gH * 0.6, W, gH * 0.6);

    // Thin brand strip at the bottom edge (green + red)
    const stripH = Math.max(3, 7 * s);
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(0, H - stripH, W, stripH);
    ctx.fillStyle = '#d6262b';
    ctx.fillRect(W * 0.72, H - stripH, W * 0.28, stripH);

    const pad = 34 * s, gap = 18 * s;
    const rowH = 104 * s;
    const baseY = H - stripH - 30 * s;  // bottom of the content row
    const top = baseY - rowH;
    ctx.direction = 'rtl';
    ctx.textBaseline = 'alphabetic';

    // Logo on a frosted white card — right side
    let rightEdge = W - pad;
    if (logoImg) {
      const ch = rowH, inner = 12 * s;
      const k = (ch - 2 * inner) / logoImg.height;
      const dw = logoImg.width * k, dh = logoImg.height * k;
      const cw = dw + 2 * inner * 1.4;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18 * s; ctx.shadowOffsetY = 4 * s;
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      roundRect(ctx, rightEdge - cw, top, cw, ch, 16 * s);
      ctx.fill();
      ctx.restore();
      ctx.drawImage(logoImg, rightEdge - cw + (cw - dw) / 2, top + (ch - dh) / 2, dw, dh);
      rightEdge -= cw + gap;
    }

    // List number — compact white badge, left side
    const bw = 92 * s, bh = rowH;
    const bx = pad, by = top;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18 * s; ctx.shadowOffsetY = 4 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundRect(ctx, bx, by, bw, bh, 16 * s);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(bx + 18 * s, by + bh - 11 * s, bw - 36 * s, 4 * s); // green accent inside badge
    ctx.textAlign = 'center';
    fitFont(ctx, TEXT_LIST_LABEL, 500, 19 * s, bw - 12 * s);
    ctx.fillText(TEXT_LIST_LABEL, bx + bw / 2, by + 30 * s);
    ctx.font = `700 ${66 * s}px ${FONT}`;
    ctx.fillText(TEXT_LIST_NUM, bx + bw / 2, by + bh - 18 * s);

    // Vertical hairline + texts
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillRect(rightEdge, top + 10 * s, 2 * s, rowH - 20 * s);
    rightEdge -= gap;
    const textMax = rightEdge - (bx + bw + gap);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 1.5 * s;
    fitFont(ctx, TEXT_PARTY, 700, 40 * s, textMax);
    ctx.fillText(TEXT_PARTY, rightEdge, top + 46 * s);
    fitFont(ctx, TEXT_OFFICE, 500, 27 * s, textMax);
    ctx.fillText(TEXT_OFFICE, rightEdge, baseY - 14 * s);

    // Hashtag — small, above the row, aligned right
    const tag = (opts.hashtag.value || '').trim();
    if (tag) {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      fitFont(ctx, tag, 500, 21 * s, W - 2 * pad);
      ctx.fillText(tag, W - pad, top - 16 * s);
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  function processImage(src) {
    const k = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
    const W = Math.round(src.width * k), H = Math.round(src.height * k);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, W, H);
    if (opts.autoFix.checked) autoCorrect(ctx, W, H);
    drawTemplate(ctx, W, H);
    return c;
  }

  function renderAll() {
    if (!sources.length) return;
    results = sources.map(({ img, name }) => ({ canvas: processImage(img), name }));
    preview.innerHTML = '';
    results.forEach(r => preview.appendChild(r.canvas));
    preview.style.flexDirection = 'column';
    preview.style.gap = '8px';
    $('save').disabled = $('share').disabled = false;
  }

  const toBlob = c => new Promise(res => c.toBlob(res, 'image/jpeg', 0.93));
  const outName = (name, i) => `jabha-mostakbal-${(name || 'photo').replace(/\.[^.]+$/, '')}-${i + 1}.jpg`;

  async function handleFiles(files) {
    if (!files || !files.length) return;
    setStatus('جاري المعالجة…');
    try { await Promise.all([document.fonts.load("700 40px 'Camel'"), document.fonts.load("500 40px 'Camel'")]); } catch (_) { /* fallback font */ }
    sources = [];
    for (const f of files) {
      try { sources.push({ img: await fileToImage(f), name: f.name }); } catch (_) { /* skip unreadable */ }
    }
    renderAll();
    setStatus(results.length ? `تمت معالجة ${results.length} صورة ✓` : 'تعذر قراءة الصورة');
  }

  async function save() {
    for (let i = 0; i < results.length; i++) {
      const blob = await toBlob(results[i].canvas);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = outName(results[i].name, i);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  }

  async function share() {
    const files = [];
    for (let i = 0; i < results.length; i++) {
      files.push(new File([await toBlob(results[i].canvas)], outName(results[i].name, i), { type: 'image/jpeg' }));
    }
    if (navigator.canShare && navigator.canShare({ files })) {
      try { await navigator.share({ files, title: TEXT_PARTY, text: `${TEXT_PARTY} — ${TEXT_OFFICE} — ${TEXT_LIST_LABEL} ${TEXT_LIST_NUM}` }); }
      catch (_) { /* cancelled */ }
    } else {
      setStatus('المشاركة غير مدعومة في هذا المتصفح — سيتم الحفظ بدلاً من ذلك');
      save();
    }
  }

  $('pick').addEventListener('change', e => { handleFiles([...e.target.files]); e.target.value = ''; });
  $('cam').addEventListener('change', e => { handleFiles([...e.target.files]); e.target.value = ''; });
  $('logoPick').addEventListener('change', e => { if (e.target.files[0]) setLogoFromFile(e.target.files[0]); e.target.value = ''; });
  $('save').addEventListener('click', save);
  $('share').addEventListener('click', share);
  Object.values(opts).forEach(el => el.addEventListener('input', renderAll));

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  Promise.all([document.fonts.load("700 40px 'Camel'"), document.fonts.load("500 40px 'Camel'")]).catch(() => {});
  initLogo().then(renderAll);
})();
