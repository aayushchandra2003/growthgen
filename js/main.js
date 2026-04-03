/* ═══════════════════════════════════════════════════════════
   GROWTHGEN — main.js
   Scroll animations, canvas particles, flywheel, interactions
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── UTILS ─────────────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const rnd = (min, max) => Math.random() * (max - min) + min;

  /* ─── NAV SCROLL ─────────────────────────────────────────── */
  const navbar = qs('#navbar');
  let lastScrollY = 0;

  function handleNavScroll() {
    const y = window.scrollY;
    if (y > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScrollY = y;
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ─── MOBILE NAV TOGGLE ──────────────────────────────────── */
  const navToggle = qs('#navToggle');
  const navMobile = qs('#navMobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navMobile.classList.toggle('open');
      const isOpen = navMobile.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      // Animate hamburger
      const spans = qsa('span', navToggle);
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    // Close on link click
    qsa('a', navMobile).forEach(a => {
      a.addEventListener('click', () => {
        navMobile.classList.remove('open');
        qsa('span', navToggle).forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ─── REVEAL ON SCROLL ────────────────────────────────────── */
  const revealEls = qsa('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ─── HERO CANVAS — PARTICLES + GRID ─────────────────────── */
  const heroCanvas = qs('#heroCanvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let W, H, particles = [], animFrame;

    const PARTICLE_COUNT = 80;
    const ACCENT_COLOR = '0, 255, 136';
    const LINE_COLOR   = '255, 255, 255';

    function resize() {
      W = heroCanvas.width  = window.innerWidth;
      H = heroCanvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: rnd(0, W),
        y: rnd(0, H),
        vx: rnd(-0.25, 0.25),
        vy: rnd(-0.2, -0.05),
        r: rnd(1, 2.5),
        alpha: rnd(0.1, 0.5),
        isAccent: Math.random() < 0.15
      };
    }

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    }

    function drawConnections() {
      const maxDist = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.07;
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      drawConnections();

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { p.y = H + 10; p.x = rnd(0, W); }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        const color = p.isAccent ? ACCENT_COLOR : LINE_COLOR;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();

        if (p.isAccent) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT_COLOR}, 0.04)`;
          ctx.fill();
        }
      });

      animFrame = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    
    // Pause animation when off-screen for performance
    const heroSection = qs('#hero');
    if (heroSection) {
      let isVisible = true;
      const obs = new IntersectionObserver(entries => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) animate();
        else cancelAnimationFrame(animFrame);
      }, { rootMargin: '100px' });
      obs.observe(heroSection);
    } else {
      animate();
    }
    
    window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
  }

  /* ─── CTA CANVAS — SUBTLE GLOW PULSES ────────────────────── */
  const ctaCanvas = qs('#ctaCanvas');
  if (ctaCanvas) {
    const cctx = ctaCanvas.getContext('2d');
    let cW, cH;

    function resizeCta() {
      cW = ctaCanvas.width  = ctaCanvas.offsetWidth  || window.innerWidth;
      cH = ctaCanvas.height = ctaCanvas.offsetHeight || 600;
    }

    let pulseT = 0;
    let ctaAnimFrame;
    function animateCta() {
      if (!cW || !cH) { resizeCta(); }
      cctx.clearRect(0, 0, cW, cH);

      pulseT += 0.008;
      const alpha = (Math.sin(pulseT) * 0.5 + 0.5) * 0.12;
      const r = 300 + Math.sin(pulseT * 0.7) * 50;

      const grad = cctx.createRadialGradient(cW / 2, cH / 2, 0, cW / 2, cH / 2, r);
      grad.addColorStop(0, `rgba(0, 255, 136, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 255, 136, 0)');
      cctx.fillStyle = grad;
      cctx.fillRect(0, 0, cW, cH);

      ctaAnimFrame = requestAnimationFrame(animateCta);
    }
    resizeCta();
    
    const ctaSection = qs('#cta');
    if (ctaSection) {
      let isVisible = true;
      const ctaObs = new IntersectionObserver(entries => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) animateCta();
        else cancelAnimationFrame(ctaAnimFrame);
      }, { rootMargin: '100px' });
      ctaObs.observe(ctaSection);
    } else {
      animateCta();
    }
    
    window.addEventListener('resize', resizeCta, { passive: true });
  }

  /* ─── SYSTEM DIAGRAM NODES STAGGER ──────────────────────── */
  const sysNodes = qsa('.sys-node');
  sysNodes.forEach((node, i) => {
    node.style.animationDelay = `${i * 0.2}s`;
    node.style.opacity = '0';
    node.style.animation = `nodeAppear 0.6s ${i * 0.25}s ease forwards`;
  });

  if (!qs('#nodeAppearStyle')) {
    const style = document.createElement('style');
    style.id = 'nodeAppearStyle';
    style.textContent = `
      @keyframes nodeAppear {
        from { opacity: 0; transform: scale(0.8); }
        to   { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── PROCESS PROGRESS BAR ────────────────────────────────── */
  const processSection = qs('#process');
  const processBar = qs('#processProgress');
  const processSteps = qsa('.process-step');

  if (processSection && processBar) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateProcessBar();
            stepObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    stepObserver.observe(processSection);

    function animateProcessBar() {
      let pct = 0;
      const target = 92;
      const step = () => {
        pct = Math.min(pct + 1.2, target);
        processBar.style.height = pct + '%';
        if (pct < target) requestAnimationFrame(step);
      };
      // Short delay for visual effect
      setTimeout(step, 300);

      // Stagger activate step dots
      processSteps.forEach((s, i) => {
        setTimeout(() => {
          s.classList.add('active');
          const dot = qs('.step-dot', s);
          if (dot) {
            dot.style.background = 'var(--accent)';
            dot.style.borderColor = 'var(--accent)';
            dot.style.boxShadow = '0 0 12px var(--accent)';
          }
        }, 400 + i * 500);
      });
    }
  }

  /* ─── COMPARISON TABLE HIGHLIGHT ────────────────────────── */
  const compRows = qsa('.comp-row');
  compRows.forEach(row => {
    const highlightCell = qs('.comp-highlight', row);
    if (highlightCell) {
      row.addEventListener('mouseenter', () => {
        highlightCell.style.background = 'rgba(0,255,136,0.1)';
      });
      row.addEventListener('mouseleave', () => {
        highlightCell.style.background = '';
      });
    }
  });

  /* ─── NUMBERS COUNTER ANIMATION ──────────────────────────── */
  const statEls = qsa('[data-count]');
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          let current = 0;
          const duration = 1500;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current).toLocaleString();
            if (current >= target) clearInterval(timer);
          }, 16);
          countObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  statEls.forEach(el => countObserver.observe(el));

  /* ─── SMOOTH ANCHOR SCROLL ────────────────────────────────── */
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ─── CARD MAGNETIC HOVER EFFECT ─────────────────────────── */
  function addMagneticEffect(selectors) {
    qsa(selectors).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
        card.style.transform = `translateY(-4px) rotateX(${-y}deg) rotateY(${x}deg)`;
        card.style.transition = 'transform 0.1s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
      });
    });
  }
  addMagneticEffect('.problem-card, .audience-card, .service-card:not(.service-card-featured), .whynow-card');

  /* ─── SYSTEM BLOCKS SEQUENTIAL REVEAL ──────────────────── */
  const systemSection = qs('#solution');
  if (systemSection) {
    const blockObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const blocks = qsa('.system-block', entry.target);
            blocks.forEach((block, i) => {
              setTimeout(() => {
                block.style.opacity = '1';
                block.style.transform = 'translateY(0) scale(1)';
              }, i * 120);
            });
            blockObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    blockObserver.observe(systemSection);
  }

  /* ─── HERO TAGLINE TYPEWRITER EFFECT ─────────────────────── */
  function initTypewriter() {
    const tagline = qs('.hero-tagline');
    if (!tagline) return;
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.opacity = '1';
    tagline.style.transform = 'none';

    let i = 0;
    const cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.style.cssText = 'color: var(--accent); animation: cursorBlink 0.7s infinite;';
    tagline.appendChild(cursor);

    if (!qs('#cursorStyle')) {
      const st = document.createElement('style');
      st.id = 'cursorStyle';
      st.textContent = '@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }';
      document.head.appendChild(st);
    }

    setTimeout(() => {
      const timer = setInterval(() => {
        if (i < text.length) {
          tagline.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
        } else {
          clearInterval(timer);
          setTimeout(() => cursor.remove(), 1500);
        }
      }, 38);
    }, 1800); // Delay until after hero reveal
  }
  initTypewriter();

  /* ─── ACTIVE NAV LINK HIGHLIGHTING ──────────────────────── */
  const sections = qsa('section[id]');
  const navLinksAll = qsa('.nav-links a, .nav-mobile a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinksAll.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  // Add active nav style
  if (!qs('#activeNavStyle')) {
    const st = document.createElement('style');
    st.id = 'activeNavStyle';
    st.textContent = '.nav-links a.active, .nav-mobile a.active { color: var(--accent) !important; }';
    document.head.appendChild(st);
  }

  sections.forEach(s => sectionObserver.observe(s));

  /* ─── BUTTON CLICK RIPPLE ─────────────────────────────────── */
  qsa('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        top: ${e.clientY - rect.top - size/2}px;
        left: ${e.clientX - rect.left - size/2}px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.5s ease forwards;
        pointer-events: none;
      `;
      if (!qs('#rippleStyle')) {
        const st = document.createElement('style');
        st.id = 'rippleStyle';
        st.textContent = '@keyframes rippleAnim { to { transform: scale(2); opacity: 0; } }';
        document.head.appendChild(st);
      }
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  /* ─── FLYWHEEL HOVER PAUSE ────────────────────────────────── */
  const flywheelContainer = qs('.flywheel-container');
  if (flywheelContainer) {
    flywheelContainer.addEventListener('mouseenter', () => {
      qsa('.flywheel-outer, .flywheel-mid', flywheelContainer).forEach(r => {
        r.style.animationPlayState = 'paused';
      });
    });
    flywheelContainer.addEventListener('mouseleave', () => {
      qsa('.flywheel-outer, .flywheel-mid', flywheelContainer).forEach(r => {
        r.style.animationPlayState = 'running';
      });
    });
  }

  /* ─── PARALLAX HERO ELEMENTS ─────────────────────────────── */
  let ticking = false;
  function onParallaxScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const heroContent = qs('.hero-content');
        const heroVisual  = qs('.hero-visual');
        if (heroContent && y < window.innerHeight) {
          heroContent.style.transform = `translateY(${y * 0.12}px)`;
          heroVisual.style.transform  = `translateY(${y * 0.06}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onParallaxScroll, { passive: true });

  /* ─── GSAP-STYLE COUNTER FOR STAT ────────────────────────── */
  const statLine = qs('.problem-loop');
  if (statLine) {
    // Animate the loop items on scroll
    const loopObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const items = qsa('.loop-item', entry.target);
            items.forEach((item, i) => {
              item.style.opacity = '0';
              item.style.transform = 'translateX(-10px)';
              setTimeout(() => {
                item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
              }, i * 150);
            });
            loopObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    loopObserver.observe(statLine);
  }

  /* ─── TOOL CARD STAGGER ───────────────────────────────────── */
  const toolsSection = qs('.tech-tools');
  if (toolsSection) {
    const toolObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            qsa('.tool-card', entry.target).forEach((card, i) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(20px)';
              setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, 200 + i * 100);
            });
            toolObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    toolObserver.observe(toolsSection);
  }

  /* ─── GLOWING BORDER CARDS ON MOUSE MOVE ─────────────────── */
  qsa('.service-card-featured').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background = `
        radial-gradient(300px circle at ${x}px ${y}px, rgba(0,255,136,0.08) 0%, rgba(0,255,136,0.04) 40%, transparent 80%)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });

  /* ─── SECTION ENTRANCE — ACCENT LINE DRAW ─────────────────── */
  const sectionLabels = qsa('.section-label');
  const labelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const line = entry.target.querySelector('::before');
          entry.target.classList.add('label-visible');
          labelObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.8 }
  );
  sectionLabels.forEach(l => labelObserver.observe(l));

  /* ─── SCROLL PROGRESS INDICATOR ──────────────────────────── */
  const progressBar = document.createElement('div');
  progressBar.id = 'scrollProgress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), #00CCFF);
    z-index: 9999;
    width: 0%;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(0,255,136,0.5);
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    progressBar.style.width = scrolled + '%';
  }, { passive: true });

  /* ─── INIT ────────────────────────────────────────────────── */
  // Initial reveal for above-fold elements
  setTimeout(() => {
    qsa('.hero-content .reveal, .hero-visual .reveal').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);

  console.log('%cGrowthGen OS — No fluff. Only signal.', 'color:#00FF88;font-weight:bold;font-size:14px;');

})();
