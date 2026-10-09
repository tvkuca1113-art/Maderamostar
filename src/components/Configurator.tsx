import { useMemo, useState } from 'react';
import { getProduct, products } from '../data';
import { FINISHES, HANDLES, HANDLE_SIDES, ROOMS, featureLabel, hasHandleSideChoice, roomLabel, type Option } from '../lib/options';
import { isValid, quantityOf, validateConfig } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { DoorConfig } from '../types';
import { TextField } from './fields';
import { ArrowIcon } from './Header';
import { SelectionSummary } from './SelectionSummary';
import { ViewerPanel } from './ViewerPanel';
import { optSrcSet } from '../lib/images';

function OptionGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  approvedIds,
  hint,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  approvedIds?: string[];
  hint?: string;
}) {
  const needsConfirmation = !approvedIds || approvedIds.length === 0;
  return (
    <fieldset className="opt-group">
      <legend>
        {legend}
        {needsConfirmation && <span className="badge">Dostupnost uz potvrdu</span>}
      </legend>
      {hint && <p className="field__hint">{hint}</p>}
      <div className="opt-group__items">
        {options.map((o) => (
          <label key={o.id} className={`opt${value === o.id ? ' is-active' : ''}`}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.swatch && <span className="opt__swatch" style={{ background: o.swatch }} aria-hidden="true" />}
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Configurator() {
  const { state, dispatch } = useStore();
  const { openInquiry, goTo } = useUi();
  const { draft, editingId, items, lastAdded, location } = state;
  const product = getProduct(draft.productId) ?? products[0];
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validateConfig(draft), [draft]);
  const shown = submitted ? errors : {};
  const set = (patch: Partial<DoorConfig>) => dispatch({ type: 'draft/set', patch });
  const added = lastAdded ? items.find((i) => i.id === lastAdded.id) : undefined;
  const addedIndex = added ? items.indexOf(added) : -1;

  const commit = (action: 'add' | 'inquiry') => {
    setSubmitted(true);
    if (!isValid(errors)) {
      document.querySelector<HTMLElement>('#konfigurator [aria-invalid="true"]')?.focus();
      return;
    }
    setSubmitted(false);
    if (action === 'inquiry') {
      openInquiry('draft');
      return;
    }
    dispatch(editingId ? { type: 'project/saveEdit' } : { type: 'project/addDraft' });
  };

  return (
    <section className="section configurator" id="konfigurator" aria-labelledby="konfigurator-naslov">
      <div className="container">
        <div className="section__head">
          <h2 id="konfigurator-naslov">Vaša vrata, u svakom detalju.</h2>
          <p className="section__lead">Istražite izgled, odaberite detalje i dodajte vrata svom upitu.</p>
        </div>

        <div className="configurator__grid">
          <ViewerPanel product={product} cfg={draft} />

          <div className="config-panel">
            {editingId && (
              <p className="notice notice--edit">
                Uređujete stavku: <strong>{roomLabel(draft, items.findIndex((i) => i.id === editingId))}</strong>
              </p>
            )}

            <fieldset className="opt-group">
              <legend>Model</legend>
              <div className="model-picker">
                {products.map((p) => (
                  <label key={p.id} className={`model-option${p.id === product.id ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="model"
                      value={p.id}
                      checked={p.id === product.id}
                      onChange={() => dispatch({ type: 'draft/selectProduct', productId: p.id })}
                    />
                    <picture>
                      <source type="image/avif" srcSet={optSrcSet(p.image, [480], 'avif')} />
                      <img src={p.image} alt="" loading="lazy" width={60} height={75} />
                    </picture>
                    <span className="model-option__name">{p.displayName}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="config-panel__block">
              <h3 className="h-small">Osobine prikazane izvedbe</h3>
              <ul className="feature-list feature-list--inline">
                {product.observedFeatures.map((f) => (
                  <li key={f}>{featureLabel(f)}</li>
                ))}
              </ul>
            </div>

            <div className="config-panel__block config-panel__wishes">
              <h3 className="h-small">Želje za ponudu</h3>
              <OptionGroup
                name="obrada"
                legend="Željena obrada"
                options={FINISHES}
                value={draft.finish}
                onChange={(finish) => set({ finish })}
                approvedIds={product.manufacturingOptions.approvedFinishIds}
              />
              <OptionGroup
                name="kvaka"
                legend="Željena kvaka"
                options={HANDLES}
                value={draft.handle}
                onChange={(handle) => set({ handle })}
                approvedIds={product.manufacturingOptions.approvedHardwareIds}
              />
              {hasHandleSideChoice(product) && (
                <OptionGroup
                  name="strana"
                  legend="Način otvaranja"
                  hint="Strana kvake gledano s prikazane strane vrata, s koje se vrata guraju. Ako niste sigurni, Madera potvrđuje smjer pri mjerenju."
                  options={HANDLE_SIDES}
                  value={draft.handleSide}
                  onChange={(handleSide) => set({ handleSide })}
                  approvedIds={['sve']}
                />
              )}
            </div>

            <div className="config-panel__block">
              <h3 className="h-small">Mjere i količina</h3>
              <div className="form-grid">
                <TextField
                  id="kfg-sirina"
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
                  id="kfg-visina"
                  label="Visina otvora (cm)"
                  inputMode="decimal"
                  placeholder="npr. 200"
                  autoComplete="off"
                  value={draft.heightCm}
                  disabled={draft.dimsUnknown}
                  onChange={(v) => set({ heightCm: v })}
                  error={shown.heightCm}
                />
                <label className="check form-grid__full">
                  <input type="checkbox" checked={draft.dimsUnknown} onChange={(e) => set({ dimsUnknown: e.target.checked })} />
                  <span>Ne znam mjere</span>
                </label>
                <TextField
                  id="kfg-zid"
                  label="Debljina zida (cm)"
                  hint="Ako je poznata."
                  inputMode="decimal"
                  placeholder="npr. 12"
                  autoComplete="off"
                  value={draft.wallCm}
                  onChange={(v) => set({ wallCm: v })}
                  error={shown.wallCm}
                />
                <TextField
                  id="kfg-kolicina"
                  label="Broj vrata"
                  inputMode="numeric"
                  autoComplete="off"
                  value={draft.quantity}
                  onChange={(v) => set({ quantity: v })}
                  error={shown.quantity}
                />
                <div className="field">
                  <label htmlFor="kfg-prostorija">Prostorija</label>
                  <select id="kfg-prostorija" value={draft.room} onChange={(e) => set({ room: e.target.value })}>
                    <option value="">Odaberite prostoriju</option>
                    {ROOMS.map((r) => (
                      <option key={r} value={r}>
                        {r === 'Drugo' ? 'Drugo (upišite naziv)' : r}
                      </option>
                    ))}
                  </select>
                </div>
                {draft.room === 'Drugo' && (
                  <TextField
                    id="kfg-prostorija-naziv"
                    label="Naziv prostorije"
                    placeholder="npr. Dječija soba"
                    value={draft.roomCustom}
                    onChange={(v) => set({ roomCustom: v })}
                    maxLength={40}
                  />
                )}
              </div>
            </div>

            <div className="config-panel__summary">
              <h3 className="h-small">Sažetak izbora</h3>
              <SelectionSummary cfg={draft} location={location} />
            </div>

            <div className="config-panel__actions">
              <button type="button" className="btn btn--primary btn--block" onClick={() => commit('add')}>
                {editingId ? 'Spremi izmjene' : 'Dodaj u moj projekt'}
                <ArrowIcon />
              </button>
              {editingId ? (
                <button type="button" className="btn btn--ghost btn--block" onClick={() => dispatch({ type: 'project/cancelEdit' })}>
                  Odustani od izmjena
                </button>
              ) : (
                <button type="button" className="btn btn--ghost btn--block" onClick={() => commit('inquiry')}>
                  Zatraži ponudu za ova vrata
                </button>
              )}
            </div>

            <div className="config-panel__status" role="status" aria-live="polite">
              {added && (
                <div className="notice notice--success">
                  <p>
                    {lastAdded?.mode === 'saved' ? 'Izmjene su spremljene' : 'Dodano u projekt'}:{' '}
                    <strong>
                      {roomLabel(added, addedIndex)} — {getProduct(added.productId)?.displayName}, {quantityOf(added)} kom.
                    </strong>
                  </p>
                  <p className="notice__links">
                    <button type="button" className="text-link" onClick={() => goTo('projekt')}>
                      Pogledaj projekt ({items.length})
                    </button>
                    <button type="button" className="text-link" onClick={() => goTo('modeli')}>
                      Nazad na katalog
                    </button>
                    <button type="button" className="text-link" onClick={() => dispatch({ type: 'notice/dismiss' })}>
                      Dodaj još vrata
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
