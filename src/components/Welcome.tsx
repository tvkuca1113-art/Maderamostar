import { useUi } from '../state/ui';
import { ArrowIcon } from './Header';
import { StyleShortcuts } from './StyleShortcuts';

const PILLARS = [
  {
    title: 'Po mjeri vašeg otvora',
    text: 'Približne mjere unesete odmah, a tačne mjere i smjer otvaranja potvrđujemo prije izrade. Ne znate mjere? I to je u redu.',
  },
  {
    title: 'Detalji koje vi birate',
    text: 'Hrastov furnir, bijele i tamne plohe, staklo s mrežom, zlatni detalji, skrivene baglame i magnetne brave — primjeri iz naših izvedbi.',
  },
  {
    title: 'Od izrade do montaže',
    text: 'Vrata izrađujemo, dopremamo i montiramo na području Hercegovine. Jedan upit pokriva sve prostorije u vašem domu.',
  },
];

/** Prva sekcija „iza vrata”: dobrodošlica, vrijednosti i brz početak izbora. */
export function Welcome() {
  const { goTo } = useUi();
  return (
    <section className="welcome" id="dobrodosli" aria-labelledby="dobrodosli-naslov">
      <div className="container">
        <div className="welcome__head">
          <div>
            <p className="eyebrow eyebrow--section">Dobro došli unutra</p>
            <h2 id="dobrodosli-naslov" className="welcome__title">
              Iza dobrih vrata je prostor koji volite.
            </h2>
          </div>
          <div className="welcome__text">
            <p>
              Vrata su ono što svaki dan dodirnete, otvorite i zatvorite. Zato ih radimo po mjeri vašeg prostora — od toplog hrastovog furnira do čistih bijelih ploha, staklenih,
              kliznih i skrivenih izvedbi.
            </p>
            <p>Vi birate izgled. Mi pazimo na mjere, izradu i montažu.</p>
          </div>
        </div>
        <ol className="pillars">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="pillar">
              <span className="pillar__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ol>
        <div className="welcome__start">
          <StyleShortcuts />
          <div className="welcome__actions">
            <button type="button" className="btn btn--primary" onClick={() => goTo('konfigurator')}>
              Kreiraj svoj izbor
              <ArrowIcon />
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => goTo('modeli')}>
              Pogledaj modele
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
