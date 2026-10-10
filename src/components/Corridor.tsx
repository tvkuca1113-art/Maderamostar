import { getProduct } from '../data';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { ArrowIcon } from './Header';

/**
 * Hodnik iza vrata (prijedlog dizajna: docs/design/ulaz-hodnik-prijedlog.jpg): troje vrata — hrast, bijela, skrivena.
 * Dodir na tačku bira model u konfiguratoru. Fotografija je očišćena od upisanog teksta
 * (scripts/entry/clean-corridor.py), a naslov, tačke i dugme su pravi, pristupačni elementi.
 * Koordinate tačaka su u postocima fotografije (1024 × 1180).
 */
const DOORS: { productId: string; label: string; x: number; y: number; flip?: boolean }[] = [
  { productId: 'hrast-furnir-h', label: 'Hrast', x: 25.4, y: 41.6 },
  { productId: 'sara-bijeli', label: 'Bijela', x: 56.2, y: 47.6 },
  // Uz desni rub: natpis ide lijevo od tačke, da ne izađe iz kadra na uskim ekranima.
  { productId: 'skrivena-siva', label: 'Skrivena', x: 87.4, y: 48.4, flip: true },
];

/** Nedogled hodnika (bijela vrata na kraju), u postocima fotografije — oko njega kamera ulazi. */
export const CORRIDOR_VP = { x: 0.49, y: 0.52 };

export function CorridorScene({ headingId = 'hodnik-naslov' }: { headingId?: string }) {
  const { dispatch } = useStore();
  const { goTo } = useUi();
  const explore = (productId: string) => {
    dispatch({ type: 'draft/selectProduct', productId });
    goTo('konfigurator');
  };
  return (
    <div className="corridor">
      <div className="corridor__ambient" aria-hidden="true" />
      <div className="corridor__frame">
        <div className="corridor__photo">
          <picture>
            <source
              type="image/avif"
              srcSet="/images/madera/entry/hodnik-720.avif 720w, /images/madera/entry/hodnik-1024.avif 1024w"
              sizes="(orientation: landscape) 70vh, 112vw"
            />
            <img
              src="/images/madera/entry/hodnik-1024.webp"
              srcSet="/images/madera/entry/hodnik-720.webp 720w, /images/madera/entry/hodnik-1024.webp 1024w"
              sizes="(orientation: landscape) 70vh, 112vw"
              width={1024}
              height={1180}
              alt="Svijetli hodnik s troje vrata: hrastova, bijela i skrivena vrata u ravnini zida"
              decoding="async"
            />
          </picture>
          <div className="corridor__ui corridor__head">
            <p className="corridor__eyebrow">Madera · Vrata po mjeri</p>
            <h2 id={headingId} className="corridor__title" tabIndex={-1}>
              Uđite u svoj izbor.
            </h2>
          </div>
          <ul className="corridor__ui corridor__spots">
            {DOORS.map((d) => (
              <li key={d.productId} className={d.flip ? 'is-flipped' : undefined} style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                <button
                  type="button"
                  className="corridor__spot"
                  aria-label={`${d.label}: istražite model ${getProduct(d.productId)?.displayName ?? ''}`.trim()}
                  onClick={() => explore(d.productId)}
                >
                  <span className="corridor__ring" aria-hidden="true" />
                  <span className="corridor__label">{d.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="corridor__ui corridor__foot">
        <p>Dodirnite vrata i istražite model.</p>
        <button type="button" className="btn btn--primary btn--lg corridor__cta" onClick={() => goTo('konfigurator')}>
          Kreiraj svoj izbor
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
