import { useEffect, useRef, useState } from 'react';

export const NAV = [
  { href: '#modeli', label: 'Modeli' },
  { href: '#konfigurator', label: 'Konfigurator' },
  { href: '#radovi', label: 'Naši radovi' },
  { href: '#kontakt', label: 'Kontakt' },
];

export function Brand() {
  return (
    <a href="#top" className="brand" aria-label="Madera, na početak stranice">
      <span className="brand__word" aria-hidden="true">
        <span className="brand__m">M</span>adera
      </span>
      <span className="brand__sub" aria-hidden="true">
        Sobna vrata · Mostar
      </span>
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    <header className={`site-header${scrolled || open ? ' is-scrolled' : ''}`}>
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
          Kalkulator
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
                Kalkulator
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
