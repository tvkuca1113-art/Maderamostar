import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useUi } from '../state/ui';
import { ArrowIcon } from './Header';

/**
 * Početni ekran „Otvori vrata”: fotografija ambijenta s logom i menijem preko nje.
 * Na skrol ili klik krilo se otvara oko baglama (desno, kvaka lijevo kao na originalu),
 * kamera prilazi otvoru i prolazi kroz vrata u ostatak stranice.
 * Krilo je isječak iste fotografije, pa otvaranje izgleda kao stvarna vrata sa slike.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

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
    let raf = 0;
    // Pomak otvora prema sredini ekrana mjeri se na početnoj poziciji (bez zumiranja).
    let toCenter = { x: 0, y: 0, scale: 6 };
    const measure = () => {
      sticky.style.setProperty('--zoom', '1');
      sticky.style.setProperty('--tx', '0px');
      sticky.style.setProperty('--ty', '0px');
      const r = doorway.getBoundingClientRect();
      const s = sticky.getBoundingClientRect();
      const cx = r.left + r.width / 2 - s.left;
      const cy = r.top + r.height / 2 - s.top;
      toCenter = {
        x: s.width / 2 - cx,
        y: s.height / 2 - cy,
        scale: Math.max(s.width / Math.max(r.width, 1), s.height / Math.max(r.height, 1)) * 1.25,
      };
    };
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const p = reduced ? 0 : clamp01(-rect.top / total);
      const open = ease(range(p, 0.04, 0.42));
      const zoom = ease(range(p, 0.28, 0.86));
      sticky.style.setProperty('--angle', `${(-82 * open).toFixed(2)}deg`);
      sticky.style.setProperty('--shade', (open * 0.5).toFixed(3));
      sticky.style.setProperty('--text', (1 - range(p, 0.02, 0.22)).toFixed(3));
      sticky.style.setProperty('--light', (0.55 + open * 0.45).toFixed(3));
      sticky.style.setProperty('--zoom', (1 + (toCenter.scale - 1) * zoom ** 1.7).toFixed(4));
      sticky.style.setProperty('--tx', `${(toCenter.x * zoom).toFixed(1)}px`);
      sticky.style.setProperty('--ty', `${(toCenter.y * zoom).toFixed(1)}px`);
      sticky.style.setProperty('--veil', range(p, 0.7, 0.9).toFixed(3));
      sticky.dataset.stage = p >= 0.98 ? 'inside' : p > 0.02 ? 'opening' : 'closed';
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };
    // Mjerenje tek kad se slika učita (stvarne dimenzije scene).
    const img = sticky.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', onResize, { once: true });
    onResize();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  /** „Otvori vrata”: mirno, vođeno skrolanje kroz cijelu animaciju (≈ 2,4 s), zatim u stranicu. */
  const openDoor = () => {
    const section = sectionRef.current;
    if (!section || animating.current) return;
    if (reduced) {
      goTo('dobrodosli');
      return;
    }
    const start = window.scrollY;
    const end = section.offsetTop + section.offsetHeight - window.innerHeight + 2;
    const duration = 2400;
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
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      window.scrollTo(0, start + (end - start) * e);
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
        <div className="entry__scene" aria-hidden="true">
          <HeroPicture className="entry__photo" />
          <div ref={doorwayRef} className="entry__doorway">
            <div className="entry__beyond">
              <img src="/images/brand/madera-logo-light.svg" alt="" width={1232} height={490} />
            </div>
          </div>
          <div className="entry__leaf">
            <HeroPicture className="entry__leaf-photo" />
            <span className="entry__leaf-shade" />
          </div>
        </div>
        <div className="entry__veil" aria-hidden="true" />

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
