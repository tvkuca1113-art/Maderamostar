import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useUi } from '../state/ui';
import { ArrowIcon } from './Header';

/**
 * Početni ekran „Otvori vrata”: fotografija ambijenta s logom i menijem preko nje.
 * Na skrol ili klik kvaka se spusti, brava „škljocne”, krilo se otvara oko baglama (desno, kvaka lijevo kao na originalu),
 * kamera se okrene prema otvoru i prođe kroz vrata u ostatak stranice.
 * Tehnika „portala”: fotografija se nikad ne uvećava do mutnoće — soba iza vrata (render istim materijalima i suncem)
 * je zaseban oštar sloj izrezan na oblik otvora, a kretanje prati skrol s prigušenjem (glatko i na točkiću miša).
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function HeroPicture({ className }: { className?: string }) {
  return (
    <picture className={className}>
      <source
        media="(max-width: 767px)"
        type="image/avif"
        srcSet="/images/madera/opt/hero-hrast-mobile-640.avif 640w, /images/madera/opt/hero-hrast-mobile-1024.avif 1024w"
        sizes="150vw"
      />
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet="/images/madera/opt/hero-hrast-mobile-640.webp 640w, /images/madera/opt/hero-hrast-mobile-1024.webp 1024w"
        sizes="150vw"
      />
      <source media="(max-width: 767px)" srcSet="/images/madera/hero-hrast-mobile.png" />
      <source
        type="image/avif"
        srcSet="/images/madera/opt/hero-hrast-desktop-960.avif 960w, /images/madera/opt/hero-hrast-desktop-1440.avif 1440w, /images/madera/opt/hero-hrast-desktop-1672.avif 1672w"
        sizes="110vw"
      />
      <source
        type="image/webp"
        srcSet="/images/madera/opt/hero-hrast-desktop-960.webp 960w, /images/madera/opt/hero-hrast-desktop-1440.webp 1440w, /images/madera/opt/hero-hrast-desktop-1672.webp 1672w"
        sizes="110vw"
      />
      <img src="/images/madera/hero-hrast-desktop.png" width={1672} height={941} alt="" decoding="async" {...({ fetchpriority: 'high' } as Record<string, string>)} />
    </picture>
  );
}

export function Entry() {
  const { goTo } = useUi();
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const doorwayRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const animating = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const doorway = doorwayRef.current;
    if (!section || !sticky || !doorway) return;
    const set = (k: string, v: string) => sticky.style.setProperty(k, v);

    /* Geometrija se mjeri jednom (bez kretanja kamere) i poslije samo preračunava — nema layouta po frameu. */
    let g = { w: 1, h: 1, dx: 0, dy: 0, dw: 1, dh: 1, ox: 0, oy: 0, max: 6, s0: 0.6, sx0: 0, sy0: 0, sx1: 1, sy1: 1 };
    const measure = () => {
      set('--zoom', '1');
      set('--tx', '0px');
      set('--ty', '0px');
      const s = sticky.getBoundingClientRect();
      const r = doorway.getBoundingClientRect();
      const scene = doorway.parentElement?.getBoundingClientRect() ?? s;
      const dw = Math.max(r.width, 1);
      const dh = Math.max(r.height, 1);
      g = {
        w: s.width,
        h: s.height,
        dx: r.left - s.left,
        dy: r.top - s.top,
        dw,
        dh,
        ox: r.left - s.left + dw / 2,
        oy: r.top - s.top + dh / 2,
        // Kamera staje tek kad je otvor veći od ekrana — okvir izlazi iz kadra, ništa se ne „rasteže”.
        max: Math.max(s.width / dw, s.height / dh) * 1.18,
        // Soba iza vrata je dalje od kamere nego okvir: u otvoru je umanjena i raste sporije (paralaksa dubine).
        s0: Math.min(1, Math.max(0.55, Math.max(dw / s.width, dh / s.height) * 1.04)),
        // Rubovi fotografije (s produžetkom zida iznad nje, .entry__mirror = 28 % visine).
        sx0: scene.left - s.left,
        sy0: scene.top - s.top - scene.height * 0.28,
        sx1: scene.right - s.left,
        sy1: scene.bottom - s.top,
      };
      // Perspektiva odgovara kameri fotografije (žarišna daljina ≈ 0,9 × širina vodoravnog, 1,15 × uspravnog kadra).
      set('--persp', `${Math.round(scene.width * (scene.width > scene.height ? 0.9 : 1.15))}px`);
    };

    /** Pomak kamere ograničen tako da rub fotografije nikad ne uđe u kadar. */
    const clampShift = (want: number, zoom: number, o: number, a: number, b: number, size: number) => {
      const min = size - (o + (b - o) * zoom);
      const max = -(o + (a - o) * zoom);
      return min > max ? (min + max) / 2 : Math.min(max, Math.max(min, want));
    };

    const apply = (p: number) => {
      // Ruka spusti kvaku, brava škljocne, krilo krene; kvaka se vraća dok se vrata otvaraju.
      const press = easeOut(range(p, 0.012, 0.04));
      const release = ease(range(p, 0.085, 0.14));
      const latch = easeOut(range(p, 0.04, 0.08));
      const swing = ease(range(p, 0.08, 0.5));
      // Dok kamera prolazi, krilo se otvori do kraja i sakrije iza štoka (ne blijedi, ne „lebdi” ispred sobe).
      const fully = ease(range(p, 0.5, 0.8));
      const turn = ease(range(p, 0.24, 0.74));
      const walk = ease(range(p, 0.28, 1));
      const zoom = Math.exp(Math.log(g.max) * walk);
      const f = (zoom - 1) / (g.max - 1);
      const tx = clampShift((g.w / 2 - g.ox) * turn, zoom, g.ox, g.sx0, g.sx1, g.w);
      const ty = clampShift((g.h / 2 - g.oy) * turn, zoom, g.oy, g.sy0, g.sy1, g.h);
      // Otvor na ekranu nakon kretanja kamere (skaliranje oko središta otvora + pomak).
      const left = g.ox + (g.dx - g.ox) * zoom + tx;
      const top = g.oy + (g.dy - g.oy) * zoom + ty;
      const right = left + g.dw * zoom;
      const bottom = top + g.dh * zoom;

      set('--lever', `${(32 * press * (1 - release)).toFixed(2)}deg`);
      set('--angle', `${(-(3 * latch + 85 * swing + 27 * fully)).toFixed(2)}deg`);
      set('--open', Math.max(swing, latch * 0.15).toFixed(3));
      set('--text', (1 - range(p, 0.015, 0.15)).toFixed(3));
      set('--zoom', zoom.toFixed(4));
      set('--tx', `${tx.toFixed(1)}px`);
      set('--ty', `${ty.toFixed(1)}px`);
      set('--scene-fade', (1 - range(f, 0.84, 1)).toFixed(3));
      set('--clip', `${Math.max(0, top).toFixed(1)}px ${Math.max(0, g.w - right).toFixed(1)}px ${Math.max(0, g.h - bottom).toFixed(1)}px ${Math.max(0, left).toFixed(1)}px`);
      // Soba prekriva vidljivi dio otvora (otvor ∩ ekran); raste sporije od okvira, a na kraju je tačno preko ekrana.
      const vx0 = Math.max(0, left);
      const vy0 = Math.max(0, top);
      const vx1 = Math.min(g.w, right);
      const vy1 = Math.min(g.h, bottom);
      const roomScale = Math.max(g.s0 + (1 - g.s0) * f, ((vx1 - vx0) / g.w) * 1.02, ((vy1 - vy0) / g.h) * 1.02);
      set('--px', `${((vx0 + vx1) / 2 - g.w / 2).toFixed(1)}px`);
      set('--py', `${((vy0 + vy1) / 2 - g.h / 2).toFixed(1)}px`);
      set('--ps', Math.min(1.02, roomScale).toFixed(4));
      // Oko se privikava: soba je u početku presvijetla, a pri ulasku dobija pune tonove.
      set('--glare', (0.32 * (1 - f)).toFixed(3));
      set('--blend', range(f, 0.75, 1).toFixed(3));
      sticky.dataset.stage = p >= 0.985 ? 'inside' : p > 0.012 ? 'opening' : 'closed';
    };

    /* Skrol daje cilj, a animacija ga prati s prigušenjem (kao Lenis): bez trzaja kod točkića miša. */
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      return reduced ? 0 : clamp01(-rect.top / total);
    };
    let current = progress();
    let target = current;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      current += (target - current) * (1 - Math.exp(-dt / 0.11));
      if (Math.abs(target - current) < 0.0004) current = target;
      apply(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    };
    const onScroll = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      current = target = progress();
      apply(current);
    };
    // Mjerenje tek kad se slika učita (stvarne dimenzije scene).
    const img = sticky.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', onResize, { once: true });
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  /** „Otvori vrata”: mirno, vođeno skrolanje kroz cijelu animaciju (≈ 3,4 s), zatim u stranicu. */
  const openDoor = () => {
    const section = sectionRef.current;
    if (!section || animating.current) return;
    if (reduced) {
      goTo('dobrodosli');
      return;
    }
    const start = window.scrollY;
    const end = section.offsetTop + section.offsetHeight - window.innerHeight + 2;
    const duration = 3400;
    const t0 = performance.now();
    animating.current = true;
    const cancel = () => {
      animating.current = false;
    };
    window.addEventListener('wheel', cancel, { once: true, passive: true });
    window.addEventListener('touchstart', cancel, { once: true, passive: true });
    const step = (now: number) => {
      if (!animating.current) return;
      const k = Math.min(1, (now - t0) / duration);
      const e = ease(k);
      window.scrollTo({ top: start + (end - start) * e, behavior: 'instant' });
      if (k < 1) requestAnimationFrame(step);
      else {
        animating.current = false;
        goTo('dobrodosli');
      }
    };
    requestAnimationFrame(step);
  };

  return (
    <section ref={sectionRef} className={`entry${reduced ? ' entry--static' : ''}`} id="top" aria-labelledby="hero-naslov">
      <div ref={stickyRef} className="entry__sticky" data-stage="closed">
        {/* Stražnji sloj: fotografija prostorije (s produžetkom zida iznad) i svjetlo koje kroz otvor pada na pod. */}
        <div className="entry__scene entry__scene--back" aria-hidden="true">
          <div className="entry__mirror">
            <HeroPicture className="entry__photo" />
          </div>
          <HeroPicture className="entry__photo" />
          <div ref={doorwayRef} className="entry__doorway" />
          <span className="entry__spill" />
        </div>
        {/* Soba iza vrata (render istim materijalima i suncem): zaseban oštar sloj, uvijek izrezan na otvor. */}
        <div className="entry__portal" aria-hidden="true">
          <picture className="entry__room">
            <source media="(orientation: portrait)" type="image/avif" srcSet="/images/madera/entry/room-mobile-720.avif 720w, /images/madera/entry/room-mobile-1080.avif 1080w" sizes="100vw" />
            <source media="(orientation: portrait)" type="image/webp" srcSet="/images/madera/entry/room-mobile-720.webp 720w, /images/madera/entry/room-mobile-1080.webp 1080w" sizes="100vw" />
            <source type="image/avif" srcSet="/images/madera/entry/room-desktop-1280.avif 1280w, /images/madera/entry/room-desktop-1920.avif 1920w" sizes="100vw" />
            <img
              src="/images/madera/entry/room-desktop-1920.webp"
              srcSet="/images/madera/entry/room-desktop-1280.webp 1280w, /images/madera/entry/room-desktop-1920.webp 1920w"
              sizes="100vw"
              width={1920}
              height={1200}
              alt=""
              decoding="async"
              {...({ fetchpriority: 'low' } as Record<string, string>)}
            />
          </picture>
        </div>
        {/* Prednji sloj: dubina štoka, sjena uz baglame i krilo s pravom kvakom koja se spušta. */}
        <div className="entry__scene entry__scene--front" aria-hidden="true">
          <div className="entry__hinge">
            <span className="entry__ao" />
            <div className="entry__leaf">
              <picture className="entry__leaf-photo">
                <source media="(max-width: 767px)" type="image/avif" srcSet="/images/madera/entry/leaf-mobile-331.avif" />
                <source media="(max-width: 767px)" type="image/webp" srcSet="/images/madera/entry/leaf-mobile-331.webp" />
                <source type="image/avif" srcSet="/images/madera/entry/leaf-desktop-308.avif" />
                <img src="/images/madera/entry/leaf-desktop-308.webp" width={308} height={745} alt="" decoding="async" />
              </picture>
              <picture className="entry__lever">
                <source media="(max-width: 767px)" srcSet="/images/madera/entry/lever-mobile.webp" />
                <img src="/images/madera/entry/lever-desktop.webp" width={60} height={24} alt="" decoding="async" />
              </picture>
              <span className="entry__leaf-shade" />
            </div>
          </div>
          <span className="entry__jamb" />
        </div>

        <div className="entry__text">
          <p className="eyebrow">Madera · Sobna vrata po mjeri · Mostar</p>
          <h1 id="hero-naslov" className="entry__title">
            Svaki dom
            <br />
            počinje vratima.
          </h1>
          <p className="entry__lead">
            Izrađujemo, dopremamo i montiramo sobna vrata po mjeri u Hercegovini. Izaberite izgled, pogledajte ga u 3D i pošaljite jedan upit za cijeli dom.
          </p>
          <div className="entry__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={openDoor}>
              Otvori vrata
              <ArrowIcon />
            </button>
            <a
              href="#konfigurator"
              className="btn btn--ghost btn--lg"
              onClick={(e) => {
                e.preventDefault();
                goTo('konfigurator');
              }}
            >
              Kreiraj svoj izbor
            </a>
          </div>
        </div>

        <button type="button" className="entry__hint" onClick={openDoor}>
          <span>Skrolajte i uđite</span>
          <span className="entry__hint-line" aria-hidden="true" />
        </button>
        <p className="entry__note">Ilustracija ambijenta</p>
      </div>
    </section>
  );
}
