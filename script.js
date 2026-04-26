/* ════════════════════════════════════════
   INNOVA · Business Card v2 · script.js
   ════════════════════════════════════════ */

let GALLERY = [
  'https://innova-soluciones.com/uploads/1777076641763-4aa29eb2-8b39-4b50-8d47-412399e44d77.webp',
  'https://innova-soluciones.com/uploads/1777076612924-5b6f2d41-3a16-4c9b-8d40-f267457bfd5a.webp',
  'https://innova-soluciones.com/uploads/1777076569674-a54e6692-e844-4328-b6cc-bffa3604b5f7.webp',
  'https://innova-soluciones.com/uploads/1777076514895-b7ad0228-7a76-4b09-adc1-f46031d66a37.webp',
  'https://innova-soluciones.com/uploads/1777076479703-7bd48e93-96c8-495c-a3a8-51f86151b97c.webp',
  'https://innova-soluciones.com/uploads/1777075079745-d54fd538-d4d2-4c17-a735-ac4c0401f917.webp',
  'https://innova-soluciones.com/uploads/1777075022285-3f994e8c-ed9e-445a-9fbf-65ec9e0251f3.webp',
  'https://innova-soluciones.com/uploads/1777074646767-68572a7d-77de-4c8c-89c5-685836b04dad.webp',
];

/* ══════════════════════════
   DYNAMIC GALLERY LOADER
══════════════════════════ */
async function syncGallery(onUpdate) {
  try {
    const ts = new Date().getTime();
    const proxy = 'https://api.allorigins.win/get?url=';
    const target = encodeURIComponent(`https://innova-soluciones.com/api/galeria?t=${ts}`);

    const res = await fetch(proxy + target);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const items = JSON.parse(data.contents);

    if (Array.isArray(items) && items.length > 0) {
      const newGallery = items.map(item =>
        item.url.startsWith('http') ? item.url : 'https://innova-soluciones.com' + item.url
      );

      if (JSON.stringify(newGallery) !== JSON.stringify(GALLERY)) {
        GALLERY = newGallery;
        if (onUpdate) onUpdate();
      }
    }
  } catch (e) {
    console.warn("Sync failed, staying with current list.");
  }
}

/* ══════════════════════════
   BG CANVAS
══════════════════════════ */
(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  const COLORS = { a: '#2961CA', b: '#2C86F1', c: '#39C5EE' };

  function hex(c, a) {
    const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  const particles = [];
  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < 50; i++) {
      const cols = [COLORS.a, COLORS.b, COLORS.c];
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        col: cols[Math.floor(Math.random() * 3)],
        a: Math.random() * 0.45 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = hex(COLORS.a, 0.055);
    ctx.lineWidth = 0.5;
    const cols = 12, rows = 20;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath(); ctx.moveTo((i / cols) * W, 0); ctx.lineTo((i / cols) * W, H); ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath(); ctx.moveTo(0, (j / rows) * H); ctx.lineTo(W, (j / rows) * H); ctx.stroke();
    }

    // Orbs
    [[W * 0.1, H * 0.15, 300, COLORS.c, 0.07], [W * 0.9, H * 0.55, 350, COLORS.a, 0.065], [W * 0.5, H * 0.9, 280, COLORS.b, 0.055]].forEach(([x, y, r, col, a]) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hex(col, a)); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });

    // Particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = hex(p.col, p.a); ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize(); initParticles(); draw();
})();


