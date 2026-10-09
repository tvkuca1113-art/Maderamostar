import { useState } from 'react';
import { products } from '../data';
import { CATALOG_FILTERS, matchesFilter, type CatalogFilter } from '../lib/options';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { Product } from '../types';
import { ProductPicture } from './Picture';

const INITIAL_COUNT = 6;

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
          <p className="eyebrow eyebrow--section">Modeli vrata</p>
          <h2 id="modeli-naslov">Pronađite vrata za svoj prostor.</h2>
          <p className="section__lead">Od toplog hrastovog furnira do čistih bijelih ploha i staklenih izvedbi.</p>
        </div>
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
