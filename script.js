/* ═══════════════════════════════════════════
   SHESH SHIROMANI — Portfolio JS
   ═══════════════════════════════════════════ */

   (function () {
    'use strict';
  
    /* ════════════════════════════════════════
       3D EARTH ZOOM INTRO
    ════════════════════════════════════════ */
    const intro  = document.getElementById('intro');
    const canvas = document.getElementById('introCanvas');
    const ctx    = canvas.getContext('2d');
    let W, H, animId, introDone = false;
  
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  
    /* ── Star field ── */
    const STARS = Array.from({ length: 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      b: Math.random() * 0.7 + 0.3,
    }));
  
    /* ── Earth colours — procedural land/ocean bands ── */
    function makeEarthGradient(ctx, cx, cy, r) {
      const g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.05, cx, cy, r);
      g.addColorStop(0.00, '#8ecae6');
      g.addColorStop(0.15, '#219ebc');
      g.addColorStop(0.28, '#1a6b3a');
      g.addColorStop(0.40, '#2d9a4e');
      g.addColorStop(0.52, '#0077b6');
      g.addColorStop(0.65, '#1a6b3a');
      g.addColorStop(0.78, '#0077b6');
      g.addColorStop(0.90, '#023e8a');
      g.addColorStop(1.00, '#03045e');
      return g;
    }
  
    /* ── Draw procedural continents as noise blobs ── */
    function drawContinents(ctx, cx, cy, r, phase) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
  
      // Continent blobs — offset by phase (rotation)
      const blobs = [
        { bx: 0.28, by: 0.38, rw: 0.22, rh: 0.28 },   // americas-ish
        { bx: 0.58, by: 0.35, rw: 0.18, rh: 0.22 },   // europe/africa
        { bx: 0.72, by: 0.45, rw: 0.20, rh: 0.18 },   // asia
        { bx: 0.80, by: 0.62, rw: 0.14, rh: 0.12 },   // australia
        { bx: 0.45, by: 0.72, rw: 0.10, rh: 0.08 },   // africa tip
      ];
  
      blobs.forEach(b => {
        const bxOff = ((b.bx + phase * 0.18) % 1.0);
        const bx = cx - r + bxOff * r * 2;
        const by = cy - r + b.by * r * 2;
        const rx = b.rw * r;
        const ry = b.rh * r;
        ctx.beginPath();
        ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,120,60,0.85)';
        ctx.fill();
        // highlight edge
        ctx.strokeStyle = 'rgba(80,180,100,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
  
      // Ice caps
      const capG1 = ctx.createRadialGradient(cx, cy - r, 0, cx, cy - r * 0.7, r * 0.32);
      capG1.addColorStop(0, 'rgba(230,245,255,0.92)');
      capG1.addColorStop(1, 'rgba(200,235,255,0)');
      ctx.fillStyle = capG1;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.75, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
  
      const capG2 = ctx.createRadialGradient(cx, cy + r, 0, cx, cy + r * 0.7, r * 0.28);
      capG2.addColorStop(0, 'rgba(230,245,255,0.88)');
      capG2.addColorStop(1, 'rgba(200,235,255,0)');
      ctx.fillStyle = capG2;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.78, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
  
      ctx.restore();
    }
  
    /* ── Atmosphere glow ── */
    function drawAtmosphere(ctx, cx, cy, r) {
      const atmo = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.18);
      atmo.addColorStop(0,   'rgba(100,180,255,0.35)');
      atmo.addColorStop(0.4, 'rgba(60,140,220,0.12)');
      atmo.addColorStop(1,   'rgba(20,80,180,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();
    }
  
    /* ── Specular highlight ── */
    function drawSpecular(ctx, cx, cy, r) {
      const spec = ctx.createRadialGradient(
        cx - r * 0.32, cy - r * 0.32, r * 0.01,
        cx - r * 0.1,  cy - r * 0.1,  r * 0.72
      );
      spec.addColorStop(0,   'rgba(255,255,255,0.38)');
      spec.addColorStop(0.3, 'rgba(255,255,255,0.08)');
      spec.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = spec;
      ctx.fill();
      ctx.restore();
    }
  
    /* ── Cloud layer ── */
    function drawClouds(ctx, cx, cy, r, phase) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      const cloudBands = [
        { y: 0.22, w: 0.55, h: 0.07, x: 0.15 },
        { y: 0.44, w: 0.40, h: 0.06, x: 0.35 },
        { y: 0.60, w: 0.50, h: 0.05, x: 0.05 },
        { y: 0.75, w: 0.35, h: 0.06, x: 0.55 },
      ];
      cloudBands.forEach(b => {
        const xOff = ((b.x + phase * 0.22) % 1.0);
        const bx = cx - r + xOff * r * 2;
        const by = cy - r + b.y * r * 2;
        ctx.beginPath();
        ctx.ellipse(bx, by, b.w * r, b.h * r, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fill();
      });
      ctx.restore();
    }
  
    /* ── Dark side shadow ── */
    function drawShadow(ctx, cx, cy, r) {
      const shadow = ctx.createRadialGradient(
        cx + r * 0.5, cy, r * 0.2,
        cx + r * 0.4, cy, r * 1.05
      );
      shadow.addColorStop(0,   'rgba(0,0,0,0)');
      shadow.addColorStop(0.4, 'rgba(0,0,8,0.25)');
      shadow.addColorStop(0.7, 'rgba(0,0,8,0.65)');
      shadow.addColorStop(1,   'rgba(0,0,8,0.88)');
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = shadow;
      ctx.fill();
      ctx.restore();
    }
  
    /* ── Timing ── */
    // zoom: starts slow, exponential acceleration
    // total 4s: 0-2.5s slow zoom, 2.5-3.8s exponential, 3.8-4.2s name snap
    const TOTAL = 4200;
    let startTime = null;
    let rotation  = 0;
  
    function zoomProgress(t) {
      // t 0→1 mapped to zoom factor
      // slow phase 0→0.6, fast phase 0.6→1
      if (t < 0.6) {
        return t / 0.6 * 0.25;         // 0 → 0.25 slowly
      } else {
        const fast = (t - 0.6) / 0.4;  // 0 → 1
        return 0.25 + Math.pow(fast, 2.8) * 0.75; // 0.25 → 1 exponential
      }
    }
  
    function getEarthRadius(zoom) {
      // At zoom=0: earth is small (distant view), zoom=1: fills screen
      const minR = Math.min(W, H) * 0.18;
      const maxR = Math.min(W, H) * 4.5;
      return minR + (maxR - minR) * zoom;
    }
  
    /* ── Motion blur overlay for speed ── */
    function drawSpeedBlur(ctx, zoom, t) {
      if (zoom < 0.5) return;
      const intensity = Math.pow((zoom - 0.5) / 0.5, 2.2);
      // Radial blur lines from center
      const numLines = Math.floor(intensity * 80);
      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2;
        const len   = intensity * Math.min(W, H) * 0.5;
        const x1    = W/2 + Math.cos(angle) * Math.min(W, H) * 0.05;
        const y1    = H/2 + Math.sin(angle) * Math.min(W, H) * 0.05;
        const x2    = W/2 + Math.cos(angle) * (Math.min(W, H) * 0.05 + len);
        const y2    = H/2 + Math.sin(angle) * (Math.min(W, H) * 0.05 + len);
        const grad  = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0,   `rgba(80,160,220,${intensity * 0.18})`);
        grad.addColorStop(1,   'rgba(80,160,220,0)');
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }
    }
  
    /* ── White flash at peak speed ── */
    function drawFlash(ctx, t) {
      if (t < 0.88) return;
      const ft = (t - 0.88) / 0.12;
      // spike up then down
      const alpha = ft < 0.35 ? ft / 0.35 : 1 - (ft - 0.35) / 0.65;
      ctx.fillStyle = `rgba(180,220,255,${alpha * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }
  
    /* ── Name reveal ── */
    function drawName(ctx, t) {
      if (t < 0.91) return;
      const nt  = Math.min((t - 0.91) / 0.09, 1);
      const ease3 = 1 - Math.pow(1 - nt, 3);
  
      // Bg settles to site bg color
      ctx.fillStyle = `rgba(8,8,13,${ease3 * 0.95})`;
      ctx.fillRect(0, 0, W, H);
  
      // Name
      const fs = Math.min(W * 0.1, 72);
      ctx.save();
      ctx.globalAlpha = ease3;
      ctx.font        = `300 ${fs}px 'Cormorant Garamond', serif`;
      ctx.fillStyle   = '#f0f0f8';
      ctx.textAlign   = 'center';
      // Slight scale snap from 1.06 → 1
      const scale = 1.06 - ease3 * 0.06;
      ctx.translate(W/2, H/2 + fs * 0.15);
      ctx.scale(scale, scale);
      ctx.fillText('SHESH SHIROMANI', 0, 0);
      ctx.restore();
  
      // Teal line under name
      ctx.save();
      ctx.globalAlpha = ease3 * 0.6;
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth   = 1;
      const nameW = Math.min(W * 0.55, 500);
      ctx.beginPath();
      ctx.moveTo(W/2 - nameW/2 * ease3, H/2 + fs * 0.35);
      ctx.lineTo(W/2 + nameW/2 * ease3, H/2 + fs * 0.35);
      ctx.stroke();
      ctx.restore();
  
      // Subtitle
      if (nt > 0.6) {
        const st = (nt - 0.6) / 0.4;
        ctx.save();
        ctx.globalAlpha = (1 - Math.pow(1-st, 3)) * 0.55;
        ctx.font        = `400 ${Math.min(W*0.022, 13)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle   = '#5eead4';
        ctx.textAlign   = 'center';
        ctx.letterSpacing = '0.2em';
        ctx.fillText('PHYSICIST  ·  DEVELOPER  ·  MUSICIAN', W/2, H/2 + fs * 0.75);
        ctx.restore();
      }
    }
  
    /* ── Main render loop ── */
    function loop(ts) {
      if (introDone) return;
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t       = Math.min(elapsed / TOTAL, 1);
      const zoom    = zoomProgress(t);
  
      rotation += 0.003 * (1 - zoom * 0.8); // slows as we zoom
  
      ctx.clearRect(0, 0, W, H);
  
      /* Stars — parallax: move away from center as we zoom */
      STARS.forEach(s => {
        const parallax = 1 + zoom * 3.5;
        const sx = (s.x - 0.5) * W * parallax + W/2;
        const sy = (s.y - 0.5) * H * parallax + H/2;
        if (sx < 0 || sx > W || sy < 0 || sy > H) return;
        const starAlpha = s.b * Math.max(0, 1 - zoom * 2.5);
        if (starAlpha <= 0) return;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${starAlpha})`;
        ctx.fill();
      });
  
      /* Earth */
      const r  = getEarthRadius(zoom);
      const cx = W / 2;
      const cy = H / 2;
  
      // Base ocean
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = makeEarthGradient(ctx, cx, cy, r);
      ctx.fill();
  
      drawContinents(ctx, cx, cy, r, rotation);
      drawClouds(ctx, cx, cy, r, rotation * 0.7);
      drawShadow(ctx, cx, cy, r);
      drawAtmosphere(ctx, cx, cy, r);
      drawSpecular(ctx, cx, cy, r);
  
      /* Speed blur lines */
      drawSpeedBlur(ctx, zoom, t);
  
      /* Flash + name */
      drawFlash(ctx, t);
      drawName(ctx, t);
  
      if (t < 1) {
        animId = requestAnimationFrame(loop);
      } else {
        // Hold name for a beat then dissolve to site
        setTimeout(endIntro, 900);
      }
    }
  
    function endIntro() {
      if (introDone) return;
      introDone = true;
      cancelAnimationFrame(animId);
      intro.classList.add('done');
      setTimeout(() => {
        intro.style.display = 'none';
        document.body.style.overflow = '';
      }, 650);
    }
  
    function skipIntro() {
      if (introDone) return;
      introDone = true;
      cancelAnimationFrame(animId);
      intro.style.transition = 'opacity 0.4s ease';
      intro.style.opacity    = '0';
      setTimeout(() => {
        intro.style.display = 'none';
        document.body.style.overflow = '';
      }, 420);
    }
  
    /* ── Start ── */
    document.body.style.overflow = 'hidden';
    animId = requestAnimationFrame(loop);
    intro.addEventListener('click', skipIntro);
    document.addEventListener('keydown', skipIntro, { once: true });
  
  
    /* ════════════════════════════════════════
       THEME
    ════════════════════════════════════════ */
    const html     = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');
  
    function setTheme(theme) {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('ss-theme', theme);
      themeBtn.innerHTML = theme === 'dark'
        ? '<span>☀</span> Light'
        : '<span>☾</span> Dark';
    }
    const saved = localStorage.getItem('ss-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(saved);
    themeBtn.addEventListener('click', () => {
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  
    /* ════════════════════════════════════════
       MOBILE NAV
    ════════════════════════════════════════ */
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
  
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  
    /* ════════════════════════════════════════
       NAV ACTIVE HIGHLIGHT
    ════════════════════════════════════════ */
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
    const sections = document.querySelectorAll('section[id]');
  
    function updateActiveNav() {
      let current = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
      });
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${current}`
          ? 'var(--accent)' : '';
      });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });
  
    /* ════════════════════════════════════════
       SCROLL REVEAL
    ════════════════════════════════════════ */
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 70);
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  
    /* ════════════════════════════════════════
       TYPING EFFECT
    ════════════════════════════════════════ */
    const typed = document.getElementById('typedText');
    if (typed) {
      const phrases = [
        'Delhi, India · Class of 2026',
        'Physicist & Full Stack Dev',
        'Tabla · Beatboxing · Swimming',
        'President @ PhySoc DPSRKP',
      ];
      let pi = 0, ci = 0, deleting = false, waiting = false;
      function tick() {
        if (waiting) return;
        const phrase = phrases[pi];
        if (!deleting) {
          typed.textContent = phrase.slice(0, ci + 1); ci++;
          if (ci === phrase.length) { waiting = true; setTimeout(() => { deleting = true; waiting = false; tick(); }, 2200); }
          else setTimeout(tick, 55);
        } else {
          typed.textContent = phrase.slice(0, ci - 1); ci--;
          if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 300); }
          else setTimeout(tick, 28);
        }
      }
      setTimeout(tick, 1000);
    }
  
    /* ════════════════════════════════════════
       SMOOTH ANCHORS
    ════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  
    /* ════════════════════════════════════════
       CURSOR GLOW
    ════════════════════════════════════════ */
    if (window.innerWidth > 768) {
      const glow = document.createElement('div');
      glow.style.cssText = `
        position:fixed;pointer-events:none;z-index:9998;
        width:320px;height:320px;border-radius:50%;
        background:radial-gradient(circle,rgba(94,234,212,0.045) 0%,transparent 65%);
        transform:translate(-50%,-50%);
        transition:left 0.1s ease,top 0.1s ease;
        top:-400px;left:-400px;
      `;
      document.body.appendChild(glow);
      window.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top  = e.clientY + 'px';
      }, { passive: true });
    }
  
  })();