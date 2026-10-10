import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useUi } from '../state/ui';
import { CORRIDOR_VP, CorridorScene } from './Corridor';
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
    let g = { w: 1, h: 1, dx: 0, dy: 0, dw: 1, dh: 1, ox: 0, oy: 0, max: 6, s0: 0.5, sx0: 0, sy0: 0, sx1: 1, sy1: 1, vx: 0.5, vy: 0.5 };
    const measure = () => {
      set('--zoom', '1');
      set('--tx', '0px');
      set('--ty', '0px');
      set('--px', '0px');
      set('--py', '0px');
      set('--ps', '1');
      const s = sticky.getBoundingClientRect();
      // Nedogled hodnika u završnom rasporedu: oko njega soba raste, a na kraju stoji tačno na svom mjestu.
      const photo = sticky.querySelector('.entry__room .corridor__photo')?.getBoundingClientRect();
      const vx = photo ? photo.left - s.left + photo.width * CORRIDOR_VP.x : s.width / 2;
      const vy = photo ? photo.top - s.top + photo.height * CORRIDOR_VP.y : s.height / 2;
      set('--vpx', `${vx.toFixed(1)}px`);
      set('--vpy', `${vy.toFixed(1)}px`);
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
        // Hodnik je dalje od kamere nego okvir: u otvoru je umanjen i raste sporije (paralaksa dubine).
        s0: 0.5,
        // Rubovi fotografije (s produžetkom zida iznad nje, .entry__mirror = 28 % visine).
        sx0: scene.left - s.left,
        sy0: scene.top - s.top - scene.height * 0.28,
        sx1: scene.right - s.left,
        sy1: scene.bottom - s.top,
        vx: Math.min(s.width - 1, Math.max(1, vx)),
        vy: Math.min(s.height - 1, Math.max(1, vy)),
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
      const fully = ease(range(p, 0.48, 0.74));
      const turn = ease(range(p, 0.22, 0.7));
      const walk = ease(range(p, 0.26, 0.84));
      // Dolazak: naslov, tačke na vratima i dugme se pojave; ostatak skrola je zastoj za razgledanje.
      const arrive = ease(range(p, 0.8, 0.92));
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
      // Hodnik: nedogled je u početku u sredini otvora, a na kraju na svom mjestu u rasporedu (bez skoka).
      // Uvijek prekriva vidljivi dio otvora (otvor ∩ ekran) i raste sporije od okvira.
      const vx0 = Math.max(0, left);
      const vy0 = Math.max(0, top);
      const vx1 = Math.min(g.w, right);
      const vy1 = Math.min(g.h, bottom);
      const Tx = (vx0 + vx1) / 2 + (g.vx - g.w / 2) * f;
      const Ty = (vy0 + vy1) / 2 + (g.vy - g.h / 2) * f;
      const need = Math.max((Tx - vx0) / g.vx, (vx1 - Tx) / (g.w - g.vx), (Ty - vy0) / g.vy, (vy1 - Ty) / (g.h - g.vy));
      const roomScale = f >= 0.9995 ? 1 : Math.max(g.s0 + (1 - g.s0) * f, need * (1 + 0.012 * (1 - f)));
      set('--px', `${(Tx - g.vx).toFixed(1)}px`);
      set('--py', `${(Ty - g.vy).toFixed(1)}px`);
      set('--ps', roomScale.toFixed(4));
      // Oko se privikava: hodnik je u početku presvijetao, a pri ulasku dobija pune tonove.
      set('--glare', (0.26 * (1 - f)).toFixed(3));
      set('--arrive', arrive.toFixed(3));
      sticky.dataset.stage = p >= 0.8 ? 'inside' : p > 0.012 ? 'opening' : 'closed';
    };

    /* Skrol daje cilj, a animacija ga prati s prigušenjem (kao Lenis): bez trzaja kod točkića miša. */
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, rect.height - sticky.offsetHeight);
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

  /** „Otvori vrata”: mirno, vođeno skrolanje kroz animaciju (≈ 3,6 s) do hodnika; fokus ide na naslov hodnika. */
  const openDoor = () => {
    const section = sectionRef.current;
    if (!section || animating.current) return;
    const heading = () => document.getElementById('hodnik-naslov');
    if (reduced) {
      heading()?.scrollIntoView({ block: 'start' });
      heading()?.focus({ preventScroll: true });
      return;
    }
    const sticky = stickyRef.current;
    const start = window.scrollY;
    const end = section.offsetTop + (section.offsetHeight - (sticky?.offsetHeight ?? window.innerHeight)) * 0.93;
    const duration = 3600;
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
        // Kraj animacije: hodnik je na ekranu, fokus na njegov naslov (tastatura i čitači ekrana nastavljaju odatle).
        window.setTimeout(() => heading()?.focus({ preventScroll: true }), 450);
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
        {/* Hodnik iza vrata: zaseban oštar sloj, uvijek izrezan na otvor; na kraju je to završni ekran ulaza. */}
        {!reduced && (
          <div className="entry__portal">
            <div className="entry__room">
              <CorridorScene />
            </div>
          </div>
        )}
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
      {/* Uz smanjeno kretanje hodnik je obična sekcija ispod početne fotografije. */}
      {reduced && (
        <div className="entry__static-corridor">
          <CorridorScene />
        </div>
      )}
    </section>
  );
}
