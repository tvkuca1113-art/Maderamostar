import { useState } from 'react';
import { products } from '../data';
import { CATALOG_FILTERS, matchesFilter, type CatalogFilter } from '../lib/options';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Product } from '../types';
import { ProductPicture } from './Picture';

const INITIAL_COUNT = 6;
const COLLECTIONS: { label: string; filter: CatalogFilter; productId: string; detail: string }[] = [
  { label: 'Bijela i moderna', filter: 'Moderna', productId: 'olimpus-bijeli', detail: 'Čiste linije, vaš izbor detalja' },
  { label: 'Prirodni furnir', filter: 'Furnir', productId: 'hrast-furnir-h', detail: 'Toplina i tekstura drveta' },
  { label: 'Vrata sa staklom', filter: 'Staklo', productId: 'antracit-staklo-mreza', detail: 'Svjetlo između prostorija' },
  { label: 'Klizna vrata', filter: 'Klizna', productId: 'klizna-staklo', detail: 'Drugačiji način otvaranja' },
  { label: 'Skrivena vrata', filter: 'Skrivena', productId: 'skrivena-siva', detail: 'U ravnini vašeg zida' },
];

export function recordLabel(p: Product): string {
  return p.recordType === 'named_model' ? 'Primjer modela' : 'Izvedba po želji';
}

function ProductCard({ product }: { product: Product }) {
  const { openProduct, goTo } = useUi();
  const { state, dispatch } = useStore();
  const titleId = `kartica-${product.id}`;
  const selected = state.draft.productId === product.id;
  return (
    <li className={`card${selected ? ' is-selected' : ''}`}>
      <article aria-labelledby={titleId}>
        <button type="button" className="card__media" onClick={() => openProduct(product.id)} aria-label={`Detalji: ${product.displayName}`}>
          <ProductPicture src={product.image} alt={product.imageAlt} sizes="(max-width: 599px) 45vw, (max-width: 1023px) 45vw, 400px" />
        </button>
        <div className="card__body">
          <p className="tag">{recordLabel(product)}</p>
          <h3 id={titleId} className="card__title">
            {product.displayName}
          </h3>
          <p className="card__text">{product.description}</p>
          <div className="card__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              aria-label={`Odaberi model: ${product.displayName}`}
              onClick={() => {
                dispatch({ type: 'draft/selectProduct', productId: product.id });
                goTo('konfigurator');
              }}
            >
              Odaberi model
            </button>
            <button
              type="button"
              className="text-link card__action"
              aria-label={`Pogledaj detalje: ${product.displayName}`}
              onClick={() => openProduct(product.id)}
            >
              Detalji
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}

export function Catalog() {
  const [filter, setFilter] = useState<CatalogFilter>('Sva vrata');
  const [expanded, setExpanded] = useState(false);
  const matching = products.filter((p) => matchesFilter(p, filter));
  const limited = filter === 'Sva vrata' && !expanded;
  const visible = limited ? matching.slice(0, INITIAL_COUNT) : matching;

  return (
    <section className="section catalog" id="modeli" aria-labelledby="modeli-naslov">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow eyebrow--section">01 · Pronađite svoj stil</p>
          <h2 id="modeli-naslov">Jedan dom. Mnogo mogućnosti.</h2>
          <p className="section__lead">Prvo pogledajte šta izrađujemo. Odaberite vrstu vrata, istražite modele i tek onda prilagodite boju, kvaku i mjere.</p>
        </div>
        <ul className="collections" aria-label="Vrste vrata u ponudi">
          {COLLECTIONS.map((c) => {
            const p = products.find((product) => product.id === c.productId)!;
            return (
              <li key={c.filter}>
                <button type="button" className="collection" aria-pressed={filter === c.filter} aria-label={`Pregledaj kolekciju: ${c.label}`} onClick={() => setFilter(c.filter)}>
                  <span className="collection__image"><ProductPicture src={p.image} alt="" sizes="(max-width: 599px) 70vw, 250px" /></span>
                  <span className="collection__name">{c.label}<span aria-hidden="true">↗</span></span>
                  <span className="collection__detail">{c.detail}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="catalog__index"><h3>Pregled modela i izvedbi</h3><span>Od modela do ponude, korak po korak.</span></div>
        <div className="filters" role="group" aria-label="Filtriraj vrata">
          {CATALOG_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${filter === f ? ' is-active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="visually-hidden" aria-live="polite">
          {matching.length === 0 ? 'Nema rezultata.' : `Prikazano ${visible.length} od ${matching.length} zapisa.`}
        </p>
        {matching.length === 0 ? (
          <div className="empty">
            <p>Za ovaj izbor trenutno nema objavljenih primjera.</p>
            <p>
              Opišite željena vrata u upitu ili{' '}
              <button type="button" className="text-link" onClick={() => setFilter('Sva vrata')}>
                pogledajte sva vrata
              </button>
              .
            </p>
          </div>
        ) : (
          <ul className="cards">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        )}
        {limited && matching.length > INITIAL_COUNT && (
          <div className="catalog__more">
            <button type="button" className="btn btn--ghost" onClick={() => setExpanded(true)}>
              Pogledaj sve izvedbe ({matching.length})
            </button>
          </div>
        )}
        <p className="catalog__note">
          Prikazani su primjeri iz objava na Maderinom profilu. Aktuelne modele, obrade i dostupnost potvrđuje Madera.
        </p>
      </div>
    </section>
  );
}
