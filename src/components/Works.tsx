import { assetFor, siteConfig } from '../data';
import { useUi } from '../state/ui';
import { ProductPicture } from './Picture';

/** Samo originalne fotografije iz objava; opis navodi vrstu izvedbe, bez imena klijenata ili lokacija. */
const WORKS = [
  { src: '/images/madera/model-hrast-furnir-h.jpg', caption: 'Hrastov furnir s vodoravnim godovima' },
  { src: '/images/madera/izvedba-bijela-zlatni-detalji.jpg', caption: 'Bijela vrata sa zlatnim detaljima' },
  { src: '/images/madera/izvedba-antracit-staklo-mreza.jpg', caption: 'Tamna vrata sa staklom i mrežom' },
  { src: '/images/madera/izvedba-skrivena-siva.jpg', caption: 'Skrivena vrata u ravnini zida' },
];

export function Works() {
  const { openLightbox } = useUi();
  return (
    <section className="section works" id="radovi" aria-labelledby="radovi-naslov">
      <div className="container">
        <div className="section__head">
          <h2 id="radovi-naslov">Vrata u stvarnim prostorima.</h2>
          <p className="section__lead">Pogledajte primjere izvedbi objavljene na Maderinom profilu.</p>
        </div>
        <ul className="works__grid">
          {WORKS.map((w, i) => {
            const meta = assetFor(w.src);
            return (
              <li key={w.src} className={i === 0 ? 'works__item works__item--large' : 'works__item'}>
                <figure>
                  <button
                    type="button"
                    className="works__button"
                    aria-label={`Uvećaj fotografiju: ${w.caption}`}
                    onClick={() => openLightbox({ src: w.src, alt: meta?.alt ?? w.caption, caption: w.caption, width: meta?.width, height: meta?.height })}
                  >
                    <ProductPicture src={w.src} alt={meta?.alt ?? w.caption} sizes={i === 0 ? '(max-width: 767px) 92vw, 620px' : '(max-width: 767px) 92vw, 300px'} />
                  </button>
                  <figcaption>{w.caption}</figcaption>
                </figure>
              </li>
            );
          })}
          <li className="works__more">
            <p>Više izvedbi, montaža i detalja objavljeno je na Maderinom Instagram profilu.</p>
            <a className="btn btn--ghost" href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
              Više na Instagramu<span className="visually-hidden"> (otvara se u novom prozoru)</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
