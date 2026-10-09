import { getProduct } from '../data';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { MOBILE_QUERY, useMediaQuery } from '../lib/useMediaQuery';
import { ArrowIcon } from './Header';

/** Prečice „Pronađite svoj stil” vode do stvarnih zapisa u konfiguratoru. */
export const STYLE_SHORTCUTS = [
  { label: 'Hrast', productId: 'hrast-furnir-h', swatch: 'radial-gradient(circle at 35% 30%, #d9a873, #a8723f 70%)' },
  { label: 'Bijela', productId: 'bijela-zlatni-detalji', swatch: 'radial-gradient(circle at 35% 30%, #ffffff, #e9e6df 75%)' },
  { label: 'Tamna sa staklom', productId: 'antracit-staklo-mreza', swatch: 'radial-gradient(circle at 35% 30%, #55585e, #26282b 70%)' },
  { label: 'Skrivena', productId: 'skrivena-siva', swatch: 'radial-gradient(circle at 35% 30%, #dcdedd, #b3b7b6 75%)' },
];

function StyleShortcuts() {
  const { state, dispatch } = useStore();
  const { goTo } = useUi();
  const active = STYLE_SHORTCUTS.find((s) => s.productId === state.draft.productId);
  const activeName = active ? getProduct(active.productId)?.displayName : null;
  return (
    <div className="style-picker">
      <p className="style-picker__title" id="stil-naslov">
        Pronađite svoj stil
      </p>
      <ul className="style-picker__list" aria-labelledby="stil-naslov">
        {STYLE_SHORTCUTS.map((s) => {
          const isActive = s.productId === state.draft.productId;
          return (
            <li key={s.productId}>
              <button
                type="button"
                className={`style-swatch${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => {
                  dispatch({ type: 'draft/selectProduct', productId: s.productId });
                  goTo('konfigurator');
                }}
              >
                <span className="style-swatch__dot" style={{ background: s.swatch }} aria-hidden="true" />
                <span className="style-swatch__label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="style-picker__active" aria-live="polite">
        {activeName ? (
          <>
            Odabrano: <strong>{activeName}</strong>
          </>
        ) : (
          'Odaberite primjer i otvorite ga u konfiguratoru.'
        )}
      </p>
    </div>
  );
}

export function Hero() {
  const { goTo } = useUi();
  const mobile = useMediaQuery(MOBILE_QUERY);

  const primary = (
    <a
      href="#konfigurator"
      className="btn btn--primary btn--lg"
      onClick={(e) => {
        e.preventDefault();
        goTo('konfigurator');
      }}
    >
      Odaberi svoja vrata
      <ArrowIcon />
    </a>
  );
  const secondary = (
    <a href="#modeli" className="btn btn--ghost btn--lg">
      Pogledaj modele
    </a>
  );

  return (
    <section className="hero" id="top" aria-labelledby="hero-naslov">
      <div className="hero__stage">
        <picture className="hero__media">
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/images/madera/opt/hero-hrast-mobile-640.avif 640w, /images/madera/opt/hero-hrast-mobile-1024.avif 1024w"
            sizes="100vw"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/images/madera/opt/hero-hrast-mobile-640.webp 640w, /images/madera/opt/hero-hrast-mobile-1024.webp 1024w"
            sizes="100vw"
          />
          <source media="(max-width: 767px)" srcSet="/images/madera/hero-hrast-mobile.png" width={1024} height={1536} />
          <source
            type="image/avif"
            srcSet="/images/madera/opt/hero-hrast-desktop-960.avif 960w, /images/madera/opt/hero-hrast-desktop-1440.avif 1440w, /images/madera/opt/hero-hrast-desktop-1672.avif 1672w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/images/madera/opt/hero-hrast-desktop-960.webp 960w, /images/madera/opt/hero-hrast-desktop-1440.webp 1440w, /images/madera/opt/hero-hrast-desktop-1672.webp 1672w"
            sizes="100vw"
          />
          <img
            src="/images/madera/hero-hrast-desktop.png"
            width={1672}
            height={941}
            alt="Ilustracija ambijenta: hrastova sobna vrata u svijetlom prostoru s biljkom u vazi."
            {...({ fetchpriority: 'high' } as Record<string, string>)}
            decoding="async"
          />
        </picture>
        <div className="hero__text">
          <p className="eyebrow">Madera · Vrata po mjeri</p>
          <h1 id="hero-naslov" className="hero__title">
            Vaša vrata.
            <br />
            Vaš izbor.
          </h1>
          <p className="hero__lead">Odaberite model, boju i detalje. Zatražite ponudu za svoj dom.</p>
          <p className="hero__service">Izrada, doprema i montaža sobnih vrata u Hercegovini.</p>
          {!mobile && (
            <>
              <div className="hero__actions">
                {primary}
                {secondary}
              </div>
              <StyleShortcuts />
            </>
          )}
        </div>
        {mobile && <div className="hero__floor-action">{primary}</div>}
        {!mobile && <p className="hero__note">Ilustracija ambijenta</p>}
      </div>
      {mobile && (
        <div className="hero__below">
          <p className="hero__note">Ilustracija ambijenta</p>
          {secondary}
          <StyleShortcuts />
        </div>
      )}
    </section>
  );
}
