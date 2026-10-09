import { useMemo, useState, type FormEvent } from 'react';
import { getProduct, pricing, products } from '../data';
import { describeDimensions } from '../lib/inquiry';
import { roomLabel, stavkeLabel } from '../lib/options';
import { isPricingActive } from '../lib/pricing';
import { isValid, quantityOf, validateConfig } from '../lib/validation';
import { draftInProject, useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { DoorConfig } from '../types';
import { EstimateView } from './EstimateView';
import { PlacesDatalist, TextField } from './fields';
import { ArrowIcon } from './Header';

export function plannerTitle(): string {
  return isPricingActive(pricing) ? 'Kalkulator izrade vrata' : 'Planer vrata za cijeli dom';
}

/**
 * Planer (dok cjenovnik nije odobren) ili kalkulator (nakon odobrenja).
 * Obuhvat je uvijek eksplicitan: „ova vrata” = trenutni izbor, „cijeli izbor” = spremljene stavke.
 */
export function QuickCalculator() {
  const { state, dispatch } = useStore();
  const { openInquiry, goTo } = useUi();
  const { draft, items, location } = state;
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validateConfig(draft), [draft]);
  const valid = isValid(errors);
  const shown = submitted ? errors : {};
  const set = (patch: Partial<DoorConfig>) => dispatch({ type: 'draft/set', patch });
  const inProject = draftInProject(state);
  const priced = isPricingActive(pricing);
  const product = getProduct(draft.productId);
  const projectTotal = items.reduce((s, i) => s + quantityOf(i), 0);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  };

  return (
    <section className="calc" id="kalkulator" aria-labelledby="kalkulator-naslov">
      <div className="container">
        <div className="calc__bar">
          <div className="calc__intro">
            <h2 id="kalkulator-naslov" className="calc__title">
              {plannerTitle()}
            </h2>
            {!priced && <p className="calc__badge">Cijena na upit</p>}
            <p className="calc__desc">
              {priced
                ? 'Odaberite vrata i osnovne mjere za informativnu procjenu.'
                : 'Za koliko prostorija tražite vrata? Unesite model, broj vrata i mjesto — pregled za ponudu je spreman u nekoliko koraka.'}
            </p>
          </div>
          <form className="calc__form" onSubmit={onSubmit} noValidate>
            <div className="field calc__model">
              <label htmlFor="calc-model">Model</label>
              <select
                id="calc-model"
                value={draft.productId}
                onChange={(e) => dispatch({ type: 'draft/selectProduct', productId: e.target.value })}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="calc-kolicina"
              label="Broj vrata"
              inputMode="numeric"
              autoComplete="off"
              value={draft.quantity}
              onChange={(v) => set({ quantity: v })}
              error={shown.quantity}
              className="calc__qty"
            />
            <TextField
              id="calc-mjesto"
              label="Mjesto montaže"
              placeholder="npr. Mostar"
              list="mjesta-montaze"
              autoComplete="address-level2"
              value={location}
              onChange={(v) => dispatch({ type: 'location/set', location: v })}
              className="calc__place"
            />
            <TextField
              id="calc-sirina"
              label="Širina otvora (cm)"
              inputMode="decimal"
              placeholder="npr. 80"
              autoComplete="off"
              value={draft.widthCm}
              disabled={draft.dimsUnknown}
              onChange={(v) => set({ widthCm: v })}
              error={shown.widthCm}
              className="calc__w"
            />
            <TextField
              id="calc-visina"
              label="Visina otvora (cm)"
              inputMode="decimal"
              placeholder="npr. 200"
              autoComplete="off"
              value={draft.heightCm}
              disabled={draft.dimsUnknown}
              onChange={(v) => set({ heightCm: v })}
              error={shown.heightCm}
              className="calc__h"
            />
            <label className="check calc__unknown">
              <input type="checkbox" checked={draft.dimsUnknown} onChange={(e) => set({ dimsUnknown: e.target.checked })} />
              <span>Ne znam mjere</span>
            </label>
            <button type="submit" className="btn btn--primary calc__submit">
              {priced ? 'Izračunaj procjenu' : 'Pregledaj izbor'}
              <ArrowIcon />
            </button>
            <p className="calc__help">Konačna ponuda nakon potvrde mjera i odabrane izvedbe.</p>
          </form>
          <PlacesDatalist />
        </div>

        <div className="calc__result" role="status" aria-live="polite">
          {submitted && valid && (
            <div className="scope-grid">
              <article className="scope-card scope-card--current" aria-labelledby="planer-trenutna">
                <p className="tag">Trenutna vrata</p>
                <div className="scope-card__head">
                  {product && <img src={product.image} alt="" width={56} height={70} className="scope-card__thumb" />}
                  <div>
                    <h3 id="planer-trenutna" className="scope-card__title">
                      {product?.displayName}, {quantityOf(draft)} kom.
                    </h3>
                    <p className="scope-card__meta">
                      {describeDimensions(draft)} · {location.trim() || 'mjesto montaže nije navedeno'}
                    </p>
                  </div>
                </div>
                <EstimateView items={[draft]} location={location} />
                <div className="scope-card__actions">
                  <button type="button" className="btn btn--primary" onClick={() => openInquiry('draft')}>
                    Ponuda za ova vrata
                    <ArrowIcon />
                  </button>
                  {inProject ? (
                    <span className="badge badge--ok">Već su u Mom izboru</span>
                  ) : (
                    <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'project/addDraft' })}>
                      Dodaj u Moj izbor
                    </button>
                  )}
                </div>
              </article>

              <article className="scope-card" aria-labelledby="planer-izbor">
                <p className="tag">Moj izbor</p>
                <h3 id="planer-izbor" className="scope-card__title">
                  {items.length === 0 ? 'Još nema spremljenih vrata' : `${projectTotal} vrata · ${items.length} ${stavkeLabel(items.length)}`}
                </h3>
                {items.length > 0 && (
                  <ul className="scope-card__list">
                    {items.map((it, i) => (
                      <li key={it.id}>
                        {roomLabel(it, i)}: {getProduct(it.productId)?.displayName}, {quantityOf(it)} kom.
                      </li>
                    ))}
                  </ul>
                )}
                {!inProject && (
                  <p className="scope-card__note">
                    Trenutna vrata ({product?.displayName}, {quantityOf(draft)} kom.) nisu u Mom izboru.
                    {items.length > 0 ? ' Dodajte ih ako ih želite uključiti u ponudu za cijeli izbor.' : ' Dodajte ih, pa nastavite s drugim prostorijama.'}
                  </p>
                )}
                <div className="scope-card__actions">
                  {items.length > 0 ? (
                    <button type="button" className="btn btn--dark" onClick={() => openInquiry('project')}>
                      Ponuda za cijeli izbor ({projectTotal} vrata)
                    </button>
                  ) : null}
                  <button type="button" className="text-link" onClick={() => goTo('konfigurator')}>
                    Detalji u konfiguratoru
                  </button>
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
