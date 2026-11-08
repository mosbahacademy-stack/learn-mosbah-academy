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

    // Green gradient: bottom (solid) → top (transparent)
    const grad = ctx.createLinearGradient(0, H, 0, H - gH);
    grad.addColorStop(0, `rgba(${R},${G},${B},${a})`);
    grad.addColorStop(0.35, `rgba(${R},${G},${B},${a * 0.8})`);
    grad.addColorStop(0.7, `rgba(${R},${G},${B},${a * 0.35})`);
    grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - gH, W, gH);

    const pad = 36 * s, gap = 20 * s;
    const box = 150 * s;                // logo & badge size
    const baseY = H - pad;              // bottom line of content

    // Logo — right side (RTL start)
    let rightEdge = W - pad;
    if (logoImg) {
      const lw = logoImg.width, lh = logoImg.height;
      const k = Math.min(box / lw, box / lh);
      const dw = lw * k, dh = lh * k;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14 * s;
      ctx.drawImage(logoImg, rightEdge - dw, baseY - box + (box - dh) / 2, dw, dh);
      ctx.restore();
      rightEdge -= dw + gap;
    }

    // List number badge — left side
    const bw = box * 0.92, bh = box;
    const bx = pad, by = baseY - bh;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * s;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx, by, bw, bh, 20 * s);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.direction = 'rtl';
    fitFont(ctx, TEXT_LIST_LABEL, 700, 26 * s, bw - 16 * s);
    ctx.fillText(TEXT_LIST_LABEL, bx + bw / 2, by + 40 * s);
    ctx.font = `700 ${105 * s}px ${FONT}`;
    ctx.fillText(TEXT_LIST_NUM, bx + bw / 2, by + bh - 16 * s);

    // Texts — between logo and badge, right-aligned
    const textMax = rightEdge - (bx + bw + gap);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 2 * s;
    fitFont(ctx, TEXT_PARTY, 700, 56 * s, textMax);
    ctx.fillText(TEXT_PARTY, rightEdge, baseY - box + 66 * s);
    fitFont(ctx, TEXT_OFFICE, 500, 32 * s, textMax);
    ctx.fillText(TEXT_OFFICE, rightEdge, baseY - 28 * s);

    // Hashtag — small line above the row, centered
    const tag = (opts.hashtag.value || '').trim();
    if (tag) {
      ctx.textAlign = 'center';
      fitFont(ctx, tag, 500, 28 * s, W - 2 * pad);
      ctx.fillText(tag, W / 2, baseY - box - 22 * s);
      ctx.textAlign = 'right';
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Thin accent line between the two texts
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const lineW = Math.min(textMax, 160 * s);
    ctx.fillRect(rightEdge - lineW, baseY - box + 88 * s, lineW, 3 * s);
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
