import { useMemo, useRef, useState, type FormEvent } from 'react';
import { getProduct, siteConfig } from '../data';
import { buildInquiryJson, buildInquiryText, copyText, describeDetails, downloadFile, type InquiryContact } from '../lib/inquiry';
import { roomLabel } from '../lib/options';
import { isValid, quantityOf, validateConfig } from '../lib/validation';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Dialog } from './Dialog';
import { PlacesDatalist, TextField } from './fields';

type Errors = Partial<Record<'name' | 'phone' | 'location', string>>;
type SendState = 'idle' | 'sending' | 'sent' | 'error';

function validateContact(c: InquiryContact, location: string): Errors {
  const e: Errors = {};
  if (!c.name.trim()) e.name = 'Unesite ime.';
  const digits = c.phone.replace(/\D/g, '');
  if (!c.phone.trim()) e.phone = 'Unesite broj telefona.';
  else if (!/^[+\d\s/().-]+$/.test(c.phone) || digits.length < 6) e.phone = 'Provjerite broj telefona, npr. 061 123 456.';
  if (!location.trim()) e.location = 'Unesite mjesto montaže, npr. Mostar.';
  return e;
}

/**
 * Pregled upita i kontakt. Bez potvrđenog kanala (endpoint/email su null) upit se samo priprema:
 * kopiranje, preuzimanje i poziv. Kontaktni podaci postoje samo u memoriji ovog prozora.
 */
