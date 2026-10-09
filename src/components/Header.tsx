import { useEffect, useRef, useState } from 'react';
import { pricing } from '../data';
import { isPricingActive } from '../lib/pricing';

export const NAV = [
  { href: '#modeli', label: 'Modeli' },
  { href: '#konfigurator', label: 'Konfigurator' },
  { href: '#radovi', label: 'Naši radovi' },
  { href: '#kontakt', label: 'Kontakt' },
];

export const calcLabel = () => (isPricingActive(pricing) ? 'Kalkulator' : 'Planer vrata');

export function Brand() {
  return (
    <a href="#top" className="brand" aria-label="Madera, na početak stranice">
      <img className="brand__logo" src="/images/brand/madera-logo-light.svg" alt="Madera" width={1232} height={490} />
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  // Preko početne fotografije zaglavlje je prozirno; puna pozadina tek kad se uđe u stranicu.
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('top');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      const inHero = heroBottom > 90;
      setOverHero(inHero);
      setScrolled(!inHero && window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 900 && setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header${scrolled || open ? ' is-scrolled' : ''}${overHero ? ' is-over-hero' : ''}`}>
      <div className="site-header__inner">
        <Brand />
        <nav className="site-nav" aria-label="Glavna navigacija">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#kalkulator" className="btn btn--primary btn--sm site-header__cta">
          {calcLabel()}
          <ArrowIcon />
        </a>
        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobilni-meni"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="visually-hidden">{open ? 'Zatvori meni' : 'Otvori meni'}</span>
          <span className="menu-toggle__bars" aria-hidden="true" />
        </button>
      </div>
      <div id="mobilni-meni" ref={menuRef} className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobilna navigacija">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={close}>
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#kalkulator" className="btn btn--primary" onClick={close}>
                {calcLabel()}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function ArrowIcon() {
  return (
    <svg className="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
