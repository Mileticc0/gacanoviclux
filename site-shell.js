// Zajednička logika za podstranice (nav, meni, prelaz, Lenis, GSAP reveal-i, dugmad).
window.GL = (function () {
  const IO = 'cubic-bezier(0.77,0,0.175,1)', E = 'cubic-bezier(0.23,1,0.32,1)';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollTo(c, top) { c._lenis ? c._lenis.scrollTo(top, { duration: 1.3 }) : window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' }); }

  function goPage(c, href) {
    const cur = c.R.curtain.current, pine = c.R.curtainPine.current;
    try { sessionStorage.setItem('gl_next', '1'); } catch (e) {}
    if (!cur || reduced()) { location.href = href; return; }
    cur.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: E, fill: 'forwards' });
    pine.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, delay: 200, easing: IO, fill: 'forwards' }).onfinish = () => { location.href = href; };
  }

  function menu(c, open) { c._lenis && (open ? c._lenis.stop() : c._lenis.start()); return;
    const m = c.R.menu.current; if (!m) return;
    const links = m.querySelectorAll('[data-mlink]');
    if (open) {
      c._lenis && c._lenis.stop(); m.style.visibility = 'visible'; if (reduced()) return;
      m.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 560, easing: IO });
      links.forEach((l, i) => l.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 220 + i * 70, easing: E, fill: 'backwards' }));
    } else {
      c._lenis && c._lenis.start();
      if (reduced()) { m.style.visibility = 'hidden'; return; }
      m.animate([{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 380, easing: IO }).onfinish = () => { if (!c.state.menuOpen) m.style.visibility = 'hidden'; };
    }
  }

  function buttons() {
    if (!window.gsap || !matchMedia('(hover: hover) and (pointer: fine)').matches || reduced()) return;
    const g = window.gsap;
    document.querySelectorAll('[data-btn]').forEach(b => {
      if (b._mag) return; b._mag = 1;
      const arrow = b.querySelector('[data-arrow]'), sheen = b.querySelector('[data-sheen]');
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); g.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: 'power3.out' }); });
      b.addEventListener('mouseenter', () => { arrow && g.to(arrow, { x: 4, duration: 0.3, ease: 'power3.out' }); sheen && g.fromTo(sheen, { xPercent: -160 }, { xPercent: 260, duration: 0.8, ease: 'power2.out' }); });
      b.addEventListener('mouseleave', () => { g.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' }); arrow && g.to(arrow, { x: 0, duration: 0.3, ease: 'power3.out' }); });
    });
  }

  function initAnim(c) {
    const g = window.gsap, ST = window.ScrollTrigger; g.registerPlugin(ST);
    const rm = reduced();
    if (window.Lenis && !rm) {
      c._lenis = new window.Lenis({ lerp: 0.1 }); c._lenis.on('scroll', ST.update);
      c._tick = t => c._lenis.raf(t * 1000); g.ticker.add(c._tick); g.ticker.lagSmoothing(0);
    }
    buttons();
    if (rm) return;
    c._ctx = g.context(() => {
      g.utils.toArray('[data-words]').forEach(h => g.from(h.querySelectorAll('[data-w]'), { opacity: 0, filter: 'blur(12px)', yPercent: 25, duration: 1, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 86%', once: true } }));
      g.utils.toArray('[data-stagger]').forEach(p => g.from(p.children, { opacity: 0, y: 32, duration: 0.85, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 86%', once: true } }));
      g.utils.toArray('[data-par]').forEach(el => g.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
      c.pageAnim && c.pageAnim(g, ST);
    });
    addEventListener('load', () => ST.refresh());
    setTimeout(() => ST.refresh(), 900);
  }

  function mount(c) {
    const R = c.R;
    document.documentElement.lang = c.state.lang;
    c._mq = matchMedia('(min-width: 900px)');
    c._onMq = () => c.setState({ isDesktop: c._mq.matches });
    c._mq.addEventListener('change', c._onMq); c._onMq();
    c._onKey = e => { if (e.key === 'Escape' && c.state.menuOpen) c.setState({ menuOpen: false }); };
    addEventListener('keydown', c._onKey);
    c._onClick = e => {
      const a = e.target.closest && e.target.closest('a');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (a.hasAttribute('data-anchor')) {
        e.preventDefault();
        const id = a.getAttribute('href'), el = id === '#top' ? null : document.querySelector(id);
        scrollTo(c, el ? el.getBoundingClientRect().top + scrollY - 90 : 0);
      } else if (a.hasAttribute('data-page')) { e.preventDefault(); goPage(c, a.getAttribute('href')); }
    };
    document.addEventListener('click', c._onClick);
    let lastY = scrollY;
    c._onScroll = () => {
      const y = scrollY, nav = R.nav.current; if (!nav) return;
      const hide = y > lastY && y > 160;
      if (hide !== c._navHidden) { c._navHidden = hide; nav.style.transition = `transform ${hide ? 380 : 480}ms ${E}`; nav.style.transform = hide ? 'translateY(-150%)' : 'none'; }
      lastY = y;
    };
    addEventListener('scroll', c._onScroll, { passive: true });

    let incoming = null; try { incoming = sessionStorage.getItem('gl_next'); sessionStorage.removeItem('gl_next'); } catch (e) {}
    const rm = reduced();
    if (incoming && R.curtain.current && !rm) {
      const cur = R.curtain.current; cur.style.opacity = '1'; R.curtainPine.current.style.strokeDashoffset = '0';
      cur.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 200, easing: E, fill: 'forwards' });
    }
    const hero = R.hero && R.hero.current;
    if (hero && !rm) {
      const d = incoming ? 450 : 100;
      const img = hero.querySelector('[data-hero-img]');
      img && img.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 2400, delay: d, easing: E, fill: 'backwards' });
      hero.querySelectorAll('[data-hero-words] [data-w]').forEach((w, i) => w.animate([{ opacity: 0, filter: 'blur(14px)', transform: 'translateY(14%)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 1100, delay: d + 200 + i * 70, easing: E, fill: 'backwards' }));
      hero.querySelectorAll('[data-hero-in]').forEach((w, i) => w.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: d + 450 + i * 90, easing: E, fill: 'backwards' }));
    }
    const wait = (n = 0) => { if (window.gsap && window.ScrollTrigger) initAnim(c); else if (n < 100) setTimeout(() => wait(n + 1), 50); };
    wait();
  }

  function unmount(c) {
    c._mq && c._mq.removeEventListener('change', c._onMq);
    removeEventListener('keydown', c._onKey); removeEventListener('scroll', c._onScroll);
    document.removeEventListener('click', c._onClick);
    c._ctx && c._ctx.revert(); c._lenis && c._lenis.destroy(); c._tick && window.gsap && window.gsap.ticker.remove(c._tick);
  }

  let rt;
  const refresh = () => { clearTimeout(rt); rt = setTimeout(() => window.ScrollTrigger && window.ScrollTrigger.refresh(), 150); };

  return { mount, unmount, menu, goPage, scrollTo, refresh, buttons, reduced, E, IO };
})();
