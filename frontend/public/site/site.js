/* ============================================================
   SMART IV SYSTEMS — main.js
   Particles · ECG · Charts · Counters · Scroll Reveals
============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     NAV: scroll border + hamburger
  ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  });

  hamburger && hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });

  navLinks && navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  /* ----------------------------------------------------------
     CLOCK
  ---------------------------------------------------------- */
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const t = `${h}:${m}:${s}`;
    const dc = document.getElementById('dmClock');
    const dashC = document.getElementById('dashClock');
    if (dc) dc.textContent = t;
    if (dashC) dashC.textContent = t;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ----------------------------------------------------------
     PARTICLE CANVAS — Hero
  ---------------------------------------------------------- */
  const particleCanvas = document.getElementById('particleCanvas');
  if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let particles = [];
    const TEAL = [0, 245, 212];
    const AMBER = [255, 184, 0];

    function resizeCanvas() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }

    function createParticle() {
      const color = Math.random() > 0.3 ? TEAL : AMBER;
      return {
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        r: 1.5 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.2,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color,
        pulse: Math.random() * Math.PI * 2,
      };
    }

    function initParticles() {
      resizeCanvas();
      particles = Array.from({ length: 60 }, createParticle);
    }

    function drawParticles() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles.forEach(p => {
        p.pulse += 0.02;
        const alpha = p.opacity + Math.sin(p.pulse) * 0.05;
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -10) p.x = particleCanvas.width + 10;
        if (p.x > particleCanvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = particleCanvas.height + 10;
        if (p.y > particleCanvas.height + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(drawParticles);
    }

    initParticles();
    drawParticles();
    window.addEventListener('resize', initParticles);
  }

  /* ----------------------------------------------------------
     HERO WAVEFORM — animated ECG line on canvas
  ---------------------------------------------------------- */
  const heroWaveCanvas = document.getElementById('heroWaveCanvas');
  if (heroWaveCanvas) {
    const ctx = heroWaveCanvas.getContext('2d');
    let offset = 0;

    function resizeHeroWave() {
      heroWaveCanvas.width = heroWaveCanvas.offsetWidth;
      heroWaveCanvas.height = 50;
    }
    resizeHeroWave();
    window.addEventListener('resize', resizeHeroWave);

    function drawHeroWave() {
      const w = heroWaveCanvas.width;
      const h = heroWaveCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = '#00F5D4';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00F5D4';
      ctx.shadowBlur = 4;

      const seg = 160;
      for (let x = 0; x <= w + seg; x++) {
        const sx = (x + offset) % seg;
        let y = h / 2;
        if (sx < 20) y = h / 2;
        else if (sx < 30) y = h / 2 - 15 * ((sx - 20) / 10);
        else if (sx < 40) y = h / 2 - 15 + 35 * ((sx - 30) / 10);
        else if (sx < 50) y = h / 2 + 20 - 30 * ((sx - 40) / 10);
        else if (sx < 60) y = h / 2 - 10 + 10 * ((sx - 50) / 10);
        else y = h / 2;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      offset = (offset + 2) % seg;
      requestAnimationFrame(drawHeroWave);
    }
    drawHeroWave();
  }

  /* ----------------------------------------------------------
     PATIENT SPARKLINES
  ---------------------------------------------------------- */
  function drawSparkline(canvasId, color = '#00F5D4', alert = false) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = c.offsetWidth;
    c.height = 36;
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push(18 + (alert ? Math.random() * 28 - 8 : Math.random() * 12 - 6));
    }

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.shift();
      pts.push(18 + (alert ? Math.random() * 28 - 8 : Math.random() * 12 - 6));
      ctx.beginPath();
      const step = c.width / (pts.length - 1);
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(0, p);
        else ctx.lineTo(i * step, p);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
      setTimeout(() => requestAnimationFrame(draw), 80);
    }
    draw();
  }
  drawSparkline('wave1', '#00F5D4', false);
  drawSparkline('wave2', '#FF2D55', true);
  drawSparkline('wave3', '#FFB800', false);

  /* ----------------------------------------------------------
     DRUG IMPACT CHART
  ---------------------------------------------------------- */
  function buildDrugChart(canvasId, height = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;

    // Generate smooth data
    const labels = Array.from({ length: 31 }, (_, i) => i);
    const spo2Base = Array.from({ length: 31 }, (_, i) => {
      if (i < 5) return 93 + Math.random() * 0.5;
      const progress = Math.min((i - 5) / 8, 1);
      return 93 + progress * 4 + (Math.random() - 0.5) * 0.4;
    });
    const hrBase = Array.from({ length: 31 }, (_, i) => {
      if (i < 5) return 58 + Math.random() * 1;
      const progress = Math.min((i - 5) / 10, 1);
      return 58 + progress * 18 + (Math.random() - 0.5) * 1;
    });

    // Expected SpO2 corridor
    const spo2Upper = spo2Base.map((v, i) => i >= 5 ? (93 + Math.min((i - 5) / 8, 1) * 6 + 1) : null);
    const spo2Lower = spo2Base.map((v, i) => i >= 5 ? (93 + Math.min((i - 5) / 8, 1) * 3 - 0.5) : null);

    if (height) canvas.height = height;

    const chart = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'SpO₂ %',
            data: spo2Base,
            borderColor: '#00F5D4',
            borderWidth: 2,
            fill: true,
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
              gradient.addColorStop(0, 'rgba(0,245,212,0.18)');
              gradient.addColorStop(1, 'rgba(0,245,212,0.01)');
              return gradient;
            },
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y',
          },
          {
            label: 'Heart Rate BPM',
            data: hrBase,
            borderColor: '#FFB800',
            borderWidth: 2,
            borderDash: [5, 4],
            fill: false,
            backgroundColor: 'rgba(255,184,0,0.1)',
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y1',
          },
          {
            label: 'SpO₂ Upper Band',
            data: spo2Upper,
            borderColor: 'transparent',
            fill: '+1',
            backgroundColor: 'rgba(0,245,212,0.07)',
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y',
          },
          {
            label: 'SpO₂ Lower Band',
            data: spo2Lower,
            borderColor: 'transparent',
            fill: false,
            backgroundColor: 'rgba(0,245,212,0.07)',
            tension: 0.4,
            pointRadius: 0,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 1500, easing: 'easeInOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(6,14,25,0.9)',
            borderColor: 'rgba(0,245,212,0.3)',
            borderWidth: 1,
            titleColor: '#00F5D4',
            bodyColor: 'rgba(255,255,255,0.7)',
            titleFont: { family: 'DM Mono, monospace', size: 11 },
            bodyFont: { family: 'DM Mono, monospace', size: 11 },
            callbacks: {
              title: (items) => `T+${items[0].label} min`,
              label: (item) => {
                if (item.datasetIndex > 1) return null;
                return `${item.dataset.label}: ${Number(item.raw).toFixed(1)}${item.datasetIndex === 0 ? '%' : ''}`;
              },
            },
          },
          annotation: undefined,
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: {
              color: 'rgba(255,255,255,0.3)',
              font: { family: 'DM Mono, monospace', size: 10 },
              callback: (v) => v % 5 === 0 ? `T+${v}` : '',
            },
          },
          y: {
            position: 'left',
            min: 90, max: 100,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#00F5D4',
              font: { family: 'DM Mono, monospace', size: 10 },
              callback: (v) => v + '%',
            },
          },
          y1: {
            position: 'right',
            min: 50, max: 85,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#FFB800',
              font: { family: 'DM Mono, monospace', size: 10 },
              callback: (v) => v + ' bpm',
            },
          },
        },
      },
    });

    setTimeout(() => drawInfusionLine(chart), 1600);
    return chart;
  }

  /* ----------------------------------------------------------
     DRAW INFUSION LINE on chart canvas
  ---------------------------------------------------------- */
  function drawInfusionLine(chart) {
    if (!chart) return;
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    const x = scales.x.getPixelForValue(5);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#FF2D55';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = '#FF2D55';
    ctx.font = '10px DM Mono, monospace';
    ctx.fillText('INFUSION START', x + 4, chartArea.top + 14);

    // Response point annotation at T=10
    const xResp = scales.x.getPixelForValue(10);
    const yResp = scales.y.getPixelForValue(96.2);
    ctx.beginPath();
    ctx.arc(xResp, yResp, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB800';
    ctx.shadowColor = '#FFB800';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ----------------------------------------------------------
     SCROLL-DRIVEN REVEAL + COUNTER + CHART INIT
  ---------------------------------------------------------- */
  let drugChartBuilt = false;
  let dashChartBuilt = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      if (el.classList.contains('reveal-up')) {
        el.classList.add('visible');
      }

      // Counter animation
      if (el.classList.contains('counter')) {
        animateCounter(el);
      }

      // Drug chart init on scroll
      if (el.id === 'drug-impact' && !drugChartBuilt) {
        drugChartBuilt = true;
        setTimeout(() => {
          const dc = buildDrugChart('drugImpactChart');
          if (dc) {
            // Show annotation after draw
            setTimeout(() => {
              const annotation = document.getElementById('drugAnnotation');
              if (annotation && dc.chartArea) {
                const x = dc.scales.x.getPixelForValue(10);
                const y = dc.scales.y.getPixelForValue(96.2);
                const rect = dc.canvas.getBoundingClientRect();
                const wrapRect = document.querySelector('.drug-chart-wrap').getBoundingClientRect();
                annotation.style.left = (rect.left - wrapRect.left + x - 5) + 'px';
                annotation.style.top = (rect.top - wrapRect.top + y - 5) + 'px';
                annotation.classList.add('visible');
              }
            }, 1700);
          }
        }, 200);
      }

      if (el.id === 'dashboard' && !dashChartBuilt) {
        dashChartBuilt = true;
        setTimeout(() => buildDrugChart('dashboardChart', 80), 300);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
  document.querySelectorAll('.counter').forEach(el => observer.observe(el));

  // Section-level observers
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionObserver.unobserve(entry.target);
        if (entry.target.id === 'drug-impact' && !drugChartBuilt) {
          drugChartBuilt = true;
          setTimeout(() => buildDrugChart('drugImpactChart'), 200);
        }
        if (entry.target.id === 'dashboard' && !dashChartBuilt) {
          dashChartBuilt = true;
          setTimeout(() => buildDrugChart('dashboardChart', 80), 300);
        }
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('#drug-impact, #dashboard').forEach(s => sectionObserver.observe(s));

  /* ----------------------------------------------------------
     COUNTER ANIMATION
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();
    function update(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  }

  /* ----------------------------------------------------------
     CTA ECG CANVAS
  ---------------------------------------------------------- */
  const ctaEcg = document.getElementById('ctaEcgCanvas');
  if (ctaEcg) {
    const ctx = ctaEcg.getContext('2d');
    let ctaOffset = 0;

    function resizeCtaEcg() {
      ctaEcg.width = window.innerWidth;
      ctaEcg.height = 80;
    }
    resizeCtaEcg();
    window.addEventListener('resize', resizeCtaEcg);

    function drawCtaEcg() {
      const w = ctaEcg.width, h = ctaEcg.height;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = '#00F5D4';
      ctx.lineWidth = 1.2;
      const seg = 200;
      for (let x = 0; x <= w + seg; x++) {
        const sx = (x + ctaOffset) % seg;
        let y = h / 2;
        if (sx >= 20 && sx < 30) y = h / 2 - 12 * ((sx - 20) / 10);
        else if (sx >= 30 && sx < 40) y = h / 2 - 12 + 28 * ((sx - 30) / 10);
        else if (sx >= 40 && sx < 50) y = h / 2 + 16 - 24 * ((sx - 40) / 10);
        else if (sx >= 50 && sx < 60) y = h / 2 - 8 + 8 * ((sx - 50) / 10);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctaOffset = (ctaOffset + 1) % seg;
      requestAnimationFrame(drawCtaEcg);
    }
    drawCtaEcg();
  }

  /* ----------------------------------------------------------
     ARCHITECTURE STAGGERED FADE
  ---------------------------------------------------------- */
  const archNodes = document.querySelectorAll('.arch-node');
  const archObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      archNodes.forEach((node, i) => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(16px)';
        node.style.transition = `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`;
        setTimeout(() => {
          node.style.opacity = '1';
          node.style.transform = 'translateY(0)';
        }, 100 + i * 80);
      });
      archObs.disconnect();
    }
  }, { threshold: 0.2 });

  const archDiagram = document.querySelector('.arch-diagram');
  if (archDiagram) archObs.observe(archDiagram);

  /* ----------------------------------------------------------
     SMOOTH SCROLL FOR NAV LINKS
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ----------------------------------------------------------
     SECTION HEADER LETTER-SPACING ANIMATION
  ---------------------------------------------------------- */
  const headerObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const h = entry.target;
        h.style.transition = 'letter-spacing 0.6s ease, opacity 0.6s ease';
        h.style.letterSpacing = '0.03em';
        headerObs.unobserve(h);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.section-title').forEach(h => {
    h.style.letterSpacing = '0.15em';
    h.style.opacity = '0.2';
    // Combined with reveal-up parent — just animate directly
    const revealParent = h.closest('.reveal-up');
    if (!revealParent) {
      h.style.opacity = '1';
    } else {
      // Let reveal-up handle, just reset
      h.style.letterSpacing = '';
      h.style.opacity = '';
    }
  });

  console.log('%cSMART IV SYSTEMS', 'color:#00F5D4;font-size:20px;font-family:monospace;font-weight:bold;');
  console.log('%cIntelligence that keeps patients alive.', 'color:rgba(255,255,255,0.5);font-family:monospace;font-size:12px;');

})();
