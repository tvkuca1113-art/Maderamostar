import { useEffect, useRef } from 'react';
import { getProduct } from '../data';
import { describeDetails } from '../lib/inquiry';
import { ROOMS, roomLabel, stavkeLabel } from '../lib/options';
import { quantityOf } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { ProjectItem } from '../types';
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
          <h2 id="projekt-naslov">Moj izbor</h2>
          <p className="section__lead">Jedan izbor za cijeli dom: dodajte vrata za svaku prostoriju i pošaljite jedan pregledan upit.</p>
        </div>

        {items.length === 0 ? (
          <div className="empty project__empty">
            <p>Moj izbor je još prazan.</p>
            <p>Odaberite model u katalogu ili konfiguratoru, zatim kliknite „Dodaj u Moj izbor”.</p>
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
            <ol className="project__list" aria-label="Stavke u Mom izboru">
              {items.map((item, i) => {
                const product = getProduct(item.productId);
                const name = product?.displayName ?? item.productId;
                const label = roomLabel(item, i);
                return (
                  <li key={item.id} className={`project-item${editingId === item.id ? ' is-editing' : ''}`}>
                    {product && <img className="project-item__thumb" src={product.image} alt="" width={64} height={80} loading="lazy" />}
                    <div className="project-item__body">
                      <RoomEditor item={item} index={i} focus={state.lastDuplicated === item.id} />
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

            <aside className="project__summary" aria-label="Sažetak Mog izbora">
              <p className="project__count">
                <strong>{total}</strong> vrata · {items.length} {stavkeLabel(items.length)}
              </p>
              <p className="muted small">Mjesto montaže: {location.trim() || 'nije navedeno'}</p>
              <EstimateView items={items} location={location} />
              <button type="button" className="btn btn--primary btn--block" onClick={() => openInquiry('project')}>
                Ponuda za cijeli izbor ({total} vrata)
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


/** Prostorija se mijenja direktno u stavci; poslije dupliranja fokus ide na ovaj izbor. */
function RoomEditor({ item, index, focus }: { item: ProjectItem; index: number; focus: boolean }) {
  const { dispatch } = useStore();
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  const id = `prostorija-${item.id}`;
  return (
    <div className="room-editor">
      <label htmlFor={id} className="visually-hidden">
        Prostorija za stavku {index + 1}
      </label>
      <select
        id={id}
        ref={ref}
        className="room-editor__select"
        value={item.room}
        onChange={(e) => dispatch({ type: 'project/update', id: item.id, patch: { room: e.target.value } })}
      >
        <option value="">{roomLabel({ room: '', roomCustom: '' }, index)}</option>
        {ROOMS.map((r) => (
          <option key={r} value={r}>
            {r === 'Drugo' ? 'Drugo (upišite naziv)' : r}
          </option>
        ))}
      </select>
      {item.room === 'Drugo' && (
        <input
          className="room-editor__input"
          aria-label={`Naziv prostorije za stavku ${index + 1}`}
          placeholder="npr. Dječija soba"
          maxLength={40}
          value={item.roomCustom}
          onChange={(e) => dispatch({ type: 'project/update', id: item.id, patch: { roomCustom: e.target.value } })}
        />
      )}
    </div>
  );
}