/* ══════════════════════════
   CAROUSEL & APP INIT
══════════════════════════ */
async function initApp() {
  const track = document.getElementById('carouselTrack');
  const outer = track.parentElement;
  const dotsEl = document.getElementById('carouselDots');
  let current = 0;
  let autoTimer;

  // ══════════════════════════
  // HELPERS (Defined first to avoid errors)
  // ══════════════════════════

  function getVisibleCount() {
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 768) return 3;
    return 1.15;
  }

  function getItemWidth() {
    const item = track.querySelector('.carousel-item');
    return item ? item.offsetWidth + 15 : 0;
  }

  function moveTo(idx, animate = true) {
    const v = getVisibleCount();
    const max = Math.max(0, GALLERY.length - (v >= 1.5 ? Math.floor(v) : 1));
    current = Math.max(0, Math.min(idx, max));
    const offset = current * getItemWidth();
    track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    const v = getVisibleCount();
    const max = Math.max(0, GALLERY.length - (v >= 1.5 ? Math.floor(v) : 1));
    const pages = max + 1;
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Ir a página ${i + 1}`);
      dot.addEventListener('click', () => { moveTo(i); resetAuto(); });
      dotsEl.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.carousel-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      const v = getVisibleCount();
      const max = Math.max(0, GALLERY.length - (v >= 1.5 ? Math.floor(v) : 1));
      if (max <= 0) return; // Don't move if everything fits
      moveTo(current >= max ? 0 : current + 1);
    }, 3500);
  }

  function renderCarousel() {
    track.innerHTML = '';
    GALLERY.forEach((src, i) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      const img = document.createElement('img');
      img.src = src; img.alt = `Proyecto ${i + 1}`; img.loading = 'lazy';
      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(i));
      track.appendChild(item);
    });
    buildDots();
    // Use setTimeout to ensure the browser has calculated widths before moving
    setTimeout(() => moveTo(0, false), 50);
  }

  // ══════════════════════════
  // INITIALIZATION
  // ══════════════════════════

  // 1. Initial Render (Instant)
  renderCarousel();
  resetAuto();

  // 2. Background Sync
  syncGallery(() => {
    renderCarousel();
    resetAuto();
  });

  window.addEventListener('resize', () => { buildDots(); moveTo(current, false); });

  // 3. Drag / swipe logic
  let startX = 0, startOffset = 0, isDragging = false;

  function dragStart(x) {
    isDragging = true;
    startX = x;
    startOffset = current * getItemWidth();
    track.style.transition = 'none';
    clearInterval(autoTimer);
  }

  function dragMove(x) {
    if (!isDragging) return;
    const delta = startX - x;
    track.style.transform = `translateX(-${startOffset + delta}px)`;
  }

  function dragEnd(x) {
    if (!isDragging) return;
    isDragging = false;
    const delta = startX - x;
    if (Math.abs(delta) > 40) moveTo(delta > 0 ? current + 1 : current - 1);
    else moveTo(current);
    resetAuto();
  }

  outer.addEventListener('mousedown', e => dragStart(e.clientX));
  window.addEventListener('mousemove', e => { if (isDragging) dragMove(e.clientX); });
  window.addEventListener('mouseup', e => dragEnd(e.clientX));
  outer.addEventListener('touchstart', e => dragStart(e.touches[0].clientX), { passive: true });
  outer.addEventListener('touchmove', e => dragMove(e.touches[0].clientX), { passive: true });
  outer.addEventListener('touchend', e => dragEnd(e.changedTouches[0].clientX));
}

initApp();


/* ══════════════════════════
   LIGHTBOX
══════════════════════════ */
(function () {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const close = document.getElementById('lbClose');
  const prev = document.getElementById('lbPrev');
  const next = document.getElementById('lbNext');
  let idx = 0;

  window.openLightbox = function (i) {
    idx = i;
    lbImg.src = GALLERY[i];
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  function nav(dir) {
    idx = (idx + dir + GALLERY.length) % GALLERY.length;
    lbImg.style.opacity = '0';
    setTimeout(() => { lbImg.src = GALLERY[idx]; lbImg.style.opacity = '1'; }, 180);
  }

  close.addEventListener('click', closeLb);
  prev.addEventListener('click', () => nav(-1));
  next.addEventListener('click', () => nav(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });

  let tX = 0;
  lb.addEventListener('touchstart', e => { tX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tX;
    if (Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1);
  });
})();


/* ══════════════════════════
   SAVE CONTACT
══════════════════════════ */
document.getElementById('saveContactBtn').addEventListener('click', () => {
  const vcf = [
    'BEGIN:VCARD', 'VERSION:3.0',
    'FN:Juan Manuel Gutiérrez Calderón',
    'N:Gutiérrez Calderón;Juan Manuel;;;',
    'ORG:INNOVA Diseño & Innovación S.A.S.',
    'TITLE:Consultor de Negocios Foodservice',
    'TEL;TYPE=CELL:+573147309590',
    'EMAIL;TYPE=WORK:gerencia.comercial@innova-soluciones.com',
    'EMAIL;TYPE=HOME:gerencia.general@innova-soluciones.com',
    'ADR;TYPE=WORK:;;Calle 141 # 15A – 32 Casa 2005;Pereira;;; Colombia',
    'URL:https://www.instagram.com/juan.m.g.c/',
    'END:VCARD',
  ].join('\r\n');

  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'JuanManuelGutierrezCalderon.vcf' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Contacto guardado');
});


/* ══════════════════════════
   QR MODAL & SHARING
══════════════════════════ */
(function () {
  // CONFIG: Cambia esto a la URL real de la CARTA DE PRESENTACIÓN cuando esté en línea
  const PRODUCTION_URL = 'https://bsecards.com/juanmanuel'; 
  
  const btn = document.getElementById('qrBtn');
  const modal = document.getElementById('qrModal');
  const close = document.getElementById('qrClose');
  const canvas = document.getElementById('qrCanvas');
  const urlEl = document.getElementById('qrUrl');
  const copyBtn = document.getElementById('copyUrlBtn');
  let built = false;

  // Determine which URL to use (prefer production, fallback to current if local)
  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  const shareUrl = isLocal ? PRODUCTION_URL : window.location.href;

  btn.addEventListener('click', () => {
    if (!built) {
      urlEl.textContent = shareUrl;
      
      // Clear container just in case
      canvas.innerHTML = '';
      
      new QRCode(canvas, {
        text: shareUrl,
        width: 256,
        height: 256,
        colorDark: '#0A0C17', // Match --darkbase for better integration
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.H
      });
      built = true;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
      copyBtn.style.background = 'var(--bluePrimary)';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '';
      }, 2000);
      
      showToast('✅ Enlace copiado al portapapeles');
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();


/* ══════════════════════════
   TOAST
══════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}