import { useEffect, useMemo, useRef, useState } from 'react';
import { getProduct, products } from '../data';
import { optSrcSet } from '../lib/images';
import { FINISHES, HANDLES, HANDLE_SIDES, ROOMS, featureLabel, hasHandleSideChoice, roomLabel, type Option } from '../lib/options';
import { isValid, quantityOf, validateConfig, type ConfigErrors } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import type { DoorConfig, FinishId, HandleId, HandleSide, Product } from '../types';
import { TextField } from './fields';
import { ArrowIcon } from './Header';
import { OpeningDiagram } from './OpeningDiagram';
import { SelectionSummary } from './SelectionSummary';
import { ViewerPanel } from './ViewerPanel';

const STEPS = ['Model i izgled', 'Mjere i prostorija', 'Pregled i ponuda'] as const;
type Step = 0 | 1 | 2;

function swatchStyle(o: Option<string>, product: Product): React.CSSProperties {
  if (o.id === 'kao-na-fotografiji') return { backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  if (o.id === 'po-zelji') return { background: 'conic-gradient(#c9a45c, #b61e24, #3d5a80, #6a8e5a, #c9a45c)' };
  if (o.swatch) return { background: o.swatch };
  return {};
}

function SwatchGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  product,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  product: Product;
}) {
  return (
    <fieldset className="opt-group">
      <legend>
        {legend}: <span className="opt-group__value">{options.find((o) => o.id === value)?.label}</span>
      </legend>
      <div className="swatches">
        {options.map((o) => (
          <label key={o.id} className={`swatch${value === o.id ? ' is-active' : ''}`}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span className="swatch__dot" style={swatchStyle(o, product)} aria-hidden="true">
              {o.id === 'nisam-siguran' ? '?' : ''}
            </span>
            <span className="swatch__label">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function QuantityStepper({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const n = Number.parseInt(value, 10);
  const q = Number.isFinite(n) && n > 0 ? n : 1;
  return (
    <div className={`stepper-qty${error ? ' has-error' : ''}`}>
      <span className="stepper-qty__label" id="kfg-kolicina-brzo-oznaka">
        Broj ovih vrata
      </span>
      <div className="stepper-qty__controls" role="group" aria-labelledby="kfg-kolicina-brzo-oznaka">
        <button type="button" className="icon-btn" aria-label="Manje vrata" disabled={q <= 1} onClick={() => onChange(String(Math.max(1, q - 1)))}>
          −
        </button>
        <output className="stepper-qty__value" aria-live="polite">
          {Number.isFinite(n) && n > 0 ? n : value || '—'}
        </output>
        <button type="button" className="icon-btn" aria-label="Više vrata" disabled={q >= 99} onClick={() => onChange(String(Math.min(99, q + 1)))}>
          +
        </button>
      </div>
      <span className="stepper-qty__hint">Isti model za više prostorija? Povećajte broj ili kasnije duplirajte stavku.</span>
    </div>
  );
}

function PresetRow({ label, values, current, onPick }: { label: string; values: string[]; current: string; onPick: (v: string) => void }) {
  return (
    <div className="preset-row" role="group" aria-label={`${label}: brzi izbor (cm)`}>
      <span className="preset-row__label">{label}</span>
      {values.map((v) => (
        <button key={v} type="button" className={`chip chip--sm${current.trim() === v ? ' is-active' : ''}`} aria-pressed={current.trim() === v} onClick={() => onPick(v)}>
          {v}
        </button>
      ))}
      <span className="preset-row__unit">cm · ili upišite svoju mjeru</span>
    </div>
  );
}

const STEP2_FIELDS: (keyof ConfigErrors)[] = ['widthCm', 'heightCm', 'quantity', 'wallCm'];

export function Configurator() {
  const { state, dispatch } = useStore();
  const { openInquiry, goTo } = useUi();
  const { draft, editingId, items, lastAdded, location } = state;
  const product = getProduct(draft.productId) ?? products[0];
  const [step, setStep] = useState<Step>(0);
  const [showErrors, setShowErrors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const errors = useMemo(() => validateConfig(draft), [draft]);
  const shown = showErrors ? errors : {};
  const set = (patch: Partial<DoorConfig>) => dispatch({ type: 'draft/set', patch });
  const added = lastAdded ? items.find((i) => i.id === lastAdded.id) : undefined;
  const addedIndex = added ? items.indexOf(added) : -1;
  const sideChoice = hasHandleSideChoice(product);
  const defaultSide = product.observedHandleSideInPhoto === 'right' ? 'desno' : 'lijevo';

  // Uređivanje stavke počinje od prvog koraka; izbor se ne briše pri kretanju naprijed/nazad.
  useEffect(() => {
    if (editingId) setStep(0);
  }, [editingId]);

  const focusStep = () => {
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('.config-step h3')?.focus(), 0);
  };

  const goStep = (s: Step) => {
    setStep(s);
    focusStep();
  };

  /** Prelazak dalje s koraka mjera: greške uz polje, fokus na prvu grešku. */
  const validateStep2 = (): boolean => {
    setShowErrors(true);
    const first = STEP2_FIELDS.find((f) => errors[f]);
    if (!first) return true;
    setStep(1);
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
    return false;
  };

  const commit = (action: 'add' | 'inquiry') => {
    if (!isValid(errors) && !validateStep2()) return;
    setShowErrors(false);
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
          <h2 id="konfigurator-naslov">Složite svoja vrata.</h2>
          <p className="section__lead">Promijenite boju, kvaku, smjer i mjere — 3D prikaz se mijenja odmah. Otvorite vrata, priđite kvaki ili ih pogledajte s druge strane.</p>
        </div>

        <div className="configurator__grid">
          <ViewerPanel product={product} cfg={draft} />

          <div className="config-panel" ref={panelRef}>
            {editingId && (
              <p className="notice notice--edit">
                Uređujete stavku: <strong>{roomLabel(draft, items.findIndex((i) => i.id === editingId))}</strong>
              </p>
            )}

            <ol className="stepper" aria-label="Koraci konfiguratora">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    className={`stepper__btn${step === i ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
                    aria-current={step === i ? 'step' : undefined}
                    onClick={() => (i === 2 && step < 2 ? validateStep2() && goStep(2) : goStep(i as Step))}
                  >
                    <span className="stepper__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="stepper__label">{label}</span>
                  </button>
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="config-step">
                <h3 className="config-step__title" tabIndex={-1}>
                  1. Model i izgled
                </h3>
                <div className="current-model">
                  <img src={product.image} alt="" width={48} height={60} />
                  <div>
                    <p className="current-model__name">{product.displayName}</p>
                    <p className="current-model__meta">{product.observedFeatures.map(featureLabel).join(' · ')}</p>
                  </div>
                </div>
                <fieldset className="opt-group">
                  <legend>Drugi modeli</legend>
                  <div className="model-strip">
                    {products.map((p) => (
                      <label key={p.id} className={`model-option${p.id === product.id ? ' is-active' : ''}`} title={p.displayName}>
                        <input
                          type="radio"
                          name="model"
                          value={p.id}
                          checked={p.id === product.id}
                          onChange={() => dispatch({ type: 'draft/selectProduct', productId: p.id })}
                        />
                        <picture>
                          <source type="image/avif" srcSet={optSrcSet(p.image, [480], 'avif')} />
                          <img src={p.image} alt="" loading="lazy" width={56} height={70} />
                        </picture>
                        <span className="model-option__name">{p.displayName}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <QuantityStepper value={draft.quantity} onChange={(quantity) => set({ quantity })} error={shown.quantity} />
                <p className="config-hint">Obrade i kvake su želje za ponudu. Dostupnost za odabrani model potvrđuje Madera.</p>
                <SwatchGroup<FinishId>
                  name="obrada"
                  legend="Obrada"
                  options={FINISHES}
                  value={draft.finish}
                  onChange={(finish) => set({ finish })}
                  product={product}
                />
                <SwatchGroup<HandleId>
                  name="kvaka"
                  legend="Kvaka"
                  options={HANDLES}
                  value={draft.handle}
                  onChange={(handle) => set({ handle })}
                  product={product}
                />
                {sideChoice && (
                  <fieldset className="opt-group">
                    <legend>
                      Smjer otvaranja:{' '}
                      <span className="opt-group__value">
                        {draft.handleSide === 'nisam-siguran' ? 'potrebna potvrda' : draft.handleSide === 'lijevo' ? 'kvaka lijevo' : 'kvaka desno'}
                      </span>
                    </legend>
                    <p className="field__hint">Pogled odozgo; stojite na strani s koje gurate vrata (strelica).</p>
                    <div className="opening-options">
                      {HANDLE_SIDES.map((o) => (
                        <label key={o.id} className={`opening-option${draft.handleSide === o.id ? ' is-active' : ''}`}>
                          <input
                            type="radio"
                            name="strana"
                            value={o.id}
                            checked={draft.handleSide === o.id}
                            onChange={() => set({ handleSide: o.id as HandleSide })}
                          />
                          <OpeningDiagram handle={o.id === 'nisam-siguran' ? null : (o.id as 'lijevo' | 'desno')} />
                          <span>
                            {o.label}
                            {o.id === defaultSide && <small> · kao na fotografiji</small>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className="config-step__nav">
                  <button type="button" className="btn btn--primary btn--block" onClick={() => goStep(1)}>
                    Dalje: mjere i prostorija
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="config-step">
                <h3 className="config-step__title" tabIndex={-1}>
                  2. Mjere i prostorija
                </h3>
                <p className="config-hint">Približne mjere otvora pomažu ponudi i mijenjaju proporcije 3D prikaza. Tačne mjere potvrđuju se prije izrade.</p>
                {!draft.dimsUnknown && (
                  <div className="presets">
                    <PresetRow
                      label="Širina otvora"
                      values={['60', '70', '80', '90', '100']}
                      current={draft.widthCm}
                      onPick={(widthCm) => set({ widthCm })}
                    />
                    <PresetRow label="Visina otvora" values={['200', '205', '210', '220']} current={draft.heightCm} onPick={(heightCm) => set({ heightCm })} />
                  </div>
                )}
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
                      className="form-grid__full"
                    />
                  )}
                </div>
                <details className="more-options" open={!!draft.wallCm || !!shown.wallCm}>
                  <summary>Dodatne opcije</summary>
                  <TextField
                    id="kfg-zid"
                    label="Debljina zida (cm)"
                    hint="Ako je poznata. Nije ista mjera kao otvor ili krilo."
                    inputMode="decimal"
                    placeholder="npr. 12"
                    autoComplete="off"
                    value={draft.wallCm}
                    onChange={(v) => set({ wallCm: v })}
                    error={shown.wallCm}
                  />
                </details>
                <div className="config-step__nav config-step__nav--split">
                  <button type="button" className="btn btn--ghost" onClick={() => goStep(0)}>
                    Nazad
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => validateStep2() && goStep(2)}>
                    Dalje: pregled
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="config-step">
                <h3 className="config-step__title" tabIndex={-1}>
                  3. Pregled i ponuda
                </h3>
                <div className="current-model">
                  <img src={product.image} alt="" width={48} height={60} />
                  <div>
                    <p className="current-model__name">
                      {product.displayName}, {quantityOf(draft)} kom.
                    </p>
                    <p className="current-model__meta">{roomLabel(draft)}</p>
                  </div>
                </div>
                <SelectionSummary cfg={draft} location={location} />
                <div className="config-step__nav">
                  <button type="button" className="btn btn--primary btn--block" onClick={() => commit('add')}>
                    {editingId ? 'Spremi izmjene' : 'Dodaj u Moj izbor'}
                    <ArrowIcon />
                  </button>
                  {editingId ? (
                    <button type="button" className="btn btn--ghost btn--block" onClick={() => dispatch({ type: 'project/cancelEdit' })}>
                      Odustani od izmjena
                    </button>
                  ) : (
                    <button type="button" className="btn btn--ghost btn--block" onClick={() => commit('inquiry')}>
                      Ponuda za ova vrata
                    </button>
                  )}
                  <button type="button" className="text-link" onClick={() => goStep(1)}>
                    Nazad na mjere
                  </button>
                </div>
              </div>
            )}

            <div className="config-panel__status" role="status" aria-live="polite">
              {added && (
                <div className="notice notice--success">
                  <p>
                    {lastAdded?.mode === 'saved' ? 'Izmjene su spremljene' : 'Dodano u Moj izbor'}:{' '}
                    <strong>
                      {roomLabel(added, addedIndex)} — {getProduct(added.productId)?.displayName}, {quantityOf(added)} kom.
                    </strong>
                  </p>
                  <p className="notice__links">
                    <button type="button" className="text-link" onClick={() => goTo('projekt')}>
                      Pogledaj Moj izbor ({items.length})
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        dispatch({ type: 'notice/dismiss' });
                        goStep(0);
                      }}
                    >
                      Dodaj još vrata
                    </button>
                    <button type="button" className="text-link" onClick={() => goTo('modeli')}>
                      Nazad na katalog
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
