import { useMemo, useState, type FormEvent } from 'react';
import { products } from '../data';
import { isValid, validateConfig } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { DoorConfig, ProjectItem } from '../types';
import { EstimateView } from './EstimateView';
import { PlacesDatalist, TextField } from './fields';
import { ArrowIcon } from './Header';
import { SelectionSummary } from './SelectionSummary';

function sameConfig(a: DoorConfig, b: ProjectItem): boolean {
  const { id: _id, ...rest } = b;
  return (Object.keys(rest) as (keyof DoorConfig)[]).every((k) => rest[k] === a[k]);
}

export function QuickCalculator() {
  const { state, dispatch } = useStore();
  const { openInquiry, goTo } = useUi();
  const { draft, items, location } = state;
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validateConfig(draft), [draft]);
  const valid = isValid(errors);
  const shown = submitted ? errors : {};
  const set = (patch: Partial<DoorConfig>) => dispatch({ type: 'draft/set', patch });
  const inProject = items.some((it) => sameConfig(draft, it));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) {
      const firstInvalid = (e.currentTarget as HTMLFormElement).querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
    }
  };

  return (
    <section className="calc" id="kalkulator" aria-labelledby="kalkulator-naslov">
      <div className="container">
        <div className="calc__bar">
          <div className="calc__intro">
            <h2 id="kalkulator-naslov" className="calc__title">
              Kalkulator izrade vrata
            </h2>
            <p className="calc__desc">Odaberite vrata i osnovne mjere. Pripremite upit za svoj dom.</p>
          </div>
          <form className="calc__form" onSubmit={onSubmit} noValidate>
            <div className="field calc__model">
              <label htmlFor="calc-model">Odabrani model</label>
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
              id="calc-sirina"
              label="Širina otvora (cm)"
              inputMode="decimal"
              placeholder="npr. 80"
              autoComplete="off"
              value={draft.widthCm}
              disabled={draft.dimsUnknown}
              onChange={(v) => set({ widthCm: v })}
              error={shown.widthCm}
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
            />
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
            />
            <button type="submit" className="btn btn--primary calc__submit">
              Pripremi procjenu
              <ArrowIcon />
            </button>
            <label className="check calc__unknown">
              <input type="checkbox" checked={draft.dimsUnknown} onChange={(e) => set({ dimsUnknown: e.target.checked })} />
              <span>Ne znam mjere</span>
            </label>
            <p className="calc__help">Konačna ponuda nakon potvrde mjera i odabrane izvedbe.</p>
          </form>
          <PlacesDatalist />
        </div>

        <div className="calc__result" role="status" aria-live="polite">
          {submitted && valid && (
            <div className="result-card">
              <div className="result-card__main">
                <EstimateView items={items.length > 0 ? items : [draft]} location={location} />
                <SelectionSummary cfg={draft} location={location} items={items} />
              </div>
              <div className="result-card__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => openInquiry(items.length > 0 ? 'project' : 'draft')}
                >
                  Nastavi na upit
                  <ArrowIcon />
                </button>
                {!inProject && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      dispatch({ type: 'project/addDraft' });
                      goTo('projekt');
                    }}
                  >
                    Dodaj u moj projekt
                  </button>
                )}
                <a href="#konfigurator" className="text-link">
                  Detalji u konfiguratoru
                </a>
              </div>
              {!inProject && items.length > 0 && (
                <p className="result-card__note">
                  Trenutni izbor još nije dodan u projekt. Upit sadrži prostorije iz projekta; dodajte ovaj izbor ako ga želite uključiti.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