export function InquiryDialog() {
  const { inquiry, closeInquiry, goTo } = useUi();
  const { state, dispatch } = useStore();
  const [contact, setContact] = useState<InquiryContact>({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [send, setSend] = useState<SendState>('idle');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const items = useMemo(
    () => (inquiry === 'project' && state.items.length > 0 ? state.items : [state.draft]),
    [inquiry, state.items, state.draft],
  );
  const itemsValid = items.every((i) => isValid(validateConfig(i)));
  const errors = validateContact(contact, state.location);
  const shown = submitted ? errors : {};
  const text = buildInquiryText(items, state.location, getProduct, contact);
  const endpoint = siteConfig.contactForm.endpoint;
  const total = items.reduce((s, i) => s + quantityOf(i), 0);

  const close = () => {
    setSubmitted(false);
    setPrepared(false);
    setCopyMsg('');
    setSend('idle');
    closeInquiry();
  };

  if (!inquiry) return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !itemsValid) {
      e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    if (!endpoint) {
      setPrepared(true);
      return;
    }
    // Stvarni kanal: uspjeh tek nakon potvrđenog odgovora servera; kod greške upit ostaje.
    setSend('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildInquiryJson(items, state.location, getProduct, contact), text }),
      });
      setSend(res.ok ? 'sent' : 'error');
    } catch {
      setSend('error');
    }
  };

  const onCopy = async () => {
    const ok = await copyText(text);
    if (ok) setCopyMsg('Upit je kopiran. Zalijepite ga u poruku Maderi.');
    else {
      setCopyMsg('Kopiranje nije uspjelo. Tekst ispod je označen; kopirajte ga ručno.');
      textRef.current?.focus();
      textRef.current?.select();
    }
  };

  const setField = (k: keyof InquiryContact) => (v: string) => {
    setContact((c) => ({ ...c, [k]: v }));
    setPrepared(false);
    setSend((s) => (s === 'sent' ? s : 'idle'));
  };

  return (
    <Dialog open onClose={close} labelledBy="upit-naslov" className="dialog--inquiry" initialFocus="#upit-ime">
      <button type="button" className="dialog__close" onClick={close} aria-label="Zatvori upit">
        ×
      </button>
      <div className="inquiry">
        <h2 id="upit-naslov">Pregled upita</h2>
        <p className="muted">
          {items.length} {items.length === 1 ? 'stavka' : 'stavke'} · ukupno {total} vrata. Konačnu cijenu, mjere i dostupne opcije potvrđuje Madera.
        </p>

        <ol className="inquiry__items">
          {items.map((it, i) => {
            const p = getProduct(it.productId);
            return (
              <li key={'id' in it ? (it as { id: string }).id : 'izbor'}>
                <strong>
                  {roomLabel(it, i)}: {p?.displayName}
                </strong>
                <span>{describeDetails(it, p).join(' · ')}</span>
              </li>
            );
          })}
        </ol>
        {!itemsValid && (
          <p className="notice notice--warn">
            Izbor nije potpun (mjere ili broj vrata).{' '}
            <button
              type="button"
              className="text-link"
              onClick={() => {
                close();
                goTo('konfigurator');
              }}
            >
              Dopunite ga u konfiguratoru
            </button>
            .
          </p>
        )}

        <form className="inquiry__form" onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            <TextField id="upit-ime" label="Ime *" autoComplete="name" value={contact.name} onChange={setField('name')} error={shown.name} />
            <TextField
              id="upit-telefon"
              label="Telefon *"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={contact.phone}
              onChange={setField('phone')}
              error={shown.phone}
            />
            <TextField
              id="upit-mjesto"
              label="Mjesto montaže *"
              list="mjesta-montaze"
              autoComplete="address-level2"
              placeholder="npr. Mostar"
              value={state.location}
              onChange={(v) => {
                dispatch({ type: 'location/set', location: v });
                setPrepared(false);
              }}
              error={shown.location}
              hint="Tačna adresa dogovara se kasnije."
            />
            <div className="field form-grid__full">
              <label htmlFor="upit-poruka">Poruka (nije obavezno)</label>
              <textarea id="upit-poruka" rows={3} value={contact.message} onChange={(e) => setField('message')(e.target.value)} maxLength={1000} />
            </div>
          </div>
          <PlacesDatalist />
          <div className="inquiry__submit">
            <button type="submit" className="btn btn--primary" disabled={send === 'sending'}>
              {endpoint ? (send === 'sending' ? 'Slanje…' : 'Pošalji upit') : 'Pripremi upit'}
            </button>
            <p className="muted small">Podaci se ne spremaju na ovom uređaju.</p>
          </div>
        </form>

        <div role="status" aria-live="polite" className="inquiry__status">
          {prepared && (
            <p className="notice notice--success">
              <strong>Upit je pripremljen. Kontaktirajte Maderu i podijelite svoj izbor.</strong>
            </p>
          )}
          {send === 'sent' && <p className="notice notice--success">Upit je poslan. Madera će vas kontaktirati.</p>}
          {send === 'error' && <p className="notice notice--warn">Slanje nije uspjelo. Upit je sačuvan ispod; kopirajte ga ili pozovite Maderu.</p>}
        </div>

        {(prepared || send === 'error' || send === 'sent') && (
          <div className="inquiry__prepared">
            <label htmlFor="upit-tekst" className="h-small">
              Tekst upita
            </label>
            <textarea id="upit-tekst" ref={textRef} className="inquiry__text" readOnly value={text} rows={8} />
            <div className="inquiry__actions">
              <button type="button" className="btn btn--primary" onClick={onCopy}>
                Kopiraj upit
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => downloadFile('madera-upit.txt', text, 'text/plain;charset=utf-8')}>
                Preuzmi svoj izbor
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() =>
                  downloadFile('madera-upit.json', JSON.stringify(buildInquiryJson(items, state.location, getProduct, contact), null, 2), 'application/json')
                }
              >
                Preuzmi JSON
              </button>
              <a className="btn btn--dark" href={siteConfig.phoneHref}>
                Pozovi Maderu
              </a>
              {siteConfig.whatsapp.enabled && (
                <a
                  className="btn btn--ghost"
                  href={`https://wa.me/${siteConfig.whatsapp.phoneE164Digits}?text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Otvori u WhatsAppu
                </a>
              )}
            </div>
            <p className="small" role="status" aria-live="polite">
              {copyMsg}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
