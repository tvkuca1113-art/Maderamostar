import { getProduct } from '../data';
import { describeDetails } from '../lib/inquiry';
import { roomLabel } from '../lib/options';
import { quantityOf } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { EstimateView } from './EstimateView';
import { ArrowIcon } from './Header';

export function Project() {
  const { state, dispatch } = useStore();
  const { openInquiry, goTo } = useUi();
  const { items, location, editingId } = state;
  const total = items.reduce((s, i) => s + quantityOf(i), 0);

  return (
    <section className="section project" id="projekt" aria-labelledby="projekt-naslov">
      <div className="container">
        <div className="section__head">
          <h2 id="projekt-naslov">Jedan izbor. Cijeli dom.</h2>
          <p className="section__lead">Dodajte vrata za svaku prostoriju i pošaljite jedan pregledan upit.</p>
        </div>

        {items.length === 0 ? (
          <div className="empty project__empty">
            <p>Još niste dodali vrata u projekt.</p>
            <p>Odaberite model u katalogu ili konfiguratoru, zatim kliknite „Dodaj u moj projekt”.</p>
            <div className="empty__actions">
              <button type="button" className="btn btn--primary" onClick={() => goTo('konfigurator')}>
                Otvori konfigurator
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => goTo('modeli')}>
                Pogledaj modele
              </button>
            </div>
          </div>
        ) : (
          <div className="project__grid">
            <ol className="project__list" aria-label="Stavke projekta">
              {items.map((item, i) => {
                const product = getProduct(item.productId);
                const name = product?.displayName ?? item.productId;
                const label = roomLabel(item, i);
                return (
                  <li key={item.id} className={`project-item${editingId === item.id ? ' is-editing' : ''}`}>
                    {product && <img className="project-item__thumb" src={product.image} alt="" width={64} height={80} loading="lazy" />}
                    <div className="project-item__body">
                      <p className="project-item__room">{label}</p>
                      <p className="project-item__model">{name}</p>
                      <p className="project-item__details">{describeDetails(item, product).join(' · ')}</p>
                    </div>
                    <div className="project-item__actions">
                      <button
                        type="button"
                        className="text-link"
                        aria-label={`Uredi: ${label}`}
                        onClick={() => {
                          dispatch({ type: 'project/startEdit', id: item.id });
                          goTo('konfigurator');
                        }}
                      >
                        Uredi
                      </button>
                      <button type="button" className="text-link" aria-label={`Dupliraj: ${label}`} onClick={() => dispatch({ type: 'project/duplicate', id: item.id })}>
                        Dupliraj
                      </button>
                      <button type="button" className="text-link text-link--danger" aria-label={`Ukloni: ${label}`} onClick={() => dispatch({ type: 'project/remove', id: item.id })}>
                        Ukloni
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <aside className="project__summary" aria-label="Sažetak projekta">
              <p className="project__count">
                <strong>{total}</strong> vrata · {items.length} {stavkeLabel(items.length)}
              </p>
              <p className="muted small">Mjesto montaže: {location.trim() || 'nije navedeno'}</p>
              <EstimateView items={items} location={location} />
              <button type="button" className="btn btn--primary btn--block" onClick={() => openInquiry('project')}>
                Nastavi na upit
                <ArrowIcon />
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => goTo('konfigurator')}>
                Dodaj još vrata
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function stavkeLabel(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'stavka';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'stavke';
  return 'stavki';
}
